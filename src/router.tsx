import React, { useState } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate
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
  mockLogin,
  logout,
  resetDatabase
} from './api/client';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ReviewModal } from './components/ReviewModal';
import { FinalLeaderboardModal } from './components/FinalLeaderboardModal';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PullRequestsPage } from './pages/PullRequestsPage';
import { AdminPage } from './pages/AdminPage';
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

  const handleSwitchToAdmin = async () => {
    await loginMutation.mutateAsync({
      username: 'admin-starlit',
      role: 'admin',
      name: 'Admin Chief (Lead Reviewer)',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    });
    navigate({ to: '/admin' });
  };

  const outletContext = {
    sprint: sprint || {
      id: 'sprint-hackaaroh-current',
      name: 'Open Source PR Tracking Sprint',
      description: '',
      status: 'ACTIVE',
      dailyUpdateTime: '00:00',
      startDate: new Date().toISOString(),
      endDate: null,
      currentDay: 4,
      lastSyncAt: new Date().toISOString(),
      nextSyncAt: new Date().toISOString(),
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
    onSwitchToAdmin: handleSwitchToAdmin,
    isSyncing: syncMutation.isPending,
  };

  return (
    <RouteContextShim.Provider value={outletContext}>
      <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5]">
        {/* Navigation */}
        <Navbar
          user={currentUser || null}
          sprint={sprint}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSubmitPr={() => {}}
          onLogout={() => logoutMutation.mutate()}
        />

        {/* Main Page Outlet */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="w-full py-6 border-t border-white/10 text-center text-xs text-zinc-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>HackAaroh PR Tracker — Event Platform</span>
            </div>
            <div className="text-zinc-500">
              Automated PR Ingestion • Daily Review &amp; Scoring • Contributor Rankings
            </div>
          </div>
        </footer>

        {/* Dialog Modals */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSelectMockUser={handleSelectMockUser}
          isLoading={loginMutation.isPending}
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
    const routeContext = (rootRoute.useRouteContext ? {} : {}) as any;
    // We retrieve context passed from Outlet
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
      onStartNewSprint={context.onStartNewSprint}
      onSyncDaily={context.onSyncDaily}
      onResetDatabase={context.onResetDatabase}
      onSwitchToAdmin={context.onSwitchToAdmin}
      isSyncing={context.isSyncing}
    />
  );
}

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  leaderboardRoute,
  pullRequestsRoute,
  adminRoute,
]);

export const router = createRouter({ routeTree });

// React Context shim to seamlessly pass shared state to child routes
export const RouteContextShim = React.createContext<any>({});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
