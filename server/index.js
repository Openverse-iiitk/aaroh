import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Helper auth middleware
const getUserFromSession = (req) => {
  const sessionToken = req.cookies.reflect_session || req.headers['x-session-user'];
  if (!sessionToken) return null;
  return db.getUserByUsername(sessionToken);
};

// -------------------------------------------------------------
// Authentication Routes
// -------------------------------------------------------------

// Get current session user
app.get('/api/auth/me', (req, res) => {
  const user = getUserFromSession(req);
  if (!user) {
    // Default guest state: contributor preview or null
    return res.json({ user: null });
  }
  res.json({ user });
});

// Mock login (instant 1-click test login for hackathon judges & testers)
app.post('/api/auth/mock-login', (req, res) => {
  const { username, role = 'contributor', name, avatarUrl } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let user = db.getUserByUsername(username);
  if (!user) {
    user = db.upsertUser({
      id: `usr_${username}`,
      username,
      name: name || username,
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      bio: 'Open source contributor',
      htmlUrl: `https://github.com/${username}`,
      role: role === 'admin' ? 'admin' : 'contributor',
      createdAt: new Date().toISOString()
    });
  }

  res.cookie('reflect_session', user.username, {
    httpOnly: false, // Accessible to client for easy display
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  db.addAuditLog('USER_LOGIN', user.username, `User logged in with role ${user.role}`);
  res.json({ user });
});

// GitHub OAuth authorization URL
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.json({
      configured: false,
      message: 'GITHUB_CLIENT_ID not set in environment. Use 1-Click contributor login or configure .env.'
    });
  }

  const redirectUri = process.env.GITHUB_REDIRECT_URI || `http://localhost:${PORT}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,repo`;
  res.json({ configured: true, url });
});

// GitHub OAuth callback
app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return res.redirect('/?error=oauth_config_missing');
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect('/?error=token_exchange_failed');
    }

    // Fetch user profile from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ReflectPR-App'
      }
    });
    const ghUser = await userRes.json();

    // Upsert user into database
    const user = db.upsertUser({
      id: `gh_${ghUser.id}`,
      githubId: ghUser.id,
      username: ghUser.login,
      name: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url,
      bio: ghUser.bio || 'GitHub Contributor',
      htmlUrl: ghUser.html_url,
      role: ghUser.login === (process.env.ADMIN_GITHUB_USER || 'admin-starlit') ? 'admin' : 'contributor',
      createdAt: new Date().toISOString()
    });

    res.cookie('reflect_session', user.username, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.redirect('/?login=success');
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect('/?error=oauth_exception');
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('reflect_session');
  res.json({ success: true });
});

// -------------------------------------------------------------
// Sprint & Tracking Control Routes
// -------------------------------------------------------------

// Get current sprint status & countdown
app.get('/api/sprint', (req, res) => {
  const sprint = db.getSprint();
  res.json(sprint);
});

// Admin toggle tracking status (ACTIVE / PAUSED)
app.post('/api/sprint/toggle-status', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const sprint = db.getSprint();
  if (sprint.isFinalized) {
    return res.status(400).json({ error: 'Sprint is already finalized' });
  }

  const nextStatus = sprint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  const updated = db.updateSprint({ status: nextStatus });
  db.addAuditLog('SPRINT_STATUS_TOGGLED', user.username, `Tracking status changed to ${nextStatus}`);
  res.json(updated);
});

// Admin END TRACKING and show FINAL LEADERBOARD
app.post('/api/sprint/end', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const sprint = db.getSprint();
  if (sprint.isFinalized) {
    return res.json({ message: 'Sprint already finalized', sprint });
  }

  // Calculate final leaderboard standings
  const leaderboard = db.getLeaderboard();
  const podium = leaderboard.slice(0, 3).map((item, idx) => ({
    rank: idx + 1,
    badge: idx === 0 ? 'GOLD_STAR' : idx === 1 ? 'SILVER_STAR' : 'BRONZE_STAR',
    username: item.user.username,
    name: item.user.name,
    avatarUrl: item.user.avatarUrl,
    totalCredits: item.totalCredits,
    totalPrs: item.totalPrs,
    mergedPrs: item.mergedPrs
  }));

  const updatedSprint = db.updateSprint({
    status: 'FINALIZED',
    isFinalized: true,
    finalizedAt: new Date().toISOString(),
    finalPodium: podium
  });

  db.addAuditLog('SPRINT_FINALIZED', user.username, `Sprint tracking officially ended. Final Leaderboard generated with ${leaderboard.length} ranked contributors.`);
  res.json({ sprint: updatedSprint, podium });
});

// Admin START NEW SPRINT
app.post('/api/sprint/start-new', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const updatedSprint = db.updateSprint({
    name: `Weekly Sprint Cycle #${Math.floor(Math.random() * 900 + 100)}`,
    status: 'ACTIVE',
    startDate: now.toISOString(),
    endDate: weekEnd.toISOString(),
    currentDay: 1,
    isFinalized: false,
    finalizedAt: null,
    finalPodium: [],
    lastSyncAt: now.toISOString(),
    nextSyncAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  });

  db.addAuditLog('NEW_SPRINT_STARTED', user.username, 'New 1-week tracking sprint initialized');
  res.json(updatedSprint);
});

// Admin / User trigger DAILY SYNC UPDATE
app.post('/api/sprint/sync-daily', (req, res) => {
  const sprint = db.getSprint();
  if (sprint.isFinalized) {
    return res.status(400).json({ error: 'Cannot sync a finalized sprint' });
  }

  const now = new Date();
  const nextDay = Math.min(sprint.totalDays, sprint.currentDay + 1);

  // Simulate or fetch new daily PRs for the current day
  const randomContributor = db.getUsers().filter(u => u.role !== 'admin')[Math.floor(Math.random() * 5)];
  
  const sampleTitles = [
    { title: 'refactor: isolate TanStack router state machine for seamless hydration', repo: 'tanstack/react-router', tags: ['tanstack', 'refactor'] },
    { title: 'feat: add virtualized row rendering to Leaderboard data table', repo: 'openverse/hackaaroh', tags: ['table', 'perf'] },
    { title: 'fix: edge case handling in daily credit score recalculation', repo: 'openverse/hackaaroh', tags: ['bugfix', 'credits'] },
    { title: 'chore: add GitHub webhook ingress validation with HMAC verification', repo: 'openverse/hackaaroh', tags: ['security', 'webhook'] }
  ];

  const picked = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];

  const newPr = {
    id: `pr-${Date.now()}`,
    githubPrNumber: Math.floor(Math.random() * 500) + 150,
    repo: picked.repo,
    title: picked.title,
    description: 'Automated daily sync ingestion from GitHub repository tracking pipeline.',
    url: `https://github.com/${picked.repo}/pull/${Math.floor(Math.random() * 500) + 150}`,
    state: Math.random() > 0.4 ? 'merged' : 'open',
    author: randomContributor?.username || 'manav-codes',
    authorAvatar: randomContributor?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: now.toISOString(),
    dayOfSprint: nextDay,
    additions: Math.floor(Math.random() * 300) + 40,
    deletions: Math.floor(Math.random() * 80) + 5,
    commitsCount: Math.floor(Math.random() * 4) + 1,
    reviewStatus: 'PENDING_REVIEW', // Added to admin review queue!
    creditScore: 0,
    adminFeedback: '',
    adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
    reviewedBy: null,
    reviewedAt: null,
    tags: picked.tags
  };

  db.addPullRequest(newPr);

  const updatedSprint = db.updateSprint({
    currentDay: nextDay,
    lastSyncAt: now.toISOString(),
    nextSyncAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  });

  db.addAuditLog('DAILY_SYNC_RUN', 'SYSTEM_SYNC', `Daily tracking updated to Day ${nextDay}. Ingested new PR #${newPr.githubPrNumber} by ${newPr.author}.`);

  res.json({
    message: `Daily sync completed for Day ${nextDay}`,
    sprint: updatedSprint,
    newPr
  });
});

// -------------------------------------------------------------
// Pull Requests Routes
// -------------------------------------------------------------

// List PRs with filters
app.get('/api/pull-requests', (req, res) => {
  const { author, status, day, repo } = req.query;
  let prs = db.getPullRequests();

  if (author) {
    prs = prs.filter(pr => pr.author.toLowerCase() === author.toLowerCase());
  }
  if (status) {
    prs = prs.filter(pr => pr.reviewStatus === status);
  }
  if (day) {
    prs = prs.filter(pr => pr.dayOfSprint === parseInt(day, 10));
  }
  if (repo) {
    prs = prs.filter(pr => pr.repo.toLowerCase().includes(repo.toLowerCase()));
  }

  res.json(prs);
});

// Single PR detail
app.get('/api/pull-requests/:id', (req, res) => {
  const pr = db.getPullRequestById(req.params.id);
  if (!pr) return res.status(404).json({ error: 'Pull request not found' });
  res.json(pr);
});

// Submit a custom PR to track
app.post('/api/pull-requests', (req, res) => {
  const user = getUserFromSession(req);
  const { repo, title, description, url, additions, deletions, commitsCount, tags } = req.body;

  if (!title || !repo) {
    return res.status(400).json({ error: 'Title and repo are required' });
  }

  const sprint = db.getSprint();
  if (sprint.isFinalized) {
    return res.status(400).json({ error: 'Cannot submit PRs to a finalized sprint' });
  }

  const newPr = {
    id: `pr-${Date.now()}`,
    githubPrNumber: Math.floor(Math.random() * 800) + 100,
    repo,
    title,
    description: description || 'User-submitted pull request for weekly sprint credit scoring.',
    url: url || `https://github.com/${repo}/pull/${Math.floor(Math.random() * 800) + 100}`,
    state: 'open',
    author: user ? user.username : 'manav-codes',
    authorAvatar: user ? user.avatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
    dayOfSprint: sprint.currentDay || 1,
    additions: parseInt(additions, 10) || 120,
    deletions: parseInt(deletions, 10) || 15,
    commitsCount: parseInt(commitsCount, 10) || 2,
    reviewStatus: 'PENDING_REVIEW', // Ready for admin manual review
    creditScore: 0,
    adminFeedback: '',
    adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
    reviewedBy: null,
    reviewedAt: null,
    tags: Array.isArray(tags) ? tags : ['contribution', 'community']
  };

  db.addPullRequest(newPr);
  db.addAuditLog('PR_SUBMITTED', newPr.author, `Submitted PR "${newPr.title}" to ${newPr.repo}`);

  res.status(201).json(newPr);
});

// -------------------------------------------------------------
// Admin Manual Review & Credit Scoring Routes
// -------------------------------------------------------------

// Admin manually reviews and assigns credit score to a PR
app.post('/api/admin/review-pr', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required to review and score PRs' });
  }

  const { prId, creditScore, feedback, criteria, reviewStatus = 'REVIEWED' } = req.body;
  if (!prId) {
    return res.status(400).json({ error: 'prId is required' });
  }

  const numericScore = Math.max(0, parseInt(creditScore, 10) || 0);

  const updatedPr = db.updatePullRequest(prId, {
    creditScore: numericScore,
    adminFeedback: feedback || '',
    adminCriteria: criteria || { quality: 20, complexity: 20, impact: 20, testCoverage: 20 },
    reviewStatus,
    reviewedBy: user.username,
    reviewedAt: new Date().toISOString()
  });

  if (!updatedPr) {
    return res.status(404).json({ error: 'Pull request not found' });
  }

  db.addAuditLog(
    'PR_MANUALLY_REVIEWED',
    user.username,
    `Admin reviewed PR #${updatedPr.githubPrNumber} (${updatedPr.author}) -> Awarded ${numericScore} credits with status ${reviewStatus}`
  );

  res.json({
    message: `PR #${updatedPr.githubPrNumber} reviewed successfully. ${numericScore} credits awarded.`,
    pr: updatedPr
  });
});

// Audit logs
app.get('/api/admin/audit-logs', (req, res) => {
  res.json(db.getAuditLogs());
});

// Reset database to initial seed (for testing)
app.post('/api/admin/reset-db', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  const data = db.reset();
  res.json({ message: 'Database reset to initial weekly sprint state', data });
});

// -------------------------------------------------------------
// Leaderboard Routes
// -------------------------------------------------------------

// Real-time / Daily Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const sprint = db.getSprint();
  const leaderboard = db.getLeaderboard();

  res.json({
    sprint,
    leaderboard,
    generatedAt: new Date().toISOString(),
    isFinalized: sprint.isFinalized,
    finalPodium: sprint.finalPodium || []
  });
});

// Final leaderboard
app.get('/api/leaderboard/final', (req, res) => {
  const sprint = db.getSprint();
  const leaderboard = db.getLeaderboard();

  res.json({
    isFinalized: sprint.isFinalized,
    finalizedAt: sprint.finalizedAt,
    podium: sprint.finalPodium || leaderboard.slice(0, 3),
    leaderboard
  });
});

// Serve static files from production build if available
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Express Server
app.listen(PORT, () => {
  console.log(`✨ ReflectPR backend listening on http://localhost:${PORT}`);
});
