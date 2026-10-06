import { LeaderboardResponse, PullRequest, Sprint, User, AuditLog } from '../types';

const BASE_URL = '/api';

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${BASE_URL}/auth/me`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function mockLogin(username: string, role: 'admin' | 'contributor' = 'contributor', name?: string, avatarUrl?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/mock-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role, name, avatarUrl })
  });
  if (!res.ok) throw new Error('Failed to login');
  const data = await res.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
}

export async function fetchGitHubOAuthUrl(): Promise<{ configured: boolean; url?: string; message?: string }> {
  const res = await fetch(`${BASE_URL}/auth/github/url`);
  return res.json();
}

export async function fetchSprint(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint`);
  if (!res.ok) throw new Error('Failed to fetch sprint');
  return res.json();
}

export async function toggleSprintStatus(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/toggle-status`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle sprint status');
  return res.json();
}

export async function endSprint(): Promise<{ sprint: Sprint; podium: any[] }> {
  const res = await fetch(`${BASE_URL}/sprint/end`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to end sprint');
  return res.json();
}

export async function startNewSprint(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/start-new`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start new sprint');
  return res.json();
}

export async function triggerDailySync(): Promise<{ message: string; sprint: Sprint; newPr: PullRequest }> {
  const res = await fetch(`${BASE_URL}/sprint/sync-daily`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run daily sync');
  return res.json();
}

export async function fetchPullRequests(filters?: { author?: string; status?: string; day?: number; repo?: string }): Promise<PullRequest[]> {
  const query = new URLSearchParams();
  if (filters?.author) query.set('author', filters.author);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.day) query.set('day', filters.day.toString());
  if (filters?.repo) query.set('repo', filters.repo);

  const res = await fetch(`${BASE_URL}/pull-requests?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export async function fetchPullRequestById(id: string): Promise<PullRequest> {
  const res = await fetch(`${BASE_URL}/pull-requests/${id}`);
  if (!res.ok) throw new Error('Failed to fetch pull request');
  return res.json();
}

export async function submitPullRequest(payload: {
  repo: string;
  title: string;
  description?: string;
  url?: string;
  additions?: number;
  deletions?: number;
  commitsCount?: number;
  tags?: string[];
}): Promise<PullRequest> {
  const res = await fetch(`${BASE_URL}/pull-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit pull request');
  return res.json();
}

export async function reviewPullRequest(payload: {
  prId: string;
  creditScore: number;
  feedback?: string;
  criteria?: {
    quality: number;
    complexity: number;
    impact: number;
    testCoverage: number;
  };
  reviewStatus?: 'REVIEWED' | 'REJECTED';
}): Promise<{ message: string; pr: PullRequest }> {
  const res = await fetch(`${BASE_URL}/admin/review-pr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to review pull request');
  }
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch(`${BASE_URL}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${BASE_URL}/admin/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/reset-db`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
}
