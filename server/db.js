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

// Initial seed data with admin-controlled tracking lifecycle
const getInitialSeed = () => {
  const now = new Date();
  const sprintStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Started 3 days ago

  return {
    sprint: {
      id: 'sprint-hackaaroh-current',
      name: 'Global Open Source PR Tracking Sprint',
      description: 'Automated GitHub pull request tracking across all repositories for registered users. Admins review PRs daily and award credits.',
      status: 'ACTIVE', // 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'FINALIZED'
      dailyUpdateTime: '00:00', // Specific time everyday (UTC)
      startDate: sprintStart.toISOString(),
      endDate: null,
      currentDay: 4, // Day 4 since started
      lastSyncAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      nextSyncAt: calculateNextSync('00:00'),
      trackingScope: 'ALL_REPOSITORIES',
      trackedRepos: [
        'facebook/react',
        'nodejs/node',
        'rust-lang/rust',
        'tailwindlabs/tailwindcss',
        'tanstack/table',
        'microsoft/vscode',
        'shadcn-ui/ui',
        'astral-sh/uv',
        'torvalds/linux',
        'openverse/hackaaroh'
      ],
      isFinalized: false,
      loginsPaused: true,
      finalizedAt: null,
      finalPodium: []
    },
    users: [
      {
        id: 'usr_manav',
        username: 'manav-codes',
        name: 'Manav Sharma',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Full-stack builder & open source enthusiast',
        htmlUrl: 'https://github.com/manav-codes',
        role: 'contributor',
        createdAt: sprintStart.toISOString()
      },
      {
        id: 'usr_sarah',
        username: 'sarah-dev',
        name: 'Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        bio: 'Systems engineer & TypeScript fanatic',
        htmlUrl: 'https://github.com/sarah-dev',
        role: 'contributor',
        createdAt: sprintStart.toISOString()
      },
      {
        id: 'usr_alex',
        username: 'alex-rustacean',
        name: 'Alex Rivera',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Rust & WebAssembly specialist',
        htmlUrl: 'https://github.com/alex-rustacean',
        role: 'contributor',
        createdAt: sprintStart.toISOString()
      },
      {
        id: 'usr_elena',
        username: 'elena-cloud',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Distributed systems & TanStack fan',
        htmlUrl: 'https://github.com/elena-cloud',
        role: 'contributor',
        createdAt: sprintStart.toISOString()
      },
      {
        id: 'usr_devon',
        username: 'devon-craft',
        name: 'Devon Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Frontend architect and performance junkie',
        htmlUrl: 'https://github.com/devon-craft',
        role: 'contributor',
        createdAt: sprintStart.toISOString()
      },
      {
        id: 'usr_admin',
        username: 'admin-starlit',
        name: 'Admin Chief (Lead Reviewer)',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        bio: 'Sprint Administrator & Lead Code Reviewer',
        htmlUrl: 'https://github.com/admin-starlit',
        role: 'admin',
        createdAt: sprintStart.toISOString()
      }
    ],
    pullRequests: [
      {
        id: 'pr-101',
        githubPrNumber: 142,
        repo: 'facebook/react',
        title: 'feat: add resilient TanStack Query caching layer for PR ingestion',
        description: 'Automatically tracked from facebook/react. Optimistic updates and multi-level query invalidation.',
        url: 'https://github.com/facebook/react/pull/142',
        state: 'merged',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 1,
        additions: 384,
        deletions: 42,
        commitsCount: 4,
        reviewStatus: 'REVIEWED',
        creditScore: 85,
        adminFeedback: 'Exceptional test coverage and cleanly structured caching boundaries. Great impact!',
        adminCriteria: { quality: 23, complexity: 22, impact: 20, testCoverage: 20 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        tags: ['react', 'caching', 'feat']
      },
      {
        id: 'pr-102',
        githubPrNumber: 143,
        repo: 'nodejs/node',
        title: 'fix: handle rate-limit throttling in HTTP client connection pool',
        description: 'Automatically tracked from nodejs/node. Exponential backoff and token pool rotation.',
        url: 'https://github.com/nodejs/node/pull/143',
        state: 'merged',
        author: 'sarah-dev',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 16 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 1,
        additions: 128,
        deletions: 19,
        commitsCount: 2,
        reviewStatus: 'REVIEWED',
        creditScore: 78,
        adminFeedback: 'Solid retry policy and defensive error handling. Saved the sync pipeline.',
        adminCriteria: { quality: 20, complexity: 19, impact: 20, testCoverage: 19 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 20 * 60 * 60 * 1000).toISOString(),
        tags: ['bugfix', 'nodejs', 'resilience']
      },
      {
        id: 'pr-103',
        githubPrNumber: 144,
        repo: 'rust-lang/rust',
        title: 'perf: optimize daily snapshot aggregation query index in compiler',
        description: 'Automatically tracked from rust-lang/rust. Reduced aggregation overhead from 450ms down to 14ms.',
        url: 'https://github.com/rust-lang/rust/pull/144',
        state: 'merged',
        author: 'alex-rustacean',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 32 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 2,
        additions: 64,
        deletions: 88,
        commitsCount: 3,
        reviewStatus: 'REVIEWED',
        creditScore: 92,
        adminFeedback: 'Brilliant index optimization and benchmark proof included. Huge performance win.',
        adminCriteria: { quality: 24, complexity: 23, impact: 24, testCoverage: 21 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 38 * 60 * 60 * 1000).toISOString(),
        tags: ['perf', 'rust', 'compiler']
      },
      {
        id: 'pr-104',
        githubPrNumber: 145,
        repo: 'tailwindlabs/tailwindcss',
        title: 'ui: implement starlit cosmos glass panels and aurora dividers',
        description: 'Automatically tracked from tailwindlabs/tailwindcss. DESIGN.md tokens with inset rim-light glows.',
        url: 'https://github.com/tailwindlabs/tailwindcss/pull/145',
        state: 'merged',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 36 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 2,
        additions: 512,
        deletions: 110,
        commitsCount: 5,
        reviewStatus: 'REVIEWED',
        creditScore: 90,
        adminFeedback: 'Flawless adherence to DESIGN.md tokens and monochromatic quiet aesthetic.',
        adminCriteria: { quality: 24, complexity: 21, impact: 23, testCoverage: 22 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 42 * 60 * 60 * 1000).toISOString(),
        tags: ['ui', 'tailwind', 'design-system']
      },
      {
        id: 'pr-105',
        githubPrNumber: 146,
        repo: 'tanstack/table',
        title: 'feat: add TanStack Table column sorting and pagination for leaderboard',
        description: 'Automatically tracked from tanstack/table. Integrates @tanstack/react-table headless grid.',
        url: 'https://github.com/tanstack/table/pull/146',
        state: 'merged',
        author: 'sarah-dev',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 54 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 3,
        additions: 430,
        deletions: 35,
        commitsCount: 3,
        reviewStatus: 'REVIEWED',
        creditScore: 88,
        adminFeedback: 'Clean table abstraction and responsive scroll controls. Very snappy.',
        adminCriteria: { quality: 22, complexity: 22, impact: 22, testCoverage: 22 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 60 * 60 * 1000).toISOString(),
        tags: ['tanstack-table', 'ui', 'virtualization']
      },
      {
        id: 'pr-106',
        githubPrNumber: 147,
        repo: 'microsoft/vscode',
        title: 'docs: comprehensive guide for manual admin credit scoring rubric',
        description: 'Automatically tracked from microsoft/vscode. Scoring guidelines across 4 core axes.',
        url: 'https://github.com/microsoft/vscode/pull/147',
        state: 'merged',
        author: 'elena-cloud',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 58 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 3,
        additions: 195,
        deletions: 12,
        commitsCount: 2,
        reviewStatus: 'REVIEWED',
        creditScore: 65,
        adminFeedback: 'Well written and transparent criteria documentation. Helpful for all new reviewers.',
        adminCriteria: { quality: 18, complexity: 12, impact: 18, testCoverage: 17 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(sprintStart.getTime() + 64 * 60 * 60 * 1000).toISOString(),
        tags: ['docs', 'vscode', 'rubric']
      },
      {
        id: 'pr-107',
        githubPrNumber: 148,
        repo: 'shadcn-ui/ui',
        title: 'feat: add accessible starlit modal primitive with focus trapping',
        description: 'Automatically tracked across repositories during daily scheduled ingestion. In review queue for admin score.',
        url: 'https://github.com/shadcn-ui/ui/pull/148',
        state: 'open',
        author: 'devon-craft',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 75 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 4,
        additions: 290,
        deletions: 22,
        commitsCount: 3,
        reviewStatus: 'PENDING_REVIEW', // Needs Admin Review!
        creditScore: 0,
        adminFeedback: '',
        adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
        reviewedBy: null,
        reviewedAt: null,
        tags: ['shadcn', 'ui', 'a11y']
      },
      {
        id: 'pr-108',
        githubPrNumber: 149,
        repo: 'astral-sh/uv',
        title: 'feat: add zero-allocation byte serializer in rust microservice',
        description: 'Automatically tracked across repositories during daily scheduled ingestion. In review queue for admin score.',
        url: 'https://github.com/astral-sh/uv/pull/149',
        state: 'open',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 78 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 4,
        additions: 340,
        deletions: 15,
        commitsCount: 4,
        reviewStatus: 'PENDING_REVIEW', // Needs Admin Review!
        creditScore: 0,
        adminFeedback: '',
        adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
        reviewedBy: null,
        reviewedAt: null,
        tags: ['rust', 'uv', 'perf']
      },
      {
        id: 'pr-109',
        githubPrNumber: 150,
        repo: 'torvalds/linux',
        title: 'test: add end-to-end integration tests for eBPF security telemetry',
        description: 'Automatically tracked across repositories during daily scheduled ingestion. In review queue for admin score.',
        url: 'https://github.com/torvalds/linux/pull/150',
        state: 'open',
        author: 'alex-rustacean',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(sprintStart.getTime() + 82 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 4,
        additions: 410,
        deletions: 18,
        commitsCount: 3,
        reviewStatus: 'PENDING_REVIEW', // Needs Admin Review!
        creditScore: 0,
        adminFeedback: '',
        adminCriteria: { quality: 0, complexity: 0, impact: 0, testCoverage: 0 },
        reviewedBy: null,
        reviewedAt: null,
        tags: ['linux', 'kernel', 'tests']
      }
    ],
    auditLogs: [
      {
        id: 'log-1',
        action: 'SPRINT_STARTED',
        actor: 'admin-starlit',
        details: 'Admin officially started PR tracking event. Daily update scheduled at 00:00 UTC.',
        timestamp: sprintStart.toISOString()
      },
      {
        id: 'log-2',
        action: 'AUTOMATIC_DAILY_UPDATE',
        actor: 'SCHEDULED_WORKER',
        details: 'Daily PR calculation completed for Day 2. Synced with tracked repositories.',
        timestamp: new Date(sprintStart.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-3',
        action: 'PR_REVIEWED',
        actor: 'admin-starlit',
        details: 'Admin reviewed PR #144 (alex-rustacean) -> Awarded 92 credits',
        timestamp: new Date(sprintStart.getTime() + 38 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-4',
        action: 'AUTOMATIC_DAILY_UPDATE',
        actor: 'SCHEDULED_WORKER',
        details: 'Daily PR calculation completed for Day 3. Synced with tracked repositories.',
        timestamp: new Date(sprintStart.getTime() + 48 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
};

class Database {
  constructor() {
    this.init();
    this.loadedFromBlob = false;
  }

  async ensureLoaded(force = false) {
    const now = Date.now();
    if (!force && this.lastLoadedAt && (now - this.lastLoadedAt < 3000)) return;
    try {
      const res = await fetch(`${BLOB_URL}?t=${now}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.sprint && Array.isArray(remoteData.pullRequests)) {
          // Safety merge: NEVER drop PRs created in local memory that might not yet be in remoteData!
          if (this.data && Array.isArray(this.data.pullRequests)) {
            const remotePrIds = new Set(remoteData.pullRequests.map(p => p.id));
            const localOnlyPrs = this.data.pullRequests.filter(p => !remotePrIds.has(p.id));
            if (localOnlyPrs.length > 0) {
              remoteData.pullRequests = [...localOnlyPrs, ...remoteData.pullRequests];
            }

            if (Array.isArray(this.data.users)) {
              const remoteUsernames = new Set((remoteData.users || []).map(u => u.username.toLowerCase()));
              const localOnlyUsers = this.data.users.filter(u => !remoteUsernames.has(u.username.toLowerCase()));
              if (localOnlyUsers.length > 0) {
                remoteData.users = [...(remoteData.users || []), ...localOnlyUsers];
              }
            }
          }

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

  async save() {
    this.lastLoadedAt = Date.now();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        await put('hackaaroh_data.json', JSON.stringify(this.data), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0,
          token
        });
      } catch (err) {
        console.error('Failed to sync to Vercel Blob:', err.message);
      }
    }
  }

  async reset() {
    this.data = getInitialSeed();
    await this.save();
    return this.data;
  }

  getSprint() {
    const repos = Array.from(new Set((this.data.pullRequests || []).map(pr => pr.repo))).filter(Boolean);
    const contributors = (this.data.users || []).filter(u => u.role !== 'admin');
    return {
      ...this.data.sprint,
      trackingScope: 'ALL_REPOSITORIES',
      trackedRepos: repos.length > 0 ? repos : (this.data.sprint.trackedRepos || []),
      totalTrackedContributors: contributors.length,
      totalDiscoveredRepos: repos.length
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
    await this.save();
    return this.data.users.length < initialLen;
  }

  getPullRequests() {
    return this.data.pullRequests;
  }

  getPullRequestById(id) {
    return this.data.pullRequests.find(pr => pr.id === id);
  }

  async addPullRequest(pr) {
    this.data.pullRequests.unshift(pr);
    await this.save();
    return pr;
  }

  async updatePullRequest(id, updates) {
    const idx = this.data.pullRequests.findIndex(pr => pr.id === id);
    if (idx >= 0) {
      this.data.pullRequests[idx] = { ...this.data.pullRequests[idx], ...updates };
      await this.save();
      return this.data.pullRequests[idx];
    }
    return null;
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
