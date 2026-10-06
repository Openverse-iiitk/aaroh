import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// Initial seed data representing a 1-week GitHub Sprint
const getInitialSeed = () => {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days into current sprint
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    sprint: {
      id: 'sprint-week-41',
      name: 'HackAaroh Starlit Weekly Sprint',
      description: 'Weekly GitHub open-source PR tracking sprint. Admins review PRs daily and award credits.',
      status: 'ACTIVE', // ACTIVE | PAUSED | FINALIZED
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      currentDay: 4, // Day 4 of 7
      totalDays: 7,
      lastSyncAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      nextSyncAt: new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString(),
      trackedRepos: [
        'openverse/hackaaroh',
        'tanstack/react-router',
        'facebook/react',
        'astral-sh/uv'
      ],
      isFinalized: false,
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
        createdAt: weekStart.toISOString()
      },
      {
        id: 'usr_sarah',
        username: 'sarah-dev',
        name: 'Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        bio: 'Systems engineer & TypeScript fanatic',
        htmlUrl: 'https://github.com/sarah-dev',
        role: 'contributor',
        createdAt: weekStart.toISOString()
      },
      {
        id: 'usr_alex',
        username: 'alex-rustacean',
        name: 'Alex Rivera',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Rust & WebAssembly specialist',
        htmlUrl: 'https://github.com/alex-rustacean',
        role: 'contributor',
        createdAt: weekStart.toISOString()
      },
      {
        id: 'usr_elena',
        username: 'elena-cloud',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Distributed systems & TanStack fan',
        htmlUrl: 'https://github.com/elena-cloud',
        role: 'contributor',
        createdAt: weekStart.toISOString()
      },
      {
        id: 'usr_devon',
        username: 'devon-craft',
        name: 'Devon Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Frontend architect and performance junkie',
        htmlUrl: 'https://github.com/devon-craft',
        role: 'contributor',
        createdAt: weekStart.toISOString()
      },
      {
        id: 'usr_admin',
        username: 'admin-starlit',
        name: 'Admin Chief (Lead Reviewer)',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        bio: 'Sprint Administrator & Lead Code Reviewer',
        htmlUrl: 'https://github.com/admin-starlit',
        role: 'admin',
        createdAt: weekStart.toISOString()
      }
    ],
    pullRequests: [
      {
        id: 'pr-101',
        githubPrNumber: 142,
        repo: 'openverse/hackaaroh',
        title: 'feat: add resilient TanStack Query caching layer for PR ingestion',
        description: 'Implements optimistic updates and multi-level query invalidation for the daily leaderboard.',
        url: 'https://github.com/openverse/hackaaroh/pull/142',
        state: 'merged',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 1,
        additions: 384,
        deletions: 42,
        commitsCount: 4,
        reviewStatus: 'REVIEWED',
        creditScore: 85,
        adminFeedback: 'Exceptional test coverage and cleanly structured caching boundaries. Great impact!',
        adminCriteria: { quality: 23, complexity: 22, impact: 20, testCoverage: 20 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        tags: ['tanstack', 'caching', 'feat']
      },
      {
        id: 'pr-102',
        githubPrNumber: 143,
        repo: 'openverse/hackaaroh',
        title: 'fix: handle rate-limit throttling in GitHub sync worker',
        description: 'Adds exponential backoff and secondary token pool rotation when rate limits hit 429.',
        url: 'https://github.com/openverse/hackaaroh/pull/143',
        state: 'merged',
        author: 'sarah-dev',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 16 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 1,
        additions: 128,
        deletions: 19,
        commitsCount: 2,
        reviewStatus: 'REVIEWED',
        creditScore: 78,
        adminFeedback: 'Solid retry policy and defensive error handling. Saved the sync pipeline.',
        adminCriteria: { quality: 20, complexity: 19, impact: 20, testCoverage: 19 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 20 * 60 * 60 * 1000).toISOString(),
        tags: ['bugfix', 'github-api', 'resilience']
      },
      {
        id: 'pr-103',
        githubPrNumber: 144,
        repo: 'openverse/hackaaroh',
        title: 'perf: optimize daily snapshot aggregation query index',
        description: 'Reduced aggregation overhead from 450ms down to 14ms across 10,000 historical records.',
        url: 'https://github.com/openverse/hackaaroh/pull/144',
        state: 'merged',
        author: 'alex-rustacean',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 32 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 2,
        additions: 64,
        deletions: 88,
        commitsCount: 3,
        reviewStatus: 'REVIEWED',
        creditScore: 92,
        adminFeedback: 'Brilliant index optimization and benchmark proof included. Huge performance win.',
        adminCriteria: { quality: 24, complexity: 23, impact: 24, testCoverage: 21 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 38 * 60 * 60 * 1000).toISOString(),
        tags: ['perf', 'database', 'optimization']
      },
      {
        id: 'pr-104',
        githubPrNumber: 145,
        repo: 'openverse/hackaaroh',
        title: 'ui: implement starlit cosmos glass panels and aurora dividers',
        description: 'Implements Design token specifications with inset rim-light glows and Aeonik medium typography.',
        url: 'https://github.com/openverse/hackaaroh/pull/145',
        state: 'merged',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 36 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 2,
        additions: 512,
        deletions: 110,
        commitsCount: 5,
        reviewStatus: 'REVIEWED',
        creditScore: 90,
        adminFeedback: 'Flawless adherence to DESIGN.md tokens and monochromatic quiet aesthetic.',
        adminCriteria: { quality: 24, complexity: 21, impact: 23, testCoverage: 22 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 42 * 60 * 60 * 1000).toISOString(),
        tags: ['ui', 'design-system', 'tailwind']
      },
      {
        id: 'pr-105',
        githubPrNumber: 146,
        repo: 'openverse/hackaaroh',
        title: 'feat: add TanStack Table column sorting and pagination for leaderboard',
        description: 'Integrates @tanstack/react-table headless grid with customizable metric filters.',
        url: 'https://github.com/openverse/hackaaroh/pull/146',
        state: 'merged',
        author: 'sarah-dev',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 54 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 3,
        additions: 430,
        deletions: 35,
        commitsCount: 3,
        reviewStatus: 'REVIEWED',
        creditScore: 88,
        adminFeedback: 'Clean table abstraction and responsive scroll controls. Very snappy.',
        adminCriteria: { quality: 22, complexity: 22, impact: 22, testCoverage: 22 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 60 * 60 * 1000).toISOString(),
        tags: ['tanstack-table', 'ui', 'leaderboard']
      },
      {
        id: 'pr-106',
        githubPrNumber: 147,
        repo: 'openverse/hackaaroh',
        title: 'docs: comprehensive guide for manual admin credit scoring rubric',
        description: 'Documents scoring guidelines across Code Quality, Complexity, Impact, and Tests.',
        url: 'https://github.com/openverse/hackaaroh/pull/147',
        state: 'merged',
        author: 'elena-cloud',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 58 * 60 * 60 * 1000).toISOString(),
        dayOfSprint: 3,
        additions: 195,
        deletions: 12,
        commitsCount: 2,
        reviewStatus: 'REVIEWED',
        creditScore: 65,
        adminFeedback: 'Well written and transparent criteria documentation. Helpful for all new reviewers.',
        adminCriteria: { quality: 18, complexity: 12, impact: 18, testCoverage: 17 },
        reviewedBy: 'admin-starlit',
        reviewedAt: new Date(weekStart.getTime() + 64 * 60 * 60 * 1000).toISOString(),
        tags: ['docs', 'rubric']
      },
      {
        id: 'pr-107',
        githubPrNumber: 148,
        repo: 'openverse/hackaaroh',
        title: 'feat: add automated daily sync cron with manual admin override',
        description: 'Implements recurring sync scheduler every 24h with lock guards against duplicate ingestion.',
        url: 'https://github.com/openverse/hackaaroh/pull/148',
        state: 'open',
        author: 'devon-craft',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 75 * 60 * 60 * 1000).toISOString(),
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
        tags: ['cron', 'daily-sync', 'worker']
      },
      {
        id: 'pr-108',
        githubPrNumber: 149,
        repo: 'openverse/hackaaroh',
        title: 'feat: add sprint finalization and podium snapshot generator',
        description: 'Allows sprint admins to freeze rankings and declare winners with cryptographic timestamp hash.',
        url: 'https://github.com/openverse/hackaaroh/pull/149',
        state: 'open',
        author: 'manav-codes',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 78 * 60 * 60 * 1000).toISOString(),
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
        tags: ['sprint', 'leaderboard', 'podium']
      },
      {
        id: 'pr-109',
        githubPrNumber: 150,
        repo: 'openverse/hackaaroh',
        title: 'test: add end-to-end integration tests for credit audit trail',
        description: 'Simulates admin scoring lifecycle and validates leaderboard recalculation invariant.',
        url: 'https://github.com/openverse/hackaaroh/pull/150',
        state: 'open',
        author: 'alex-rustacean',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(weekStart.getTime() + 82 * 60 * 60 * 1000).toISOString(),
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
        tags: ['tests', 'e2e', 'security']
      }
    ],
    auditLogs: [
      {
        id: 'log-1',
        action: 'SPRINT_STARTED',
        actor: 'admin-starlit',
        details: 'Weekly sprint initialized with 7-day tracking window',
        timestamp: weekStart.toISOString()
      },
      {
        id: 'log-2',
        action: 'PR_REVIEWED',
        actor: 'admin-starlit',
        details: 'Awarded 85 credits to PR #142 (manav-codes)',
        timestamp: new Date(weekStart.getTime() + 14 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-3',
        action: 'DAILY_SYNC',
        actor: 'SYSTEM_CRON',
        details: 'Day 2 tracking update finished. 2 new PRs ingested.',
        timestamp: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-4',
        action: 'PR_REVIEWED',
        actor: 'admin-starlit',
        details: 'Awarded 92 credits to PR #144 (alex-rustacean)',
        timestamp: new Date(weekStart.getTime() + 38 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-5',
        action: 'DAILY_SYNC',
        actor: 'SYSTEM_CRON',
        details: 'Day 3 tracking update finished. 2 new PRs ingested.',
        timestamp: new Date(weekStart.getTime() + 48 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const initial = getInitialSeed();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        this.data = initial;
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error initializing db, resetting to seed:', err);
      this.data = getInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  reset() {
    this.data = getInitialSeed();
    this.save();
    return this.data;
  }

  getSprint() {
    return this.data.sprint;
  }

  updateSprint(updates) {
    this.data.sprint = { ...this.data.sprint, ...updates };
    this.save();
    return this.data.sprint;
  }

  getUsers() {
    return this.data.users;
  }

  getUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  upsertUser(user) {
    const idx = this.data.users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.save();
    return this.getUserByUsername(user.username);
  }

  getPullRequests() {
    return this.data.pullRequests;
  }

  getPullRequestById(id) {
    return this.data.pullRequests.find(pr => pr.id === id);
  }

  addPullRequest(pr) {
    this.data.pullRequests.unshift(pr);
    this.save();
    return pr;
  }

  updatePullRequest(id, updates) {
    const idx = this.data.pullRequests.findIndex(pr => pr.id === id);
    if (idx >= 0) {
      this.data.pullRequests[idx] = { ...this.data.pullRequests[idx], ...updates };
      this.save();
      return this.data.pullRequests[idx];
    }
    return null;
  }

  addAuditLog(action, actor, details) {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      actor,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 50) {
      this.data.auditLogs.pop();
    }
    this.save();
    return entry;
  }

  getAuditLogs() {
    return this.data.auditLogs;
  }

  // Calculate dynamic leaderboard with daily progression
  getLeaderboard() {
    const users = this.data.users.filter(u => u.role !== 'admin');
    const prs = this.data.pullRequests;

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
        dailyCredits: [0, 0, 0, 0, 0, 0, 0], // Days 1 to 7
        dailyPrs: [0, 0, 0, 0, 0, 0, 0],
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
          dailyCredits: [0, 0, 0, 0, 0, 0, 0],
          dailyPrs: [0, 0, 0, 0, 0, 0, 0],
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

      const dayIdx = Math.max(0, Math.min(6, (pr.dayOfSprint || 1) - 1));
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

    // Rank by totalCredits descending, then mergedPrs descending, then totalPrs descending
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
