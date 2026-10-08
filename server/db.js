import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_FILE = path.join(__dirname, 'data.json');
const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'hackaaroh_data.json') : SEED_FILE;
const BLOB_URL = 'https://ae1nkbba9sxv7ktd.public.blob.vercel-storage.com/hackaaroh_data.json';

export function calculateNextSync(timeStr = '00:00') {
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.toISOString();
}

export function calculateSprintDay(startDateStr) {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr).getTime();
  const now = Date.now();
  if (now < start) return 1;
  const diffDays = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  return diffDays + 1;
}

// Initial seed data with admin-controlled tracking lifecycle for live event
const getInitialSeed = () => {
  const eventStart = '2026-10-08T18:30:00.000Z'; // October 9, 2026 00:00 IST

  return {
    sprint: {
      id: 'sprint-hackaaroh-current',
      name: 'HackAaroh 2026 - Global Open Source Sprint',
      description: 'Automated GitHub pull request tracking and repository project submissions. Evaluators review contributions daily and award credits.',
      status: 'ACTIVE',
      dailyUpdateTime: '00:00',
      startDate: eventStart,
      endDate: null,
      currentDay: calculateSprintDay(eventStart),
      lastSyncAt: new Date().toISOString(),
      nextSyncAt: calculateNextSync('00:00'),
      trackingScope: 'ALL_REPOSITORIES',
      trackedRepos: [
        'openverse/hackaaroh',
        'facebook/react',
        'nodejs/node',
        'tailwindlabs/tailwindcss',
        'tanstack/table',
        'shadcn-ui/ui',
        'microsoft/vscode'
      ],
      isFinalized: false,
      loginsPaused: false,
      finalizedAt: null,
      finalPodium: []
    },
    users: [
      {
        id: 'usr_Vijay-1710',
        username: 'Vijay-1710',
        name: 'Vijay-1710',
        avatarUrl: 'https://avatars.githubusercontent.com/u/Vijay-1710?v=4',
        bio: 'Official HackAaroh Event Administrator',
        htmlUrl: 'https://github.com/Vijay-1710',
        role: 'admin',
        createdAt: '2026-10-08T00:00:00.000Z'
      }
    ],
    pullRequests: [],
    auditLogs: [
      {
        id: `log-${Date.now()}-init`,
        action: 'SPRINT_INITIALIZED',
        actor: 'Vijay-1710',
        details: 'HackAaroh Sprint initialized for October 9 kickoff. Participant logins paused. Secret admin portal active.',
        timestamp: new Date().toISOString()
      }
    ]
  };
};

const DEMO_USERNAMES = new Set(['manav-codes', 'sarah-dev', 'alex-rustacean', 'elena-cloud', 'devon-craft', 'admin-starlit', 'rohan-satheesh', 'deva4509', 'ptr25', 'vipulreddyvemula']);

class Database {
  constructor() {
    this.init();
    this.loadedFromBlob = false;
  }

  async resetToCleanEvent() {
    this.data = getInitialSeed();
    this.lastLoadedAt = Date.now();
    if (process.env.VERCEL && fs.existsSync(DB_FILE)) {
      try { fs.unlinkSync(DB_FILE); } catch (_) {}
    }
    await this.save(true);
    return this.data;
  }

  async ensureLoaded(force = false) {
    // Only attempt to load from remote Vercel Blob if running in VERCEL serverless environment
    // or if BLOB_READ_WRITE_TOKEN is explicitly configured.
    // In local development, use local data.json to prevent stale remote blob data from overwriting local state.
    if (!process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
      return false;
    }

    const now = Date.now();
    if (!force && this.lastLoadedAt && (now - this.lastLoadedAt < 3000)) return;
    try {
      const res = await fetch(`${BLOB_URL}?t=${now}&r=${Math.random().toString(36).substring(2, 8)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.sprint && Array.isArray(remoteData.pullRequests) && Array.isArray(remoteData.users)) {
          // Strictly filter out any historical PRs created before sprint start
          const sprintStartMs = remoteData.sprint?.startDate ? new Date(remoteData.sprint.startDate).getTime() : 0;
          const minAllowedMs = sprintStartMs > 0 ? sprintStartMs - (3 * 60 * 60 * 1000) : 0;
          if (minAllowedMs > 0) {
            remoteData.pullRequests = remoteData.pullRequests.filter(pr => {
              if (!pr.createdAt) return false;
              return new Date(pr.createdAt).getTime() >= minAllowedMs;
            });
          }

          // Strictly filter out any PRs marked as deleted
          const deletedSet = new Set((remoteData.deletedPrIds || []).map(x => String(x).toLowerCase()));
          (this.data?.deletedPrIds || []).forEach(x => deletedSet.add(String(x).toLowerCase()));
          remoteData.deletedPrIds = Array.from(deletedSet);
          remoteData.pullRequests = remoteData.pullRequests.filter(pr => {
            const pId = String(pr.id || '').trim().toLowerCase();
            const pNum = String(pr.githubPrNumber || '').trim().toLowerCase();
            if (deletedSet.has(pId) || deletedSet.has(pNum)) return false;
            return true;
          });

          this.data = remoteData;
          this.lastLoadedAt = now;
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
          } catch (_) {}
          return true;
        }
      }
    } catch (err) {
      // Remote blob not yet initialized or network issue
    }
    return false;
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else if (fs.existsSync(SEED_FILE)) {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (_) {}
      } else {
        const initial = getInitialSeed();
        this.data = initial;
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        } catch (_) {}
      }
      if (!this.data.sprint) {
        this.data = getInitialSeed();
      }
      if (!this.data.sprint.dailyUpdateTime) {
        this.data.sprint.dailyUpdateTime = '00:00';
      }
    } catch (err) {
      console.error('Error initializing db, resetting to seed:', err);
      this.data = getInitialSeed();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (_) {}
    }
  }

  async save(isFullReset = false) {
    this.lastLoadedAt = Date.now();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        // CONCURRENCY-SAFE MERGE: Unless this is an explicit admin reset or deletion,
        // merge with any concurrent submissions from other lambda instances
        // before writing to Vercel Blob to prevent race condition data loss.
        if (process.env.VERCEL && !isFullReset) {
          try {
            const checkRes = await fetch(`${BLOB_URL}?t=${Date.now()}&r=${Math.random().toString(36).substring(2, 8)}`, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' }
            });
            if (checkRes.ok) {
              const remote = await checkRes.json();
              if (remote && Array.isArray(remote.pullRequests)) {
                const deletedSet = new Set((this.data.deletedPrIds || []).map(x => String(x).toLowerCase()));
                (remote.deletedPrIds || []).forEach(x => deletedSet.add(String(x).toLowerCase()));
                this.data.deletedPrIds = Array.from(deletedSet);

                // Merge pull requests without losing any submitted PR (filtering out deleted PRs)
                const prMap = new Map();
                // 1. Add remote PRs
                remote.pullRequests.forEach(p => {
                  const key = p.id || `${p.repo}#${p.githubPrNumber}`;
                  const pId = String(p.id || '').trim().toLowerCase();
                  const pNum = String(p.githubPrNumber || '').trim().toLowerCase();
                  if (!deletedSet.has(pId) && !deletedSet.has(pNum)) {
                    prMap.set(key, p);
                  }
                });
                // 2. Overlay local PRs (newer local state overrides)
                (this.data.pullRequests || []).forEach(p => {
                  const key = p.id || `${p.repo}#${p.githubPrNumber}`;
                  const pId = String(p.id || '').trim().toLowerCase();
                  const pNum = String(p.githubPrNumber || '').trim().toLowerCase();
                  if (!deletedSet.has(pId) && !deletedSet.has(pNum)) {
                    prMap.set(key, p);
                  }
                });
                this.data.pullRequests = Array.from(prMap.values());

                // Merge users without losing any registered contributors
                if (Array.isArray(remote.users)) {
                  const userMap = new Map();
                  remote.users.forEach(u => userMap.set(u.username.toLowerCase(), u));
                  (this.data.users || []).forEach(u => userMap.set(u.username.toLowerCase(), u));
                  this.data.users = Array.from(userMap.values());
                }

                // Merge audit logs
                if (Array.isArray(remote.auditLogs)) {
                  const logMap = new Map();
                  remote.auditLogs.forEach(l => logMap.set(l.id, l));
                  (this.data.auditLogs || []).forEach(l => logMap.set(l.id, l));
                  this.data.auditLogs = Array.from(logMap.values())
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 80);
                }
              }
            }
          } catch (_) {}
        }

        await put('hackaaroh_data.json', JSON.stringify(this.data), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0,
          abortSignal: AbortSignal.timeout(8000),
          token
        });
      } catch (err) {
        console.error('Failed to sync to Vercel Blob:', err.message);
      }
    }
  }

  async reset() {
    this.data = getInitialSeed();
    await this.save(true);
    return this.data;
  }

  getSprint() {
    const repos = Array.from(new Set((this.data.pullRequests || []).map(pr => pr.repo))).filter(Boolean);
    const contributors = (this.data.users || []).filter(u => u.role !== 'admin');
    const officialStart = '2026-10-08T18:30:00.000Z';
    const rawStart = this.data.sprint?.startDate;
    const startDateStr = (!rawStart || rawStart < officialStart) ? officialStart : rawStart;
    const startMs = new Date(startDateStr).getTime();
    const now = Date.now();
    const isUpcoming = now < startMs;
    const computedDay = isUpcoming ? 1 : Math.floor((now - startMs) / (24 * 60 * 60 * 1000)) + 1;

    return {
      ...this.data.sprint,
      status: this.data.sprint?.status || 'ACTIVE',
      startDate: startDateStr,
      currentDay: computedDay,
      isUpcoming,
      loginsPaused: Boolean(this.data.sprint?.loginsPaused),
      trackingScope: 'ALL_REPOSITORIES',
      trackedRepos: repos.length > 0 ? repos : (this.data.sprint.trackedRepos || []),
      totalTrackedContributors: contributors.length,
      totalDiscoveredRepos: repos.length > 0 ? repos.length : (this.data.sprint.trackedRepos || []).length
    };
  }

  getDiscoveredRepos() {
    return Array.from(new Set((this.data.pullRequests || []).map(pr => pr.repo))).filter(Boolean);
  }

  getUserReviewsStats(username) {
    if (!username) return null;
    const prs = (this.data.pullRequests || []).filter(pr => pr.author.toLowerCase() === username.toLowerCase());
    const reviewedPrs = prs.filter(pr => pr.reviewStatus === 'REVIEWED');
    const pendingPrs = prs.filter(pr => pr.reviewStatus === 'PENDING_REVIEW');
    const totalCredits = reviewedPrs.reduce((sum, pr) => sum + (Number(pr.creditScore) || 0), 0);
    const distinctRepos = Array.from(new Set(prs.map(pr => pr.repo))).filter(Boolean);
    return {
      totalPrs: prs.length,
      reviewedPrs: reviewedPrs.length,
      pendingPrs: pendingPrs.length,
      totalCredits,
      avgCreditScore: reviewedPrs.length > 0 ? Math.round(totalCredits / reviewedPrs.length) : 0,
      distinctRepos
    };
  }

  async updateSprint(updates) {
    this.data.sprint = { ...this.data.sprint, ...updates };
    await this.save();
    return this.data.sprint;
  }

  getUsers() {
    return this.data.users;
  }

  getUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async upsertUser(user) {
    const idx = this.data.users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    await this.save();
    return this.getUserByUsername(user.username);
  }

  async deleteUser(username) {
    if (!username) return false;
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    this.data.pullRequests = this.data.pullRequests.filter(pr => pr.author.toLowerCase() !== username.toLowerCase());
    await this.save(true);
    return this.data.users.length < initialLen;
  }

  getPullRequests() {
    return this.data.pullRequests;
  }

  getPullRequestById(id) {
    return this.data.pullRequests.find(pr => pr.id === id);
  }

  async addPullRequest(pr) {
    await this.ensureLoaded(true);
    const exists = (this.data.pullRequests || []).some(
      p => p.id === pr.id || (p.repo?.toLowerCase() === pr.repo?.toLowerCase() && p.githubPrNumber === pr.githubPrNumber)
    );
    if (!exists) {
      this.data.pullRequests.unshift(pr);
      await this.save();
    }
    return pr;
  }

  async updatePullRequest(id, updates) {
    await this.ensureLoaded(true);
    const idx = (this.data.pullRequests || []).findIndex(pr => pr.id === id);
    if (idx >= 0) {
      this.data.pullRequests[idx] = { ...this.data.pullRequests[idx], ...updates };
      await this.save();
      return this.data.pullRequests[idx];
    }
    return null;
  }

  async deletePullRequest(id) {
    if (!id) return false;
    await this.ensureLoaded(true);
    const target = String(id).trim().toLowerCase();
    this.data.deletedPrIds = this.data.deletedPrIds || [];
    if (!this.data.deletedPrIds.includes(target)) {
      this.data.deletedPrIds.push(target);
    }
    const initialLen = (this.data.pullRequests || []).length;
    this.data.pullRequests = (this.data.pullRequests || []).filter(pr => {
      const pId = String(pr.id || '').trim().toLowerCase();
      const pNum = String(pr.githubPrNumber || '').trim().toLowerCase();
      const pUrl = String(pr.url || '').trim().toLowerCase();
      const pRepoPr = `${pr.repo || ''}#${pr.githubPrNumber || ''}`.toLowerCase();
      if (pId === target || pNum === target || pUrl === target || pRepoPr === target) {
        if (!this.data.deletedPrIds.includes(pId)) this.data.deletedPrIds.push(pId);
        if (pNum && !this.data.deletedPrIds.includes(pNum)) this.data.deletedPrIds.push(pNum);
        return false;
      }
      return true;
    });
    // Critical: pass isFullReset = true so the deleted PR is never merged back from stale remote state
    await this.save(true);
    return this.data.pullRequests.length < initialLen;
  }

  async addAuditLog(action, actor, details) {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      actor,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 60) {
      this.data.auditLogs.pop();
    }
    await this.save();
    return entry;
  }

  getAuditLogs() {
    return this.data.auditLogs;
  }

  // Calculate dynamic leaderboard with flexible day counts
  getLeaderboard() {
    const users = (this.data.users || []).filter(u => u.role !== 'admin');
    const prs = this.data.pullRequests || [];
    const currentDay = Math.max(1, this.data.sprint.currentDay || 1);

    const statsByUser = {};

    users.forEach(user => {
      statsByUser[user.username] = {
        user,
        totalCredits: 0,
        totalPrs: 0,
        mergedPrs: 0,
        openPrs: 0,
        reviewedPrs: 0,
        pendingPrs: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        dailyCredits: Array(currentDay).fill(0),
        dailyPrs: Array(currentDay).fill(0),
        prs: []
      };
    });

    prs.forEach(pr => {
      if (!statsByUser[pr.author]) {
        statsByUser[pr.author] = {
          user: {
            id: `usr_${pr.author}`,
            username: pr.author,
            name: pr.author,
            avatarUrl: pr.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: 'contributor'
          },
          totalCredits: 0,
          totalPrs: 0,
          mergedPrs: 0,
          openPrs: 0,
          reviewedPrs: 0,
          pendingPrs: 0,
          totalAdditions: 0,
          totalDeletions: 0,
          dailyCredits: Array(currentDay).fill(0),
          dailyPrs: Array(currentDay).fill(0),
          prs: []
        };
      }

      const stat = statsByUser[pr.author];
      stat.totalPrs += 1;
      stat.totalAdditions += (pr.additions || 0);
      stat.totalDeletions += (pr.deletions || 0);
      stat.prs.push(pr);

      if (pr.state === 'merged') stat.mergedPrs += 1;
      if (pr.state === 'open') stat.openPrs += 1;

      const dayIdx = Math.max(0, (pr.dayOfSprint || 1) - 1);
      while (stat.dailyCredits.length <= dayIdx) stat.dailyCredits.push(0);
      while (stat.dailyPrs.length <= dayIdx) stat.dailyPrs.push(0);

      stat.dailyPrs[dayIdx] += 1;

      if (pr.reviewStatus === 'REVIEWED') {
        stat.reviewedPrs += 1;
        const credits = Number(pr.creditScore) || 0;
        stat.totalCredits += credits;
        stat.dailyCredits[dayIdx] += credits;
      } else {
        stat.pendingPrs += 1;
      }
    });

    const leaderboard = Object.values(statsByUser).sort((a, b) => {
      if (b.totalCredits !== a.totalCredits) {
        return b.totalCredits - a.totalCredits;
      }
      if (b.mergedPrs !== a.mergedPrs) {
        return b.mergedPrs - a.mergedPrs;
      }
      return b.totalPrs - a.totalPrs;
    }).map((item, index) => ({
      rank: index + 1,
      ...item,
      avgCreditPerReviewedPr: item.reviewedPrs > 0 ? Math.round(item.totalCredits / item.reviewedPrs) : 0
    }));

    return leaderboard;
  }
}

export const db = new Database();
