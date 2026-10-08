import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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
  if (process.env.VERCEL && !req.url.startsWith('/api') && !req.url.startsWith('/static') && !req.url.startsWith('/assets') && !req.url.includes('.')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Ensure persistent database is loaded from Vercel Blob store
app.use(async (req, res, next) => {
  if (req.url.startsWith('/api')) {
    await db.ensureLoaded();
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

// -------------------------------------------------------------
// Security & Authentication Helpers (Cryptographically Enforced)
// -------------------------------------------------------------
const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.ADMIN_SECRET_KEY || 'aaroh-admin-2026') + '_session_salt_8f92b74a12';

// In-memory rate limiting for secret admin passkey attempts
const failedAdminAttempts = new Map(); // ip -> { count, lockedUntil }
// In-memory token cache so OAuth tokens are never written to data.json on disk
const userAccessTokens = new Map();

function checkAdminRateLimit(ip) {
  const now = Date.now();
  const record = failedAdminAttempts.get(ip);
  if (record && record.lockedUntil && record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSec };
  }
  return { locked: false, remainingSec: 0 };
}

function recordAdminAttempt(ip, success) {
  const now = Date.now();
  if (success) {
    failedAdminAttempts.delete(ip);
    return;
  }
  const record = failedAdminAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
  }
  failedAdminAttempts.set(ip, record);
}

// Constant-time passkey verification to prevent timing attacks
function verifySecretPasskey(providedKey) {
  const expectedKey = (process.env.ADMIN_SECRET_KEY || 'aaroh-admin-2026').trim();
  const a = Buffer.from(String(providedKey || '').trim());
  const b = Buffer.from(expectedKey);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Create cryptographically signed HMAC-SHA256 session token
function createSignedSessionToken(username, role = 'contributor', isAdminAuth = false) {
  const payload = JSON.stringify({
    u: username,
    r: role,
    adm: Boolean(isAdminAuth),
    t: Date.now()
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

// Verify HMAC-SHA256 signature
function verifySignedSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;
  const b64 = token.substring(0, dotIndex);
  const sig = token.substring(dotIndex + 1);
  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    // 14 days expiration
    if (Date.now() - data.t > 14 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Secure session extraction
const getAuthenticatedSession = (req) => {
  let rawToken = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  }
  if (!rawToken && req.headers['x-session-token']) {
    rawToken = req.headers['x-session-token'];
  }
  if (!rawToken && req.cookies?.reflect_session) {
    rawToken = req.cookies.reflect_session;
  }

  // 1. Check if token is cryptographically signed
  if (rawToken && typeof rawToken === 'string' && rawToken.includes('.')) {
    const payload = verifySignedSessionToken(rawToken);
    if (payload && payload.u) {
      const dbUser = db.getUserByUsername(payload.u);
      if (dbUser) {
        const isAdminVerified = Boolean(payload.adm && (dbUser.role === 'admin' || payload.r === 'admin'));
        return {
          user: {
            ...dbUser,
            role: isAdminVerified ? 'admin' : (dbUser.role === 'admin' && !isAdminVerified ? 'contributor' : dbUser.role)
          },
          isAdminVerified,
          isSignedToken: true
        };
      }
    }
  }

  // 2. Fallback for legacy unsigned cookies or x-session-user header:
  // SECURITY CRITICAL DEFENSE: Unsigned plain text can NEVER grant admin privileges!
  // This explicitly shuts down all browser Inspect / DevTools console tricks:
  // document.cookie = "reflect_session=Vijay-1710" or x-session-user: Vijay-1710
  const legacyUsername = (req.cookies?.reflect_session && !req.cookies.reflect_session.includes('.'))
    ? req.cookies.reflect_session
    : req.headers['x-session-user'];

  if (legacyUsername && typeof legacyUsername === 'string') {
    const dbUser = db.getUserByUsername(legacyUsername);
    if (dbUser) {
      return {
        user: {
          ...dbUser,
          role: 'contributor' // NEVER grant admin role via unsigned plain identifiers!
        },
        isAdminVerified: false,
        isSignedToken: false
      };
    }
  }

  return null;
};

const getUserFromSession = (req) => {
  const session = getAuthenticatedSession(req);
  return session ? session.user : null;
};

// Strict admin authorization middleware for all admin endpoints
const requireAdmin = (req, res, next) => {
  const session = getAuthenticatedSession(req);
  if (!session || !session.user || !session.isAdminVerified || session.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Admin access denied. Cryptographically verified admin authentication required.'
    });
  }
  req.adminUser = session.user;
  next();
};


// Sync real pull requests from GitHub across any public project for a user (strictly within event timeframe)
async function syncUserGitHubPullRequests(user, currentDay = 1) {
  if (!user || !user.username) return [];
  try {
    const sprint = db.getSprint();
    const sprintStartMs = sprint.startDate ? new Date(sprint.startDate).getTime() : 0;
    const minAllowedMs = sprintStartMs > 0 ? sprintStartMs - (3 * 60 * 60 * 1000) : 0; // 3 hour setup grace
    const startDateFilter = sprint.startDate ? `+created:>=${new Date(minAllowedMs).toISOString().split('T')[0]}` : '';

    const headers = { 'User-Agent': 'HackAaroh-PR-Tracker' };
    const token = userAccessTokens.get(user.username.toLowerCase()) || user.accessToken || process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryUrl = `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(user.username)}${startDateFilter}&sort=created&order=desc&per_page=30`;
    const res = await fetch(queryUrl, { headers });
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const existingPrs = db.getPullRequests();
        const existingUrls = new Set(existingPrs.map(p => p.url));
        const newPrs = [];

        for (const item of data.items) {
          if (existingUrls.has(item.html_url)) continue;

          // STRICT CHECK: Reject any PR created before the sprint started
          if (minAllowedMs > 0 && new Date(item.created_at).getTime() < minAllowedMs) {
            continue;
          }

          // STRICT CHECK: Author on GitHub MUST match user.username
          const itemAuthor = item.user?.login;
          if (itemAuthor && itemAuthor.toLowerCase() !== user.username.toLowerCase()) {
            continue;
          }

          const repo = item.repository_url.replace('https://api.github.com/repos/', '');
          const isMerged = Boolean(item.pull_request?.merged_at || (item.state === 'closed' && item.pull_request?.html_url));
          const state = isMerged ? 'merged' : item.state;

          const pr = {
            id: `pr-gh-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            githubPrNumber: item.number,
            repo: repo,
            title: item.title,
            description: item.body ? item.body.substring(0, 300) : `Tracked from ${repo} for @${user.username}`,
            url: item.html_url,
            state: state,
            author: user.username,
            authorAvatar: user.avatarUrl || item.user?.avatar_url,
            createdAt: item.created_at || new Date().toISOString(),
            dayOfSprint: currentDay,
            additions: Math.floor(Math.random() * 180) + 25,
            deletions: Math.floor(Math.random() * 30) + 5,
            commitsCount: 1,
            reviewStatus: 'PENDING_REVIEW',
            creditScore: 0,
            adminFeedback: '',
            adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
            reviewedBy: null,
            reviewedAt: null,
            tags: (item.labels || []).map(l => l.name?.toLowerCase()).filter(Boolean)
          };

          if (pr.tags.length === 0) {
            pr.tags = [repo.split('/')[1] || 'contribution'];
          }

          await db.addPullRequest(pr);
          newPrs.push(pr);
        }

        if (newPrs.length > 0) {
          await db.addAuditLog(
            'GITHUB_SYNC',
            user.username,
            `Synced ${newPrs.length} event PRs across repositories for @${user.username}`
          );
        }
        return newPrs;
      }
    }
  } catch (err) {
    console.error(`Error syncing GitHub PRs for @${user.username}:`, err.message);
  }

  return [];
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

  // Day roll without unsolicited scraping: PRs are evaluated based on participant submissions
  const updatedSprint = await db.updateSprint({
    currentDay: nextDay,
    lastSyncAt: now.toISOString(),
    nextSyncAt: calculateNextSync(sprint.dailyUpdateTime || '00:00')
  });

  await db.addAuditLog(
    isManualTrigger ? 'MANUAL_DAILY_UPDATE' : 'AUTOMATIC_DAILY_UPDATE',
    isManualTrigger ? 'ADMIN' : 'SCHEDULED_TICKER',
    `Day ${nextDay} daily calculation completed. Event timeline advanced to Day ${nextDay}.`
  );

  return { success: true, sprint: updatedSprint, ingestedPrs: [] };
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
  const session = getAuthenticatedSession(req);
  const user = session ? session.user : null;
  if (user && user.role !== 'admin') {
    const sprint = db.getSprint();
    if (sprint.loginsPaused) {
      res.clearCookie('reflect_session', { httpOnly: true, sameSite: 'lax' });
      return res.json({ user: null, paused: true, message: 'Participant logins are temporarily paused.' });
    }
  }
  res.json({ user: user || null });
});

// Secret Admin Passkey Login (For organizers to access admin dashboard privately)
app.post('/api/auth/admin-secret-login', async (req, res) => {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const rateLimit = checkAdminRateLimit(clientIp);
  if (rateLimit.locked) {
    return res.status(429).json({
      error: `Too many failed attempts. Admin portal is locked for ${rateLimit.remainingSec}s.`
    });
  }

  const { secretKey, username } = req.body || {};
  if (!secretKey || !verifySecretPasskey(secretKey)) {
    recordAdminAttempt(clientIp, false);
    return res.status(401).json({ error: 'Invalid organizer secret passkey' });
  }

  recordAdminAttempt(clientIp, true);

  const adminUsername = (username && username.trim()) || 'Vijay-1710';
  let user = db.getUserByUsername(adminUsername);
  if (!user) {
    user = await db.upsertUser({
      id: `usr_${adminUsername.toLowerCase()}`,
      username: adminUsername,
      name: adminUsername === 'Vijay-1710' ? 'Vijay-1710 (Organizer)' : adminUsername,
      avatarUrl: adminUsername === 'Vijay-1710'
        ? 'https://avatars.githubusercontent.com/u/Vijay-1710?v=4'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Official HackAaroh Event Administrator',
      htmlUrl: `https://github.com/${adminUsername}`,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  } else if (user.role !== 'admin') {
    user = await db.upsertUser({ ...user, role: 'admin' });
  }

  const token = createSignedSessionToken(user.username, 'admin', true);

  res.cookie('reflect_session', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  await db.addAuditLog('ADMIN_SECRET_LOGIN', user.username, 'Admin authenticated via verified secret passkey');
  res.json({ success: true, user, token });
});

// Mock login (1-click test login for judges & testers)
app.post('/api/auth/mock-login', async (req, res) => {
  const { username, name, avatarUrl } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const sprint = db.getSprint();
  if (sprint.loginsPaused) {
    return res.status(403).json({
      error: 'Logins are temporarily paused by event organizers. Please check back shortly!'
    });
  }

  // SECURITY ENFORCEMENT: Mock login is STRICTLY for contributors!
  // It NEVER grants admin privileges regardless of the username requested.
  let user = db.getUserByUsername(username);
  if (!user) {
    user = await db.upsertUser({
      id: `usr_${username}`,
      username,
      name: name || username,
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      bio: 'GitHub Contributor',
      htmlUrl: `https://github.com/${username}`,
      role: 'contributor',
      createdAt: new Date().toISOString()
    });
  }

  const token = createSignedSessionToken(user.username, 'contributor', false);

  res.cookie('reflect_session', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  await db.addAuditLog('USER_LOGIN', user.username, 'User connected with role contributor');
  res.json({ user: { ...user, role: 'contributor' }, token });
});

// GitHub OAuth authorization URL
app.get('/api/auth/github/url', (req, res) => {
  const { adminKey } = req.query;
  const expectedKey = (process.env.ADMIN_SECRET_KEY || 'aaroh-admin-2026').trim();
  const isAdminBypass = adminKey && adminKey.trim() === expectedKey;

  const sprint = db.getSprint();
  if (sprint.loginsPaused && !isAdminBypass) {
    return res.json({
      configured: false,
      paused: true,
      message: 'Participant logins are temporarily paused by event organizers. Please check back shortly!'
    });
  }

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

    const adminUsers = (process.env.ADMIN_GITHUB_USER || 'Vijay-1710,Openverse-iiitk')
      .toLowerCase()
      .split(',')
      .map(u => u.trim());
    const isAdmin = adminUsers.includes(ghUser.login.toLowerCase());

    const sprint = db.getSprint();
    if (sprint.loginsPaused && !isAdmin) {
      return res.redirect(`${frontendUrl}/?error=logins_paused&message=${encodeURIComponent('Logins are temporarily paused by event organizers. Please check back shortly!')}`);
    }

    const user = await db.upsertUser({
      id: `gh_${ghUser.id}`,
      githubId: ghUser.id,
      username: ghUser.login,
      name: ghUser.name || (isAdmin ? 'HackAaroh Admin' : ghUser.login),
      avatarUrl: ghUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: ghUser.bio || (isAdmin ? 'Official HackAaroh Event Administrator' : 'GitHub Contributor'),
      htmlUrl: ghUser.html_url || `https://github.com/${ghUser.login}`,
      role: isAdmin ? 'admin' : 'contributor',
      createdAt: new Date().toISOString()
    });

    if (tokenData.access_token) {
      userAccessTokens.set(user.username.toLowerCase(), tokenData.access_token);
    }

    // No automatic scraping of historical PRs upon login. Contributors submit their event PRs explicitly.

    const sessionToken = createSignedSessionToken(user.username, user.role, isAdmin);

    res.cookie('reflect_session', sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: !isLocal
    });

    const targetPath = user.role === 'admin' ? '/admin' : '/leaderboard';
    res.redirect(`${frontendUrl}${targetPath}?token=${encodeURIComponent(sessionToken)}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect(`${frontendUrl}/?error=oauth_exception`);
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('reflect_session', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true });
});

// Remove / forget user and their PRs (Admin-only)
app.all('/api/auth/forget-user', requireAdmin, async (req, res) => {
  const username = req.query.username || req.body?.username;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const deleted = await db.deleteUser(username);
  await db.addAuditLog('USER_REMOVED', req.adminUser.username, `Removed user @${username} and all associated PRs`);
  res.json({ success: true, removed: username, deleted });
});

// Toggle logins paused / active (Admin-only)
app.all('/api/auth/pause-logins', requireAdmin, async (req, res) => {
  await db.updateSprint({ loginsPaused: true });
  await db.addAuditLog('LOGINS_PAUSED', req.adminUser.username, 'Participant logins temporarily paused');
  res.json({ success: true, loginsPaused: true, message: 'Logins are now PAUSED' });
});

app.all('/api/auth/resume-logins', requireAdmin, async (req, res) => {
  await db.updateSprint({ loginsPaused: false });
  await db.addAuditLog('LOGINS_RESUMED', req.adminUser.username, 'Participant logins resumed');
  res.json({ success: true, loginsPaused: false, message: 'Logins are now ACTIVE' });
});

app.post('/api/admin/toggle-logins', requireAdmin, async (req, res) => {
  const sprint = db.getSprint();
  const newPaused = req.body.paused !== undefined ? req.body.paused : !sprint.loginsPaused;
  await db.updateSprint({ loginsPaused: newPaused });
  await db.addAuditLog('LOGINS_TOGGLED', req.adminUser.username, `Logins toggled to ${newPaused ? 'PAUSED' : 'ACTIVE'}`);
  res.json({ success: true, loginsPaused: newPaused });
});

// Full reset to clean event-ready state (Admin-only)
app.all(['/api/admin/reset-db', '/api/admin/reset-event', '/api/admin/purge-demo-data'], requireAdmin, async (req, res) => {
  await db.resetToCleanEvent();
  await db.addAuditLog('EVENT_RESET', req.adminUser.username, 'Sprint reset to Day 1 clean event state');
  res.json({ success: true, message: 'Event reset successfully. Ready for live event.', sprint: db.getSprint() });
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
app.post('/api/sprint/start', requireAdmin, async (req, res) => {
  const sprint = db.getSprint();
  const now = new Date();

  const updated = await db.updateSprint({
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

  await db.addAuditLog('SPRINT_STARTED', req.adminUser.username, `Admin officially started PR tracking event. Scheduled daily calculation set for ${updated.dailyUpdateTime} UTC.`);
  res.json(updated);
});

// Admin PAUSE / RESUME TRACKING
app.post('/api/sprint/toggle-status', requireAdmin, async (req, res) => {
  const sprint = db.getSprint();
  if (sprint.isFinalized || sprint.status === 'NOT_STARTED') {
    return res.status(400).json({ error: 'Cannot toggle status in current sprint state' });
  }

  const nextStatus = sprint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  const updated = await db.updateSprint({ status: nextStatus });
  await db.addAuditLog('SPRINT_STATUS_TOGGLED', req.adminUser.username, `Tracking status changed to ${nextStatus}`);
  res.json(updated);
});

// Admin END TRACKING & FINALIZE LEADERBOARD
app.post('/api/sprint/end', requireAdmin, async (req, res) => {
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

  const updatedSprint = await db.updateSprint({
    status: 'FINALIZED',
    isFinalized: true,
    endDate: now.toISOString(),
    finalizedAt: now.toISOString(),
    finalPodium: podium
  });

  await db.addAuditLog('SPRINT_FINALIZED', req.adminUser.username, `Admin officially ended tracking. Final Leaderboard frozen with ${leaderboard.length} ranked contributors.`);
  res.json({ sprint: updatedSprint, podium });
});

// Admin update sprint settings (Daily update time, name, tracked repos)
app.post('/api/sprint/update-settings', requireAdmin, async (req, res) => {
  const { dailyUpdateTime, name, trackedRepos } = req.body;

  const updates = {};
  if (dailyUpdateTime) {
    updates.dailyUpdateTime = dailyUpdateTime;
    updates.nextSyncAt = calculateNextSync(dailyUpdateTime);
  }
  if (name) updates.name = name;
  if (Array.isArray(trackedRepos)) updates.trackedRepos = trackedRepos;

  const updated = await db.updateSprint(updates);
  await db.addAuditLog('SETTINGS_UPDATED', req.adminUser.username, `Updated sprint settings: Daily calculation time set to ${updated.dailyUpdateTime} UTC`);
  res.json(updated);
});

// Trigger daily calculation (manual admin or scheduled)
app.post('/api/sprint/sync-daily', requireAdmin, async (req, res) => {
  const result = await performDailyCalculation(true);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json(result);
});

// Admin reset to NOT_STARTED (to test from scratch)
app.post('/api/sprint/reset-to-not-started', requireAdmin, async (req, res) => {
  const updated = await db.updateSprint({
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

  await db.addAuditLog('SPRINT_RESET_NOT_STARTED', req.adminUser.username, 'Admin reset sprint to NOT_STARTED state');
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

// Manual PR submission by authenticated contributor - strictly validates GitHub PR link
app.post('/api/pull-requests', async (req, res) => {
  const sessionUser = getUserFromSession(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Please sign in to submit a pull request' });
  }

  const sprint = db.getSprint();
  if (sprint.loginsPaused && sessionUser.role !== 'admin') {
    return res.status(403).json({ error: 'Pull request submissions are paused until the event starts.' });
  }

  const rawInput = (req.body.url || req.body.repo || '').trim();
  // Match forms like https://github.com/owner/repo/pull/123 or owner/repo/pull/123
  const prMatch = rawInput.match(/(?:https?:\/\/github\.com\/)?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i);
  if (!prMatch) {
    return res.status(400).json({
      error: 'A specific GitHub Pull Request link is required (e.g. https://github.com/owner/repo/pull/123). Plain repository links without PRs cannot be submitted.'
    });
  }

  const owner = prMatch[1];
  const repoName = prMatch[2];
  const prNumber = parseInt(prMatch[3], 10);
  const cleanRepo = `${owner}/${repoName}`;

  // Check duplicate submission
  const existingPrs = db.getPullRequests();
  const isDuplicate = existingPrs.some(p =>
    p.repo.toLowerCase() === cleanRepo.toLowerCase() && p.githubPrNumber === prNumber
  );
  if (isDuplicate) {
    return res.status(409).json({
      error: `PR #${prNumber} in ${cleanRepo} has already been submitted to the review queue.`
    });
  }

  // Verify against real GitHub API
  let prData = null;
  const token = userAccessTokens.get(sessionUser.username.toLowerCase()) || sessionUser.accessToken || process.env.GITHUB_TOKEN;
  const headers = { 'User-Agent': 'HackAaroh-PR-Tracker' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`, { headers });
    if (ghRes.ok) {
      prData = await ghRes.json();
    } else if (ghRes.status === 404) {
      return res.status(404).json({
        error: `Pull request #${prNumber} was not found in ${cleanRepo} on GitHub. Please ensure the repository is public and the PR number is correct.`
      });
    } else {
      const errText = await ghRes.text();
      return res.status(400).json({
        error: `GitHub returned error (${ghRes.status}): Unable to verify PR #${prNumber} in ${cleanRepo}.`
      });
    }
  } catch (err) {
    return res.status(502).json({
      error: `Network error connecting to GitHub API: ${err.message}`
    });
  }

  if (!prData || !prData.user) {
    return res.status(400).json({
      error: `Could not retrieve author information from GitHub for PR #${prNumber} in ${cleanRepo}.`
    });
  }

  // STRICT OWNERSHIP VALIDATION: Author on GitHub MUST match the authenticated user!
  const prAuthor = prData.user.login;
  if (prAuthor.toLowerCase() !== sessionUser.username.toLowerCase()) {
    return res.status(403).json({
      error: `You can only submit pull requests that you authored! This PR was created by @${prAuthor} on GitHub, but you are signed in as @${sessionUser.username}.`
    });
  }

  // EVENT TIMELINE VALIDATION: Check that PR was created for this hackathon (no year-old PRs!)
  if (sprint.startDate && prData.created_at) {
    const prCreatedMs = new Date(prData.created_at).getTime();
    const sprintStartMs = new Date(sprint.startDate).getTime();
    const minAllowedMs = sprintStartMs - (3 * 60 * 60 * 1000); // 3 hours setup grace before kickoff

    if (prCreatedMs < minAllowedMs) {
      const prDateStr = new Date(prData.created_at).toLocaleDateString();
      return res.status(400).json({
        error: `This pull request was created on ${prDateStr}, before the event started. Only pull requests opened during the hackathon can be submitted.`
      });
    }
  }

  const finalTitle = (prData.title || req.body.title || `PR #${prNumber}: Contribution to ${cleanRepo}`).trim();
  const finalUrl = prData.html_url || `https://github.com/${cleanRepo}/pull/${prNumber}`;
  const isMerged = Boolean(prData.merged_at || prData.merged);
  const finalState = isMerged ? 'merged' : (prData.state || 'open');
  const finalAdditions = prData.additions !== undefined ? prData.additions : (parseInt(req.body.additions, 10) || 50);
  const finalDeletions = prData.deletions !== undefined ? prData.deletions : (parseInt(req.body.deletions, 10) || 10);
  const finalCommits = prData.commits !== undefined ? prData.commits : (parseInt(req.body.commitsCount, 10) || 1);

  const newPr = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    githubPrNumber: prNumber,
    isRepoOnly: false,
    repo: cleanRepo,
    title: finalTitle,
    description: req.body.description?.trim() || (prData.body ? prData.body.substring(0, 300) : `Pull request #${prNumber} submitted by @${prAuthor}`),
    url: finalUrl,
    state: finalState,
    author: prAuthor,
    authorAvatar: prData.user.avatar_url || sessionUser.avatarUrl,
    createdAt: prData.created_at || new Date().toISOString(),
    dayOfSprint: sprint.currentDay || 1,
    additions: finalAdditions,
    deletions: finalDeletions,
    commitsCount: finalCommits,
    reviewStatus: 'PENDING_REVIEW',
    creditScore: 0,
    adminFeedback: '',
    adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
    reviewedBy: null,
    reviewedAt: null,
    tags: Array.isArray(req.body.tags) && req.body.tags.length > 0 ? req.body.tags : ['contribution']
  };

  await db.addPullRequest(newPr);
  await db.addAuditLog('PR_SUBMITTED', sessionUser.username, `@${sessionUser.username} submitted verified PR #${prNumber} in ${cleanRepo}`);
  res.status(201).json({ message: 'Pull request submitted successfully for review', pr: newPr });
});

// On-demand sync of real pull requests from GitHub across any public project
app.post('/api/pull-requests/sync', async (req, res) => {
  const sessionUser = getUserFromSession(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Please sign in to sync GitHub PRs' });
  }

  const sprint = db.getSprint();
  if (sprint.loginsPaused && sessionUser.role !== 'admin') {
    return res.status(403).json({ error: 'GitHub PR sync is paused until the event starts.' });
  }
  const syncedPrs = await syncUserGitHubPullRequests(sessionUser, sprint.currentDay || 1);
  const allUserPrs = db.getPullRequests().filter(pr => pr.author.toLowerCase() === sessionUser.username.toLowerCase());
  res.json({
    success: true,
    message: `Synced ${syncedPrs.length} new PRs from GitHub across your public repositories.`,
    syncedCount: syncedPrs.length,
    prs: allUserPrs
  });
});

// -------------------------------------------------------------
// Admin Manual Review & Credit Scoring Routes
// -------------------------------------------------------------

// Admin manually reviews and assigns credit score to a PR
app.post('/api/admin/review-pr', requireAdmin, async (req, res) => {
  const { prId, creditScore, feedback, criteria, reviewStatus = 'REVIEWED' } = req.body;
  if (!prId) {
    return res.status(400).json({ error: 'prId is required' });
  }

  const numericScore = Math.max(0, parseInt(creditScore, 10) || 0);

  const updatedPr = await db.updatePullRequest(prId, {
    creditScore: numericScore,
    adminFeedback: feedback || '',
    adminCriteria: criteria || { quality: 20, complexity: 20, impact: 20, testCoverage: 20 },
    reviewStatus,
    reviewedBy: req.adminUser.username,
    reviewedAt: new Date().toISOString()
  });

  if (!updatedPr) {
    return res.status(404).json({ error: 'Pull request not found' });
  }

  await db.addAuditLog(
    'PR_MANUALLY_REVIEWED',
    req.adminUser.username,
    `Admin reviewed PR #${updatedPr.githubPrNumber} (${updatedPr.author}) -> Awarded ${numericScore} credits with status ${reviewStatus}`
  );

  res.json({
    message: `PR #${updatedPr.githubPrNumber} reviewed successfully. ${numericScore} credits awarded.`,
    pr: updatedPr
  });
});

// Audit logs (Admin-only)
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  res.json(db.getAuditLogs());
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
