import { LeaderboardResponse, PullRequest, Sprint, User, AuditLog } from '../types';

const BASE_URL = '/api';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('reflect_session_token') || localStorage.getItem('reflect_admin_token');
      if (token) {
        headers['x-session-token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      const user = localStorage.getItem('reflect_active_user');
      if (user) {
        headers['x-session-user'] = user;
      }
    }
  } catch {}
  return headers;
}

export async function fetchCurrentUser(): Promise<User | null> {
  // If ?token=... is present in URL (e.g. from GitHub OAuth redirect), store it!
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      try {
        localStorage.setItem('reflect_session_token', tokenParam);
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: authHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    try {
      localStorage.removeItem('reflect_active_user');
      localStorage.removeItem('reflect_session_token');
      localStorage.removeItem('reflect_admin_token');
    } catch {}
    return null;
  }
  const data = await res.json();
  if (data.user) {
    const purged = ['rohan-satheesh', 'deva4509', 'manav-codes', 'sarah-dev', 'admin-starlit', 'ptr25', 'vipulreddyvemula'];
    if (purged.includes((data.user.username || '').toLowerCase())) {
      try {
        localStorage.removeItem('reflect_active_user');
        localStorage.removeItem('reflect_session_token');
        localStorage.removeItem('reflect_admin_token');
      } catch {}
      return null;
    }
    // Auto-evict non-admin participants while logins are paused
    if (data.paused) {
      try {
        localStorage.removeItem('reflect_active_user');
        localStorage.removeItem('reflect_session_token');
        localStorage.removeItem('reflect_admin_token');
      } catch {}
      return null;
    }
    try { localStorage.setItem('reflect_active_user', data.user.username); } catch {}
  } else {
    try {
      localStorage.removeItem('reflect_active_user');
      localStorage.removeItem('reflect_session_token');
      localStorage.removeItem('reflect_admin_token');
    } catch {}
  }
  return data.user;
}

export async function adminSecretLogin(secretKey: string, username?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/admin-secret-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secretKey, username }),
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid admin secret passkey');
  }
  const data = await res.json();
  if (data.token) {
    try {
      localStorage.setItem('reflect_admin_token', data.token);
      localStorage.setItem('reflect_session_token', data.token);
    } catch {}
  }
  if (data.user) {
    try { localStorage.setItem('reflect_active_user', data.user.username); } catch {}
  }
  return data.user;
}

export async function mockLogin(username: string, role: 'admin' | 'contributor' = 'contributor', name?: string, avatarUrl?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/mock-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role, name, avatarUrl }),
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to login');
  }
  const data = await res.json();
  if (data.token) {
    try {
      localStorage.setItem('reflect_session_token', data.token);
      localStorage.removeItem('reflect_admin_token');
    } catch {}
  }
  if (data.user) {
    try { localStorage.setItem('reflect_active_user', data.user.username); } catch {}
  }
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem('reflect_active_user');
    localStorage.removeItem('reflect_session_token');
    localStorage.removeItem('reflect_admin_token');
  } catch {}
  await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: authHeaders(), credentials: 'include' });
}

export async function fetchGitHubOAuthUrl(): Promise<{ configured: boolean; url?: string; message?: string }> {
  const res = await fetch(`${BASE_URL}/auth/github/url`, { credentials: 'include' });
  return res.json();
}

export async function fetchSprint(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint`);
  if (!res.ok) throw new Error('Failed to fetch sprint');
  return res.json();
}

export async function startSprint(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/start`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to start sprint');
  return res.json();
}

export async function toggleSprintStatus(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/toggle-status`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to toggle sprint status');
  return res.json();
}

export async function endSprint(): Promise<{ sprint: Sprint; podium: any[] }> {
  const res = await fetch(`${BASE_URL}/sprint/end`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to end sprint');
  return res.json();
}

export async function updateSprintSettings(payload: { dailyUpdateTime?: string; name?: string; trackedRepos?: string[] }): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/update-settings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update sprint settings');
  return res.json();
}

export async function resetToNotStarted(): Promise<Sprint> {
  const res = await fetch(`${BASE_URL}/sprint/reset-to-not-started`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to reset sprint to not started');
  return res.json();
}

export async function triggerDailySync(): Promise<{ success: boolean; sprint: Sprint; ingestedPrs: PullRequest[] }> {
  const res = await fetch(`${BASE_URL}/sprint/sync-daily`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to run daily sync');
  return res.json();
}

export async function fetchPullRequests(filters?: { author?: string; status?: string; day?: number; repo?: string; mine?: boolean }): Promise<PullRequest[]> {
  const query = new URLSearchParams();
  if (filters?.author) query.set('author', filters.author);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.day) query.set('day', filters.day.toString());
  if (filters?.repo) query.set('repo', filters.repo);
  if (filters?.mine) query.set('mine', 'true');

  const res = await fetch(`${BASE_URL}/pull-requests?${query.toString()}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export async function fetchMyReviewsSummary(): Promise<any> {
  const res = await fetch(`${BASE_URL}/pull-requests/my`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch personal PR reviews');
  return res.json();
}

export async function fetchPullRequestById(id: string): Promise<PullRequest> {
  const res = await fetch(`${BASE_URL}/pull-requests/${id}`);
  if (!res.ok) throw new Error('Failed to fetch pull request');
  return res.json();
}

export async function submitPullRequest(payload: {
  repo?: string;
  title?: string;
  description?: string;
  url: string;
  additions?: number;
  deletions?: number;
  commitsCount?: number;
  tags?: string[];
}): Promise<PullRequest> {
  const res = await fetch(`${BASE_URL}/pull-requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to submit pull request');
  }
  const data = await res.json();
  return data.pr || data;
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
    headers: authHeaders(),
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
  const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/reset-db`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to reset database');
}

export async function syncGitHubPullRequests(): Promise<{ success: boolean; message: string; syncedCount: number; prs: PullRequest[] }> {
  const res = await fetch(`${BASE_URL}/pull-requests/sync`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to sync PRs from GitHub');
  return res.json();
}
