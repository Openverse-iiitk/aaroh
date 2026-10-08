export type UserRole = 'admin' | 'contributor';

export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  htmlUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type SprintStatus = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'FINALIZED';

export interface FinalPodiumItem {
  rank: number;
  badge: 'GOLD_STAR' | 'SILVER_STAR' | 'BRONZE_STAR';
  username: string;
  name: string;
  avatarUrl: string;
  totalCredits: number;
  totalPrs: number;
  mergedPrs: number;
}

export interface Sprint {
  id: string;
  name: string;
  description: string;
  status: SprintStatus;
  dailyUpdateTime: string;
  startDate: string | null;
  endDate: string | null;
  currentDay: number;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  trackingScope?: string;
  trackedRepos: string[];
  totalTrackedContributors?: number;
  totalDiscoveredRepos?: number;
  isFinalized: boolean;
  loginsPaused?: boolean;
  isUpcoming?: boolean;
  finalizedAt: string | null;
  finalPodium: FinalPodiumItem[];
}

export interface UserReviewsSummary {
  user: User;
  prs: PullRequest[];
  stats: {
    totalPrs: number;
    reviewedPrs: number;
    pendingPrs: number;
    totalCredits: number;
    avgCreditScore: number;
    distinctRepos: string[];
  };
}

export type PRReviewStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'REJECTED';
export type PRState = 'open' | 'merged' | 'closed';

export interface AdminCriteria {
  quality: number;
  complexity: number;
  impact: number;
  testCoverage: number;
}

export interface PullRequest {
  id: string;
  githubPrNumber: number;
  isRepoOnly?: boolean;
  repo: string;
  title: string;
  description: string;
  url: string;
  state: PRState;
  author: string;
  authorAvatar: string;
  createdAt: string;
  dayOfSprint: number;
  additions: number;
  deletions: number;
  commitsCount: number;
  reviewStatus: PRReviewStatus;
  creditScore: number;
  adminFeedback: string;
  adminCriteria: AdminCriteria;
  reviewedBy: string | null;
  reviewedAt: string | null;
  tags: string[];
}

export interface LeaderboardItem {
  rank: number;
  user: User;
  totalCredits: number;
  totalPrs: number;
  mergedPrs: number;
  openPrs: number;
  reviewedPrs: number;
  pendingPrs: number;
  totalAdditions: number;
  totalDeletions: number;
  dailyCredits: number[];
  dailyPrs: number[];
  prs: PullRequest[];
  avgCreditPerReviewedPr: number;
}

export interface LeaderboardResponse {
  sprint: Sprint;
  leaderboard: LeaderboardItem[];
  generatedAt: string;
  isFinalized: boolean;
  finalPodium: FinalPodiumItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}
