import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import {
  isFirestoreActive,
  loadAllFromFirestore,
  saveSprintToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  savePullRequestToFirestore,
  deletePullRequestFromFirestore,
  saveAuditLogToFirestore,
  seedFirestoreFromData
} from './firestore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_FILE = path.join(__dirname, 'data.json');
const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'hackaaroh_data.json') : SEED_FILE;
const BLOB_URL = 'https://ae1nkbba9sxv7ktd.public.blob.vercel-storage.com/hackaaroh_data.json';

const isBlobEnabled = () => process.env.USE_BLOB !== 'false' && Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const PURGED_USERNAMES = new Set([
  'rohan-satheesh',
  'deva4509',
  'manav-codes',
  'sarah-dev',
  'admin-starlit',
  'ptr25'
]);

export function isUserPurged(username, name = '') {
  if (!username && !name) return false;
  const u = String(username || '').toLowerCase().trim();
  const n = String(name || '').toLowerCase().trim();
  if (PURGED_USERNAMES.has(u)) return true;
  if (n === 'pranathi t r' || n === 'pranathi tr') return true;
  return false;
}

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
        bio: 'GitHub Contributor',
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

class Database {
  constructor() {
    // Mode transitions from 'BLOB' (temporary bridge) to 'FIRESTORE' (permanent primary) when quota resets
    this.storageMode = 'BLOB';
    this.init();
  }

  async resetToCleanEvent() {
    this.data = getInitialSeed();
    this.lastLoadedAt = Date.now();
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await seedFirestoreFromData(this.data);
      } catch (e) {
        console.error('[Firebase] Failed to reset clean event in Firestore:', e.message);
      }
    }
    if (process.env.VERCEL && fs.existsSync(DB_FILE)) {
      try { fs.unlinkSync(DB_FILE); } catch (_) {}
    }
    await this.save(true);
    return this.data;
  }

  async ensureLoaded(force = false) {
    const now = Date.now();
    if (!force && this.lastLoadedAt && (now - this.lastLoadedAt < 3000)) return;

    // 1. Primary Store: Cloud Firestore (Auto-shifts to Firestore as soon as daily quota resets)
    if (isFirestoreActive()) {
      try {
        const remote = await loadAllFromFirestore();
        if (remote && remote.sprint) {
          const wasBlob = this.storageMode !== 'FIRESTORE';
          this.storageMode = 'FIRESTORE';

          if (wasBlob) {
            console.log('🎉 [Storage] Cloud Firestore quota has reset! Shifting primary storage to Firestore and discontinuing Blob.');

            // Reconcile any PRs or users from the bridge period that might be missing in Firestore
            const fsPrKeys = new Set((remote.pullRequests || []).map(p => `${p.repo}#${p.githubPrNumber}`.toLowerCase()));
            const fsPrIds = new Set((remote.pullRequests || []).map(p => String(p.id).toLowerCase()));
            const missingInFs = (this.data?.pullRequests || []).filter(
              p => !fsPrKeys.has(`${p.repo}#${p.githubPrNumber}`.toLowerCase()) && !fsPrIds.has(String(p.id).toLowerCase())
            );

            if (missingInFs.length > 0) {
              console.log(`[Storage] Syncing ${missingInFs.length} delta PRs to Cloud Firestore...`);
              for (const pr of missingInFs) {
                savePullRequestToFirestore(pr).catch(() => {});
              }
              remote.pullRequests = [...missingInFs, ...(remote.pullRequests || [])];
            }

            const fsUsernames = new Set((remote.users || []).map(u => u.username.toLowerCase()));
            const missingUsersInFs = (this.data?.users || []).filter(u => u.username && !fsUsernames.has(u.username.toLowerCase()));
            if (missingUsersInFs.length > 0) {
              console.log(`[Storage] Syncing ${missingUsersInFs.length} delta users to Cloud Firestore...`);
              for (const u of missingUsersInFs) {
                saveUserToFirestore(u).catch(() => {});
              }
              remote.users = [...missingUsersInFs, ...(remote.users || [])];
            }
          }

          this.data = {
            sprint: remote.sprint,
            users: (remote.users || []).filter(u => !isUserPurged(u.username, u.name)),
            pullRequests: (remote.pullRequests || []).filter(p => !isUserPurged(p.author)),
            auditLogs: remote.auditLogs || [],
            deletedPrIds: remote.deletedPrIds || []
          };
          this.lastLoadedAt = now;

          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
          } catch (_) {}
          return true;
        }
      } catch (err) {
        // Quota still exceeded or network issue: fall back to Blob bridge
      }
    }

    // 2. Temporary Bridge: Vercel Blob (Only used while Firestore quota is down)
    if (this.storageMode === 'BLOB' && (isBlobEnabled() || process.env.VERCEL)) {
      try {
        const blobRes = await fetch(`${BLOB_URL}?t=${now}&r=${Math.random().toString(36).substring(2, 8)}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (blobRes.ok) {
          const remoteData = await blobRes.json();
          if (remoteData && remoteData.sprint && Array.isArray(remoteData.pullRequests) && Array.isArray(remoteData.users)) {
            const deletedSet = new Set((remoteData.deletedPrIds || []).map(x => String(x).toLowerCase()));
            (this.data?.deletedPrIds || []).forEach(x => deletedSet.add(String(x).toLowerCase()));
            remoteData.deletedPrIds = Array.from(deletedSet);
            remoteData.users = (remoteData.users || []).filter(u => !isUserPurged(u.username, u.name));
            remoteData.pullRequests = (remoteData.pullRequests || []).filter(pr => {
              if (isUserPurged(pr.author)) return false;
              const pId = String(pr.id || '').trim().toLowerCase();
              const pNum = String(pr.githubPrNumber || '').trim().toLowerCase();
              const pRepoPr = `${pr.repo || ''}#${pr.githubPrNumber || ''}`.toLowerCase();
              const pUrl = String(pr.url || '').trim().toLowerCase();
              if (deletedSet.has(pId) || deletedSet.has(pNum) || deletedSet.has(pRepoPr) || deletedSet.has(pUrl)) return false;
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
        console.warn('[Database] Blob fetch warning:', err.message);
      }
    }

    // 3. Local filesystem cache fallback
    if (fs.existsSync(DB_FILE)) {
      try {
        const stats = fs.statSync(DB_FILE);
        if (!this.lastFileMtime || stats.mtimeMs > this.lastFileMtime || force) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const local = JSON.parse(raw);
          if (local && local.sprint) {
            local.users = (local.users || []).filter(u => !isUserPurged(u.username, u.name));
            local.pullRequests = (local.pullRequests || []).filter(p => !isUserPurged(p.author));
            this.data = local;
            this.lastFileMtime = stats.mtimeMs;
            return true;
          }
        }
      } catch (_) {}
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
      console.error('Failed to persist database to file:', err);
    }

    // When Firestore is UP and active:
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      // User directive: "when the quota resets dont do anything to blob just shift to firestore when its up and continue from there thereafter"
      if (isFullReset) {
        try {
          await seedFirestoreFromData(this.data);
        } catch (err) {
          console.error('[Firebase] Failed to reset Firestore state:', err.message);
        }
      }
      return; // Do NOT write to Blob anymore!
    }

    // Only while Firestore is down due to quota: sync to Vercel Blob as the temporary bridge
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token && this.storageMode === 'BLOB') {
      try {
        await put('hackaaroh_data.json', JSON.stringify(this.data, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0,
          token
        });
      } catch (err) {
        console.error('[Blob] Failed to save to Vercel Blob:', err.message);
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
    const contributors = (this.data.users || []).filter(u => !isUserPurged(u.username, u.name) && (u.role !== 'admin' || u.username.toLowerCase() === 'vijay-1710'));
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
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await saveSprintToFirestore(this.data.sprint);
      } catch (err) {
        console.error('[Firebase] Error updating sprint in Firestore:', err.message);
      }
    }
    await this.save(false);
    return this.data.sprint;
  }

  getUsers() {
    return (this.data.users || []).filter(u => !isUserPurged(u.username, u.name));
  }

  getUserByUsername(username) {
    if (!username || isUserPurged(username)) return null;
    return (this.data.users || []).find(u => u.username.toLowerCase() === username.toLowerCase() && !isUserPurged(u.username, u.name));
  }

  async upsertUser(user) {
    if (!user || isUserPurged(user.username, user.name)) {
      return null;
    }
    const idx = this.data.users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await saveUserToFirestore(user);
      } catch (err) {
        console.error('[Firebase] Error saving user in Firestore:', err.message);
      }
    }
    await this.save(false);
    return this.getUserByUsername(user.username);
  }

  async deleteUser(username) {
    if (!username) return false;
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    this.data.pullRequests = this.data.pullRequests.filter(pr => pr.author.toLowerCase() !== username.toLowerCase());
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await deleteUserFromFirestore(username);
      } catch (err) {
        console.error('[Firebase] Error deleting user in Firestore:', err.message);
      }
    }
    await this.save(false);
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
      if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
        try {
          await savePullRequestToFirestore(pr);
        } catch (err) {
          console.error('[Firebase] Error adding PR in Firestore:', err.message);
        }
      }
      await this.save(false);
    }
    return pr;
  }

  async updatePullRequest(id, updates) {
    await this.ensureLoaded(true);
    const target = String(id).trim().toLowerCase();
    const idx = (this.data.pullRequests || []).findIndex(pr => {
      const pId = String(pr.id || '').trim().toLowerCase();
      const pNum = String(pr.githubPrNumber || '').trim().toLowerCase();
      return pId === target || pNum === target;
    });
    if (idx >= 0) {
      this.data.pullRequests[idx] = { ...this.data.pullRequests[idx], ...updates };
      if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
        try {
          await savePullRequestToFirestore(this.data.pullRequests[idx]);
        } catch (err) {
          console.error('[Firebase] Error updating PR in Firestore:', err.message);
        }
      }
      await this.save(false);
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
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await deletePullRequestFromFirestore(target);
      } catch (err) {
        console.error('[Firebase] Error deleting PR in Firestore:', err.message);
      }
    }
    await this.save(false);
    return this.data.pullRequests.length < initialLen;
  }

  /**
   * Automated Midnight PR Evaluation Engine
   * Evaluates and grades all pending PRs in range [minScore, maxScore] (default 60-90).
   * STRICT SAFEGUARD: Never touches or alters PRs that are already graded.
   */
  async evaluatePendingPullRequests({ minScore = 60, maxScore = 90, evaluator = 'Vijay-1710' } = {}) {
    await this.ensureLoaded(true);
    const now = new Date().toISOString();
    let gradedCount = 0;

    for (const pr of (this.data.pullRequests || [])) {
      // STRICT SAFEGUARD: Never touch already graded PRs
      if (pr.reviewStatus === 'REVIEWED' && pr.creditScore && Number(pr.creditScore) > 0) {
        continue;
      }

      const adds = Number(pr.additions) || 0;
      const dels = Number(pr.deletions) || 0;
      const totalLines = adds + dels;

      // Effort-based scaling between 0 and 24
      const bonus = Math.min(24, Math.floor(Math.log10(Math.max(1, totalLines)) * 8));

      // Deterministic variance between 0 and 6 so score is stable and repeatable per PR
      const seedStr = `${pr.id || ''}:${pr.repo || ''}:${pr.githubPrNumber || ''}`;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
      const variance = Math.abs(hash) % 7;

      const score = Math.max(minScore, Math.min(maxScore, minScore + bonus + variance));

      const q = Math.floor(score / 4);
      const rem = score % 4;
      const criteria = {
        quality: q + (rem >= 1 ? 1 : 0),
        complexity: q + (rem >= 2 ? 1 : 0),
        impact: q + (rem >= 3 ? 1 : 0),
        testCoverage: q
      };

      pr.creditScore = score;
      pr.adminCriteria = criteria;
      pr.adminFeedback = `Automated midnight evaluation: Verified contribution of +${adds}/-${dels} in ${pr.repo}#${pr.githubPrNumber}.`;
      pr.reviewStatus = 'REVIEWED';
      pr.reviewedBy = evaluator;
      pr.reviewedAt = now;

      if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
        try {
          await savePullRequestToFirestore(pr);
        } catch (err) {
          console.error('[Firebase] Error saving evaluated PR in Firestore:', err.message);
        }
      }
      gradedCount++;
    }

    if (gradedCount > 0) {
      await this.addAuditLog(
        'DAILY_00:00_PR_EVALUATION',
        evaluator,
        `Automated midnight evaluation: Graded ${gradedCount} pending PRs (scored between ${minScore} and ${maxScore} pts). All previously graded PRs remained strictly untouched.`
      );
      await this.save(false);
    }

    return { gradedCount, totalPrs: this.data.pullRequests.length };
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
    if (this.storageMode === 'FIRESTORE' && isFirestoreActive()) {
      try {
        await saveAuditLogToFirestore(entry);
      } catch (err) {
        console.error('[Firebase] Error saving audit log in Firestore:', err.message);
      }
    }
    await this.save(false);
    return entry;
  }

  getAuditLogs() {
    return this.data.auditLogs;
  }

  // Calculate dynamic leaderboard with flexible day counts
  getLeaderboard() {
    const users = (this.data.users || []).filter(u => !isUserPurged(u.username, u.name) && (u.role !== 'admin' || u.username.toLowerCase() === 'vijay-1710'));
    const prs = (this.data.pullRequests || []).filter(pr => !isUserPurged(pr.author));
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
