import React from 'react';
import { Hero } from '../components/Hero';
import { SprintTimerCard } from '../components/SprintTimerCard';
import { Podium } from '../components/Podium';
import { LeaderboardItem, PullRequest, Sprint, User } from '../types';
import { Link } from '@tanstack/react-router';
import { Trophy, GitPullRequest, ArrowRight, ShieldCheck, CheckCircle2, Clock, GitMerge, ExternalLink, Star } from 'lucide-react';

interface HomePageProps {
  sprint: Sprint;
  leaderboard?: LeaderboardItem[];
  pullRequests?: PullRequest[];
  recentPrs?: PullRequest[];
  currentUser: User | null;
  onOpenSubmitPr: () => void;
  onOpenAuth: () => void;
  onSyncDaily: () => void;
  onToggleStatus: () => void;
  onEndTracking: () => void;
  onStartNewSprint: () => void;
  onSelectPrForReview: (pr: PullRequest) => void;
  isSyncing: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  sprint,
  leaderboard = [],
  pullRequests = [],
  recentPrs = [],
  currentUser,
  onOpenSubmitPr,
  onOpenAuth,
  onSyncDaily,
  onToggleStatus,
  onEndTracking,
  onStartNewSprint,
  onSelectPrForReview,
  isSyncing
}) => {
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];
  const allPrs = (Array.isArray(pullRequests) && pullRequests.length > 0)
    ? pullRequests
    : (Array.isArray(recentPrs) ? recentPrs : []);
  const topThree = safeLeaderboard.slice(0, 3);
  const pendingPrs = allPrs.filter(pr => pr && pr.reviewStatus === 'PENDING_REVIEW');

  return (
    <div className="w-full pb-20">
      {/* Hero section */}
      <Hero
        sprint={sprint}
        onOpenSubmitPr={onOpenSubmitPr}
        onOpenAuth={onOpenAuth}
        isAuthenticated={!!currentUser}
      />

      {/* 7-Day Sprint Tracking & Control Card */}
      <SprintTimerCard
        sprint={sprint}
        currentUser={currentUser}
        onSyncDaily={onSyncDaily}
        onToggleStatus={onToggleStatus}
        onEndTracking={onEndTracking}
        onStartNewSprint={onStartNewSprint}
        isSyncing={isSyncing}
      />

      {/* Podium for top 3 ranked contributors */}
      <Podium topThree={topThree} isFinalized={sprint.isFinalized} />

      {/* Live Leaderboard Snapshot + Daily Feed */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Leaderboard Standings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-lavender-accent" />
              <h3 className="text-lg font-medium text-lilac-white">
                Leaderboard Standings
              </h3>
            </div>
            <Link
              to="/leaderboard"
              className="text-xs text-lavender-accent hover:text-lilac-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>View Full Data Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5 panel-glass overflow-hidden">
            {safeLeaderboard.slice(0, 5).map((item) => (
              <div
                key={item.user.id}
                className="p-4 flex items-center justify-between text-sm hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      item.rank === 1
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : item.rank === 2
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : item.rank === 3
                        ? 'bg-amber-800/20 text-amber-500 border border-amber-700/30'
                        : 'bg-white/5 text-fog'
                    }`}
                  >
                    #{item.rank}
                  </span>

                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.username}
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                  />

                  <div>
                    <span className="font-medium text-lilac-white block">
                      {item.user.name}
                    </span>
                    <span className="text-xs text-fog">@{item.user.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs text-right">
                  <div>
                    <span className="text-fog block text-[11px]">Pull Requests</span>
                    <span className="text-ash font-medium">
                      {item.mergedPrs} merged / {item.totalPrs} total
                    </span>
                  </div>

                  <div>
                    <span className="text-fog block text-[11px]">Credit Score</span>
                    <span className="text-sm font-semibold text-cosmic-gradient">
                      {item.totalCredits} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt banner for Contributor */}
          <div className="p-4 rounded-card bg-midnight-surface border border-white/5 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-lilac-white">
                Participating in this week&apos;s sprint?
              </h4>
              <p className="text-xs text-ash mt-0.5">
                Submit your pull requests anytime. Administrators review PRs daily to assign credit points.
              </p>
            </div>
            <button
              onClick={onOpenSubmitPr}
              disabled={sprint.isFinalized}
              className="btn-secondary !text-xs !py-1.5 !px-3 flex-shrink-0 disabled:opacity-40"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-lavender-accent" />
              <span>Submit PR</span>
            </button>
          </div>
        </div>

        {/* Right Column: Recent PR Activity & Admin Needs-Review Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-lavender-accent" />
              <h3 className="text-lg font-medium text-lilac-white">
                Daily PR Activity
              </h3>
            </div>
            <Link
              to="/pull-requests"
              className="text-xs text-lavender-accent hover:text-lilac-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>All PRs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pending Admin Review alert if any */}
          {pendingPrs.length > 0 && (
            <div className="p-3.5 rounded-btn bg-deep-indigo border border-lavender-accent/30 flex items-start gap-2.5 shadow-badge">
              <ShieldCheck className="w-4 h-4 text-lavender-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-medium text-lilac-white block">
                  {pendingPrs.length} PRs Awaiting Admin Grading
                </span>
                <span className="text-ash block mt-0.5">
                  Admins manually inspect code and award credits.
                </span>
                {currentUser?.role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="mt-2 text-lavender-accent hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Open Admin Review Queue &rarr;
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          {/* Recent PR list */}
          <div className="space-y-3">
            {allPrs.slice(0, 4).map((pr) => (
              <div
                key={pr.id}
                className="panel-glass p-3.5 hover:border-lavender-accent/20 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <img
                      src={pr.authorAvatar}
                      alt={pr.author}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-fog">@{pr.author}</span>
                    <span className="text-steel">•</span>
                    <span className="text-ash">Day {pr.dayOfSprint}</span>
                  </div>

                  {pr.reviewStatus === 'REVIEWED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                      +{pr.creditScore} pts
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                      Needs Review
                    </span>
                  )}
                </div>

                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-lilac-white hover:text-lavender-accent transition-colors line-clamp-1 block mb-1"
                >
                  #{pr.githubPrNumber}: {pr.title}
                </a>

                {pr.adminFeedback && (
                  <div className="mt-2 p-2 rounded bg-midnight-surface border border-white/5 text-[11px] text-ash italic">
                    &ldquo;{pr.adminFeedback}&rdquo;
                  </div>
                )}

                {currentUser?.role === 'admin' && pr.reviewStatus === 'PENDING_REVIEW' && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => onSelectPrForReview(pr)}
                      className="text-[11px] text-lavender-accent hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Grade this PR
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
