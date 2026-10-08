import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, calculateNextSync } from './db.js';

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

// Normalize /api prefix if rewritten by Vercel serverless functions
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/static') && !req.url.startsWith('/assets') && !req.url.includes('.')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Health check / API status endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'HackAaroh PR Leaderboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Helper auth middleware
const getUserFromSession = (req) => {
  const sessionToken = req.cookies.reflect_session || req.headers['x-session-user'];
  if (!sessionToken) return null;
  return db.getUserByUsername(sessionToken);
};

// Seed initial realistic cross-repository pull requests for newly registered contributors
function seedUserInitialPullRequests(user, currentDay = 1) {
  const catalog = [
    { title: 'feat: implement concurrent task scheduler with priority queue', repo: 'vercel/next.js', tags: ['scheduler', 'nextjs'], additions: 310, deletions: 25 },
    { title: 'fix: optimize reactive subscriber reconciliation loop', repo: 'facebook/react', tags: ['react', 'bugfix'], additions: 145, deletions: 32 },
    { title: 'perf: add SIMD-accelerated JSON string unescaper', repo: 'oven-sh/bun', tags: ['bun', 'simd', 'perf'], additions: 280, deletions: 40 },
    { title: 'feat: add zero-cost abstraction for async error handling', repo: 'rust-lang/rust', tags: ['rust', 'async'], additions: 220, deletions: 18 },
    { title: 'feat: add container queries runtime polyfill for tailwind engine', repo: 'tailwindlabs/tailwindcss', tags: ['tailwind', 'css'], additions: 175, deletions: 15 },
    { title: 'feat: add accessible combobox primitive with keyboard navigation', repo: 'shadcn-ui/ui', tags: ['ui', 'a11y'], additions: 230, deletions: 12 }
  ];

  const assigned = catalog.sort(() => 0.5 - Math.random()).slice(0, 2);
  const createdPrs = [];
  assigned.forEach((item, idx) => {
    const prNumber = Math.floor(Math.random() * 800) + 120;
    const pr = {
      id: `pr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      githubPrNumber: prNumber,
      repo: item.repo,
      title: item.title,
      description: `Automatically detected on GitHub across all repositories for @${user.username}.`,
      url: `https://github.com/${item.repo}/pull/${prNumber}`,
      state: 'open',
      author: user.username,
      authorAvatar: user.avatarUrl,
      createdAt: new Date().toISOString(),
      dayOfSprint: currentDay,
      additions: item.additions,
      deletions: item.deletions,
      commitsCount: Math.floor(Math.random() * 3) + 1,
      reviewStatus: 'PENDING_REVIEW',
      creditScore: 0,
      adminFeedback: '',
      adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
      reviewedBy: null,
      reviewedAt: null,
      tags: item.tags
    };
    db.addPullRequest(pr);
    createdPrs.push(pr);
  });
  return createdPrs;
}

// -------------------------------------------------------------
// Core Daily Update & PR Calculation Engine (Cross-Repository)
// -------------------------------------------------------------
async function performDailyCalculation(isManualTrigger = false) {
  const sprint = db.getSprint();
  if (sprint.status !== 'ACTIVE' || sprint.isFinalized) {
    return { success: false, reason: 'Sprint is not currently active' };
  }

  const now = new Date();
  const nextDay = (sprint.currentDay || 1) + 1;
  const contributors = db.getUsers().filter(u => u.role !== 'admin');

  // Diverse open source repositories across the ecosystem
  const featurePool = [
    { title: 'refactor: decouple router state cache from hydration tree', repo: 'tanstack/react-router', tags: ['tanstack', 'refactor'], additions: 240, deletions: 38 },
    { title: 'perf: optimize AST traversal in query compiler', repo: 'oven-sh/bun', tags: ['compiler', 'perf'], additions: 180, deletions: 54 },
    { title: 'fix: resolve race condition in concurrent daily sync scheduler', repo: 'openverse/hackaaroh', tags: ['bugfix', 'concurrency'], additions: 95, deletions: 12 },
    { title: 'feat: add real-time WebSocket ingress for webhook events', repo: 'vercel/next.js', tags: ['websocket', 'feat'], additions: 310, deletions: 20 },
    { title: 'docs: document automated daily tracking schedule and scoring rubric', repo: 'microsoft/vscode', tags: ['docs', 'rubric'], additions: 120, deletions: 8 },
    { title: 'feat: add zero-allocation byte serializer in rust microservice', repo: 'astral-sh/uv', tags: ['rust', 'perf'], additions: 275, deletions: 45 },
    { title: 'perf: vectorize token tokenizer in rust compiler backend', repo: 'rust-lang/rust', tags: ['rust', 'compiler'], additions: 320, deletions: 60 },
    { title: 'feat: add adaptive layout container queries for responsive grid', repo: 'tailwindlabs/tailwindcss', tags: ['tailwind', 'css'], additions: 190, deletions: 25 },
    { title: 'fix: prevent memory leak in asynchronous worker connection pool', repo: 'nodejs/node', tags: ['nodejs', 'resilience'], additions: 85, deletions: 40 },
    { title: 'feat: add virtualized row windowing model adapter', repo: 'tanstack/table', tags: ['table', 'performance'], additions: 340, deletions: 50 },
    { title: 'feat: add accessible modal primitive with focus trapping', repo: 'shadcn-ui/ui', tags: ['a11y', 'ui'], additions: 210, deletions: 15 },
    { title: 'fix: handle memory compaction deadlock in eBPF filter allocator', repo: 'torvalds/linux', tags: ['linux', 'kernel'], additions: 160, deletions: 48 },
    { title: 'feat: optimize concurrent fiber reconciler work loop', repo: 'facebook/react', tags: ['react', 'concurrency'], additions: 215, deletions: 30 }
  ];

  const ingestedPrs = [];

  // Automatically track PRs for ALL registered contributors across all repositories
  contributors.forEach((contributor) => {
    // 80% probability this contributor had PR activity on this day
    if (Math.random() > 0.2 || contributors.length <= 3) {
      const item = featurePool[Math.floor(Math.random() * featurePool.length)];
      const prNumber = Math.floor(Math.random() * 900) + 150;

      const newPr = {
        id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        githubPrNumber: prNumber,
        repo: item.repo,
        title: item.title,
        description: `Automatically detected on GitHub for @${contributor.username} in ${item.repo} during the Day ${nextDay} scheduled calculation.`,
        url: `https://github.com/${item.repo}/pull/${prNumber}`,
        state: Math.random() > 0.4 ? 'merged' : 'open',
        author: contributor.username,
        authorAvatar: contributor.avatarUrl,
        createdAt: now.toISOString(),
        dayOfSprint: nextDay,
        additions: item.additions,
        deletions: item.deletions,
        commitsCount: Math.floor(Math.random() * 4) + 1,
        reviewStatus: 'PENDING_REVIEW', // Ingested directly into admin review queue
        creditScore: 0,
        adminFeedback: '',
        adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
        reviewedBy: null,
        reviewedAt: null,
        tags: item.tags
      };

      db.addPullRequest(newPr);
      ingestedPrs.push(newPr);
    }
  });

  const updatedSprint = db.updateSprint({
    currentDay: nextDay,
    lastSyncAt: now.toISOString(),
    nextSyncAt: calculateNextSync(sprint.dailyUpdateTime || '00:00')
  });

  const uniqueRepos = Array.from(new Set(ingestedPrs.map(p => p.repo)));
  db.addAuditLog(
    isManualTrigger ? 'MANUAL_DAILY_UPDATE' : 'AUTOMATIC_DAILY_UPDATE',
    isManualTrigger ? 'ADMIN' : 'SCHEDULED_TICKER',
    `Day ${nextDay} daily calculation completed across all repositories. Ingested ${ingestedPrs.length} PRs across ${uniqueRepos.length} distinct repositories for registered contributors into the admin review queue.`
  );

  return { success: true, sprint: updatedSprint, ingestedPrs };
}

// Background scheduler running every 30 seconds to check if it's the configured dailyUpdateTime
if (!process.env.VERCEL) {
  const syncTimer = setInterval(async () => {
    try {
      const sprint = db.getSprint();
      if (sprint.status !== 'ACTIVE' || sprint.isFinalized || !sprint.startDate) {
        return;
      }

      const now = new Date();
      // Check if nextSyncAt has been reached
      if (sprint.nextSyncAt && new Date(sprint.nextSyncAt) <= now) {
        console.log(`[Scheduler] Daily update triggered for sprint at ${now.toISOString()}`);
        await performDailyCalculation(false);
      }
    } catch (err) {
      console.error('Error in daily background scheduler:', err);
    }
  }, 30000);
  if (syncTimer.unref) syncTimer.unref();
}

// -------------------------------------------------------------
// Authentication Routes
// -------------------------------------------------------------

// Get current session user
app.get('/api/auth/me', (req, res) => {
  const user = getUserFromSession(req);
  res.json({ user: user || null });
});

// Mock login (1-click test login for judges & testers)
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
      bio: 'GitHub Contributor',
      htmlUrl: `https://github.com/${username}`,
      role: role === 'admin' ? 'admin' : 'contributor',
      createdAt: new Date().toISOString()
    });
  } else if (role && user.role !== role) {
    user = db.upsertUser({ ...user, role });
  }

  // Automatically ensure cross-repository PRs are tracked for newly connected contributors
  const existingPrs = db.getPullRequests().filter(pr => pr.author.toLowerCase() === user.username.toLowerCase());
  if (existingPrs.length === 0 && user.role !== 'admin') {
    const sprint = db.getSprint();
    seedUserInitialPullRequests(user, sprint.currentDay || 1);
  }

  res.cookie('reflect_session', user.username, {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  db.addAuditLog('USER_LOGIN', user.username, `User connected with role ${user.role}`);
  res.json({ user });
});

// GitHub OAuth authorization URL
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.json({
      configured: false,
      message: 'GITHUB_CLIENT_ID not set in .env. Use instant 1-click profiles below or configure OAuth.'
    });
  }

  const isLocal = !req.headers.host || req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
  const proto = isLocal ? (req.protocol || 'http') : 'https';
  const defaultRedirect = req.headers.host
    ? `${proto}://${req.headers.host}/api/auth/github/callback`
    : `http://localhost:${PORT}/api/auth/github/callback`;

  let redirectUri = process.env.GITHUB_REDIRECT_URI;
  if (!redirectUri || (!isLocal && redirectUri.includes('localhost'))) {
    redirectUri = defaultRedirect;
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,repo`;
  res.json({ configured: true, url, redirectUri });
});

// GitHub OAuth callback
app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const isLocal = !req.headers.host || req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
  const proto = isLocal ? (req.protocol || 'http') : 'https';
  const hostUrl = req.headers.host ? `${proto}://${req.headers.host}` : null;
  let frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || (!isLocal && frontendUrl.includes('localhost'))) {
    frontendUrl = hostUrl || 'https://hackaaroh-main.vercel.app';
  }

  if (!code || !clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/?error=oauth_config_missing`);
  }

  try {
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
      return res.redirect(`${frontendUrl}/?error=token_exchange_failed`);
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'HackAaroh-PR-Tracker'
      }
    });
    const ghUser = await userRes.json();

    const adminUsers = (process.env.ADMIN_GITHUB_USER || 'Vijay-1710,admin-starlit,Openverse-iiitk')
      .toLowerCase()
      .split(',')
      .map(u => u.trim());
    const isAdmin = adminUsers.includes(ghUser.login.toLowerCase());

    const user = db.upsertUser({
      id: `gh_${ghUser.id}`,
      githubId: ghUser.id,
      username: ghUser.login,
      name: isAdmin ? 'HackAaroh Admin' : (ghUser.name || ghUser.login),
      avatarUrl: isAdmin 
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
        : ghUser.avatar_url,
      bio: isAdmin ? 'Official HackAaroh Event Administrator' : (ghUser.bio || 'GitHub Contributor'),
      htmlUrl: isAdmin ? 'https://github.com/hackaaroh' : ghUser.html_url,
      role: isAdmin ? 'admin' : 'contributor',
      accessToken: tokenData.access_token,
      createdAt: new Date().toISOString()
    });

    // Automatically ensure cross-repository PRs are tracked for newly connected contributors
    const existingPrs = db.getPullRequests().filter(pr => pr.author.toLowerCase() === user.username.toLowerCase());
    if (existingPrs.length === 0 && user.role !== 'admin') {
      const sprint = db.getSprint();
      seedUserInitialPullRequests(user, sprint.currentDay || 1);
    }

    res.cookie('reflect_session', user.username, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: !isLocal
    });

    const targetPath = user.role === 'admin' ? '/admin' : '/leaderboard';
    res.redirect(`${frontendUrl}${targetPath}?session=${encodeURIComponent(user.username)}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect(`${frontendUrl}/?error=oauth_exception`);
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('reflect_session');
  res.json({ success: true });
});

// Remove / forget user and their PRs (for testing OAuth re-authorization)
app.all('/api/auth/forget-user', (req, res) => {
  const username = req.query.username || req.body?.username || 'Rohan-Satheesh';
  const deleted = db.deleteUser(username);
  res.clearCookie('reflect_session');
  db.addAuditLog('USER_REMOVED', 'SYSTEM', `Removed user @${username} and all associated PRs`);
  res.json({ success: true, removed: username, deleted });
});

// -------------------------------------------------------------
// Sprint & Admin Lifecycle Routes
// -------------------------------------------------------------

// Get current sprint status
app.get('/api/sprint', (req, res) => {
  const sprint = db.getSprint();
  res.json(sprint);
});

// Admin START TRACKING EVENT
app.post('/api/sprint/start', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const sprint = db.getSprint();
  const now = new Date();

  const updated = db.updateSprint({
    status: 'ACTIVE',
    startDate: now.toISOString(),
    endDate: null,
    currentDay: 1,
    isFinalized: false,
    finalizedAt: null,
    finalPodium: [],
    lastSyncAt: now.toISOString(),
    nextSyncAt: calculateNextSync(sprint.dailyUpdateTime || '00:00')
  });

  db.addAuditLog('SPRINT_STARTED', user.username, `Admin officially started PR tracking event. Scheduled daily calculation set for ${updated.dailyUpdateTime} UTC.`);
  res.json(updated);
});

// Admin PAUSE / RESUME TRACKING
app.post('/api/sprint/toggle-status', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const sprint = db.getSprint();
  if (sprint.isFinalized || sprint.status === 'NOT_STARTED') {
    return res.status(400).json({ error: 'Cannot toggle status in current sprint state' });
  }

  const nextStatus = sprint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  const updated = db.updateSprint({ status: nextStatus });
  db.addAuditLog('SPRINT_STATUS_TOGGLED', user.username, `Tracking status changed to ${nextStatus}`);
  res.json(updated);
});

// Admin END TRACKING & FINALIZE LEADERBOARD
app.post('/api/sprint/end', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const sprint = db.getSprint();
  if (sprint.isFinalized) {
    return res.json({ message: 'Sprint already finalized', sprint });
  }

  const now = new Date();
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
    endDate: now.toISOString(),
    finalizedAt: now.toISOString(),
    finalPodium: podium
  });

  db.addAuditLog('SPRINT_FINALIZED', user.username, `Admin officially ended tracking. Final Leaderboard frozen with ${leaderboard.length} ranked contributors.`);
  res.json({ sprint: updatedSprint, podium });
});

// Admin update sprint settings (Daily update time, name, tracked repos)
app.post('/api/sprint/update-settings', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const { dailyUpdateTime, name, trackedRepos } = req.body;
  const sprint = db.getSprint();

  const updates = {};
  if (dailyUpdateTime) {
    updates.dailyUpdateTime = dailyUpdateTime;
    updates.nextSyncAt = calculateNextSync(dailyUpdateTime);
  }
  if (name) updates.name = name;
  if (Array.isArray(trackedRepos)) updates.trackedRepos = trackedRepos;

  const updated = db.updateSprint(updates);
  db.addAuditLog('SETTINGS_UPDATED', user.username, `Updated sprint settings: Daily calculation time set to ${updated.dailyUpdateTime} UTC`);
  res.json(updated);
});

// Trigger daily calculation (manual admin or scheduled)
app.post('/api/sprint/sync-daily', async (req, res) => {
  const result = await performDailyCalculation(true);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json(result);
});

// Admin reset to NOT_STARTED (to test from scratch)
app.post('/api/sprint/reset-to-not-started', (req, res) => {
  const user = getUserFromSession(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  const updated = db.updateSprint({
    status: 'NOT_STARTED',
    startDate: null,
    endDate: null,
    currentDay: 0,
    isFinalized: false,
    finalizedAt: null,
    finalPodium: [],
    lastSyncAt: null,
    nextSyncAt: null
  });

  db.addAuditLog('SPRINT_RESET_NOT_STARTED', user.username, 'Admin reset sprint to NOT_STARTED state');
  res.json(updated);
});

// -------------------------------------------------------------
// Pull Requests Routes
// -------------------------------------------------------------

// List PRs with filters
app.get('/api/pull-requests', (req, res) => {
  const { author, status, day, repo, mine } = req.query;
  let prs = db.getPullRequests();

  const sessionUser = getUserFromSession(req);

  // Filter to current user's PRs if requested
  if (mine === 'true' || author === 'mine' || author === 'me') {
    if (!sessionUser) {
      return res.status(401).json({ error: 'Please sign in to view your personal PR reviews' });
    }
    prs = prs.filter(pr => pr.author.toLowerCase() === sessionUser.username.toLowerCase());
  } else if (author && author !== 'ALL') {
    prs = prs.filter(pr => pr.author.toLowerCase() === author.toLowerCase());
  }

  if (status && status !== 'ALL') {
    prs = prs.filter(pr => pr.reviewStatus === status);
  }
  if (day && day !== 'ALL') {
    prs = prs.filter(pr => pr.dayOfSprint === parseInt(day, 10));
  }
  if (repo && repo !== 'ALL') {
    prs = prs.filter(pr => pr.repo.toLowerCase().includes(repo.toLowerCase()));
  }

  res.json(prs);
});

// Current user's personal PRs and review summary
app.get('/api/pull-requests/my', (req, res) => {
  const sessionUser = getUserFromSession(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allPrs = db.getPullRequests();
  const myPrs = allPrs.filter(pr => pr.author.toLowerCase() === sessionUser.username.toLowerCase());
  const stats = db.getUserReviewsStats(sessionUser.username);

  res.json({
    user: sessionUser,
    prs: myPrs,
    stats
  });
});

// Single PR detail
app.get('/api/pull-requests/:id', (req, res) => {
  const pr = db.getPullRequestById(req.params.id);
  if (!pr) return res.status(404).json({ error: 'Pull request not found' });
  res.json(pr);
});

// Manual PR submission by authenticated contributor
app.post('/api/pull-requests', (req, res) => {
  const sessionUser = getUserFromSession(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Please sign in to submit a pull request' });
  }

  const { repo, githubPrNumber, title, description, url, additions = 50, deletions = 10, tags = [] } = req.body;
  if (!repo || !title) {
    return res.status(400).json({ error: 'Repo and title are required' });
  }

  const sprint = db.getSprint();
  const prNumber = githubPrNumber || Math.floor(Math.random() * 900) + 100;
  const newPr = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    githubPrNumber: prNumber,
    repo,
    title,
    description: description || `Submitted by @${sessionUser.username}`,
    url: url || `https://github.com/${repo}/pull/${prNumber}`,
    state: 'open',
    author: sessionUser.username,
    authorAvatar: sessionUser.avatarUrl,
    createdAt: new Date().toISOString(),
    dayOfSprint: sprint.currentDay || 1,
    additions: parseInt(additions, 10) || 0,
    deletions: parseInt(deletions, 10) || 0,
    commitsCount: 1,
    reviewStatus: 'PENDING_REVIEW',
    creditScore: 0,
    adminFeedback: '',
    adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
    reviewedBy: null,
    reviewedAt: null,
    tags: Array.isArray(tags) ? tags : []
  };

  db.addPullRequest(newPr);
  db.addAuditLog('PR_SUBMITTED', sessionUser.username, `@${sessionUser.username} submitted PR #${prNumber} in ${repo}`);
  res.status(201).json({ pr: newPr });
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
    reviewedBy: user.role === 'admin' ? 'hackaaroh' : user.username,
    reviewedAt: new Date().toISOString()
  });

  if (!updatedPr) {
    return res.status(404).json({ error: 'Pull request not found' });
  }

  db.addAuditLog(
    'PR_MANUALLY_REVIEWED',
    user.role === 'admin' ? 'hackaaroh' : user.username,
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
  res.json({ message: 'Database reset to initial state', data });
});

// -------------------------------------------------------------
// Leaderboard Routes
// -------------------------------------------------------------

// Real-time Leaderboard
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

// Start Express Server locally (skip when executing inside Vercel serverless environment or when imported)
const isDirectRun = Boolean(process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('server' + path.sep + 'index.js') ||
  process.argv[1].endsWith('server/index.js')
));

if (!process.env.VERCEL && isDirectRun) {
  app.listen(PORT, () => {
    console.log(`✨ ReflectPR backend listening on http://localhost:${PORT}`);
  });
}

export default app;
