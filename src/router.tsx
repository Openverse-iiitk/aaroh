import React, { useState } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  Link
} from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCurrentUser,
  fetchSprint,
  fetchLeaderboard,
  fetchPullRequests,
  fetchAuditLogs,
  triggerDailySync,
  toggleSprintStatus,
  startSprint,
  endSprint,
  updateSprintSettings,
  resetToNotStarted,
  reviewPullRequest,
  deletePullRequest,
  submitPullRequest,
  mockLogin,
  logout,
  resetDatabase,
  syncGitHubPullRequests
} from './api/client';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ReviewModal } from './components/ReviewModal';
import { SubmitPrModal } from './components/SubmitPrModal';
import { FinalLeaderboardModal } from './components/FinalLeaderboardModal';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PullRequestsPage } from './pages/PullRequestsPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { SecretAdminPage } from './pages/SecretAdminPage';
import { PullRequest } from './types';

// Root layout component
function RootLayout() {
  const queryClient = useQueryClient();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [submitPrModalOpen, setSubmitPrModalOpen] = useState(false);
  const [reviewPrModalPr, setReviewPrModalPr] = useState<PullRequest | null>(null);
  const [finalLeaderboardModalOpen, setFinalLeaderboardModalOpen] = useState(false);

  // Queries
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  });

  const { data: sprint } = useQuery({
    queryKey: ['sprint'],
    queryFn: fetchSprint,
    refetchInterval: 15000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    refetchInterval: 15000,
  });

  const { data: pullRequests = [] } = useQuery({
    queryKey: ['pullRequests'],
    queryFn: () => fetchPullRequests(),
    refetchInterval: 15000,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: fetchAuditLogs,
    enabled: currentUser?.role === 'admin',
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: triggerDailySync,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleSprintStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const endSprintMutation = useMutation({
    mutationFn: endSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setFinalLeaderboardModalOpen(true);
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: startSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSprintSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const resetToNotStartedMutation = useMutation({
    mutationFn: resetToNotStarted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: reviewPullRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setReviewPrModalPr(null);
    },
  });

  const deletePrMutation = useMutation({
    mutationFn: deletePullRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, role, name, avatarUrl }: any) =>
      mockLogin(username, role, name, avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setAuthModalOpen(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const resetDbMutation = useMutation({
    mutationFn: resetDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const submitPrMutation = useMutation({
    mutationFn: submitPullRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSubmitPrModalOpen(false);
    },
  });

  const syncGitHubMutation = useMutation({
    mutationFn: syncGitHubPullRequests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pullRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const navigate = useNavigate();

  const handleSelectMockUser = async (
    username: string,
    role: 'admin' | 'contributor',
    name?: string,
    avatarUrl?: string
  ) => {
    await loginMutation.mutateAsync({ username, role, name, avatarUrl });
    setAuthModalOpen(false);
    if (role === 'admin') {
      navigate({ to: '/admin' });
    } else {
      navigate({ to: '/leaderboard' });
    }
  };

  React.useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session') || urlParams.get('user');
      if (sessionParam) {
        localStorage.setItem('reflect_active_user', sessionParam);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    } catch {}
  }, []);

  const outletContext = {
    sprint: sprint || {
      id: 'sprint-hackaaroh-current',
      name: 'Open Source PR Tracking Sprint',
      description: '',
      status: 'ACTIVE',
      dailyUpdateTime: '00:00',
      startDate: '2026-10-08T18:30:00.000Z',
      endDate: null,
      currentDay: 1,
      lastSyncAt: new Date().toISOString(),
      nextSyncAt: new Date(Math.ceil(Date.now() / 86400000) * 86400000).toISOString(),
      trackedRepos: ['openverse/hackaaroh'],
      isFinalized: false,
      finalizedAt: null,
      finalPodium: [],
    },
    leaderboard: leaderboardData?.leaderboard || [],
    pullRequests: pullRequests || [],
    recentPrs: pullRequests || [],
    auditLogs: auditLogs || [],
    currentUser: currentUser || null,
    onOpenAuth: () => setAuthModalOpen(true),
    onSyncDaily: () => syncMutation.mutate(),
    onToggleStatus: () => toggleStatusMutation.mutate(),
    onEndTracking: () => endSprintMutation.mutate(),
    onStartSprint: () => startSprintMutation.mutate(),
    onStartNewSprint: () => startSprintMutation.mutate(),
    onUpdateSettings: (payload: any) => updateSettingsMutation.mutate(payload),
    onResetToNotStarted: () => resetToNotStartedMutation.mutate(),
    onSelectPrForReview: (pr: PullRequest) => setReviewPrModalPr(pr),
    onResetDatabase: () => resetDbMutation.mutate(),
    onDeletePr: (id: string) => deletePrMutation.mutateAsync(id),
    onSwitchToAdmin: () => navigate({ to: '/admin' }),
    onOpenSubmitPr: () => setSubmitPrModalOpen(true),
    onSyncGitHub: () => syncGitHubMutation.mutateAsync(),
    isSyncing: syncMutation.isPending,
    isSyncingGitHub: syncGitHubMutation.isPending,
  };

  const targetStartMs = new Date('2026-10-08T18:30:00.000Z').getTime();
  const isPreEvent = (Date.now() < targetStartMs) || Boolean(sprint?.isUpcoming);

  return (
    <RouteContextShim.Provider value={outletContext}>
      <div className="min-h-screen flex flex-col bg-[#060507] text-[#ecf1ee]">
        {/* Navigation */}
        <Navbar
          user={currentUser || null}
          sprint={sprint}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSubmitPr={() => setSubmitPrModalOpen(true)}
          onLogout={() => logoutMutation.mutate()}
        />

        {/* Main Page Outlet */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Footer */}
        {isPreEvent ? (
          <footer className="relative z-20 w-full py-6 border-t border-white/15 text-xs text-zinc-300 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_-8px_32px_rgba(0,0,0,0.25)]">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>© Openverse · HackAaroh</span>
              <div className="flex items-center gap-4 text-zinc-400">
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="w-full py-8 border-t border-white/10 text-xs text-zinc-500 bg-[#040705]">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-300 font-medium">HackAaroh PR Tracker</span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-500 hidden sm:inline">Open Source Sprint Event Platform</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
                <Link to="/leaderboard" className="hover:text-white transition-colors">
                  Leaderboard
                </Link>
                <Link to="/pull-requests" className="hover:text-white transition-colors">
                  Submitted PRs
                </Link>
              </div>
            </div>
          </footer>
        )}

        {/* Dialog Modals */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          isLoading={loginMutation.isPending}
          loginsPaused={sprint?.loginsPaused}
        />

        <SubmitPrModal
          isOpen={submitPrModalOpen}
          onClose={() => setSubmitPrModalOpen(false)}
          currentUser={currentUser || null}
          sprint={sprint}
          onSubmitPr={async (payload) => {
            await submitPrMutation.mutateAsync(payload);
          }}
          isSubmitting={submitPrMutation.isPending}
        />

        <ReviewModal
          isOpen={!!reviewPrModalPr}
          onClose={() => setReviewPrModalPr(null)}
          pr={reviewPrModalPr}
          onSubmitReview={async (payload) => {
            await reviewMutation.mutateAsync(payload);
          }}
          isSubmitting={reviewMutation.isPending}
        />

        {sprint && leaderboardData && (
          <FinalLeaderboardModal
            isOpen={finalLeaderboardModalOpen}
            onClose={() => setFinalLeaderboardModalOpen(false)}
            sprint={sprint}
            leaderboard={leaderboardData.leaderboard}
          />
        )}
      </div>
    </RouteContextShim.Provider>
  );
}

// Root Route definition
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Home Route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexComponent() {
    return <HomeView />;
  },
});

function HomeView() {
  const context = (React as any).useContext(RouteContextShim);
  return <HomePage {...context} />;
}

// Leaderboard Route
const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: function LeaderboardComponent() {
    return <LeaderboardView />;
  },
});

function LeaderboardView() {
  const context = (React as any).useContext(RouteContextShim);
  return (
    <LeaderboardPage
      leaderboard={context.leaderboard}
      sprint={context.sprint}
      pullRequests={context.pullRequests}
      currentUser={context.currentUser}
      onSelectPrForReview={context.onSelectPrForReview}
      isAdmin={context.currentUser?.role === 'admin'}
    />
  );
}

// Pull Requests Route
const pullRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pull-requests',
  component: function PullRequestsComponent() {
    return <PullRequestsView />;
  },
});

function PullRequestsView() {
  const context = (React as any).useContext(RouteContextShim);
  return (
    <PullRequestsPage
      pullRequests={context.pullRequests}
      sprint={context.sprint}
      currentUser={context.currentUser}
      onSelectPrForReview={context.onSelectPrForReview}
      onOpenAuth={context.onOpenAuth}
      onOpenSubmitPr={context.onOpenSubmitPr}
      onSyncGitHub={context.onSyncGitHub}
      isSyncingGitHub={context.isSyncingGitHub}
    />
  );
}

// Admin Route
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: function AdminComponent() {
    return <AdminView />;
  },
});

function AdminView() {
  const context = (React as any).useContext(RouteContextShim);
  return (
    <AdminPage
      currentUser={context.currentUser}
      sprint={context.sprint}
      pullRequests={context.pullRequests}
      auditLogs={context.auditLogs}
      onSelectPrForReview={context.onSelectPrForReview}
      onToggleStatus={context.onToggleStatus}
      onEndTracking={context.onEndTracking}
      onStartSprint={context.onStartSprint}
      onStartNewSprint={context.onStartNewSprint}
      onSyncDaily={context.onSyncDaily}
      onUpdateSettings={context.onUpdateSettings}
      onResetToNotStarted={context.onResetToNotStarted}
      onResetDatabase={context.onResetDatabase}
      onDeletePr={context.onDeletePr}
      onSwitchToAdmin={context.onSwitchToAdmin}
      isSyncing={context.isSyncing}
    />
  );
}

// About Route
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function AboutComponent() {
    return <AboutView />;
  },
});

function AboutView() {
  const context = (React as any).useContext(RouteContextShim);
  return (
    <AboutPage
      currentUser={context.currentUser}
      onOpenAuth={context.onOpenAuth}
    />
  );
}

// FAQ Route
const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: function FaqComponent() {
    return <FaqView />;
  },
});

function FaqView() {
  return <FaqPage />;
}

// Secret Organizer Portal Route
const secretAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/secret-admin',
  component: function SecretAdminComponent() {
    return <SecretAdminPage />;
  },
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  leaderboardRoute,
  pullRequestsRoute,
  adminRoute,
  aboutRoute,
  faqRoute,
  secretAdminRoute,
]);

export const router = createRouter({ routeTree });

// React Context shim to seamlessly pass shared state to child routes
export const RouteContextShim = React.createContext<any>({});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
