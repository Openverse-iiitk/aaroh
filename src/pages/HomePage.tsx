import React, { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { LeaderboardItem, PullRequest, Sprint, User } from '../types';
import { Link, useNavigate } from '@tanstack/react-router';
import { Trophy, GitPullRequest, ArrowRight, ShieldCheck, CheckCircle2, Clock, Users } from 'lucide-react';

interface HomePageProps {
  sprint: Sprint;
  leaderboard?: LeaderboardItem[];
  pullRequests?: PullRequest[];
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  sprint,
  leaderboard = [],
  pullRequests = [],
  currentUser,
  onOpenAuth,
}) => {
  const navigate = useNavigate();

  // If already authenticated, redirect immediately:
  // Admins -> /admin
  // Contributors -> /leaderboard
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/leaderboard' });
      }
    }
  }, [currentUser, navigate]);

  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];
  const topThree = safeLeaderboard.slice(0, 3);

  return (
    <div className="w-full pb-16">
      {/* Minimal Hero */}
      <Hero
        sprint={sprint}
        onOpenAuth={onOpenAuth}
        isAuthenticated={!!currentUser}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Minimal Event Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-[#121215] border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">
              Event Status
            </span>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  sprint.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
              <span className="text-base font-semibold text-white">
                {sprint.status === 'ACTIVE'
                  ? `Day ${sprint.currentDay} Active`
                  : sprint.isFinalized
                  ? 'Concluded'
                  : 'Pending'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Daily calculation at {sprint.dailyUpdateTime || '00:00'} UTC
            </span>
          </div>

          <div className="p-4 rounded bg-[#121215] border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">
              Registered Contributors
            </span>
            <span className="text-2xl font-semibold text-white">
              {safeLeaderboard.length}
            </span>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Active open source participants
            </span>
          </div>

          <div className="p-4 rounded bg-[#121215] border border-white/10 text-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">
              Tracked Pull Requests
            </span>
            <span className="text-2xl font-semibold text-white">
              {safePrs.length}
            </span>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Ingested across repositories
            </span>
          </div>
        </div>
      </div>

      {/* How it Works - Minimal 3-Step Section */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <div className="border-t border-white/10 pt-10">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            How The PR Sprint Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded bg-[#121215] border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded bg-zinc-800 border border-white/10 text-xs font-semibold text-white flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">
                Sign in with GitHub
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your GitHub account to register for the tracking sprint.
                No manual registration form required.
              </p>
            </div>

            <div className="p-5 rounded bg-[#121215] border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded bg-zinc-800 border border-white/10 text-xs font-semibold text-white flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-semibold text-white">
                Submit &amp; Track PRs
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Work on issues and open pull requests. Ingestion queries GitHub
                to discover your contributions automatically.
              </p>
            </div>

            <div className="p-5 rounded bg-[#121215] border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded bg-zinc-800 border border-white/10 text-xs font-semibold text-white flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-white">
                Daily Evaluation &amp; Points
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Admin reviewers grade pull requests based on quality, complexity,
                and impact to calculate the daily leaderboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Snapshot */}
      {topThree.length > 0 && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-t border-white/10 pt-8 flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Current Top Contributors
            </h2>
            <Link
              to="/leaderboard"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <span>View Full Leaderboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/10 rounded bg-[#121215] border border-white/10 overflow-hidden">
            {topThree.map((item, idx) => (
              <div
                key={item.user.id}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-zinc-500 font-medium">
                    #{idx + 1}
                  </span>
                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-white font-medium block">
                      {item.user.name}
                    </span>
                    <span className="text-zinc-500">@{item.user.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-zinc-500 block text-[11px]">Pull Requests</span>
                    <span className="text-white font-medium">{item.totalPrs}</span>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-zinc-500 block text-[11px]">Score</span>
                    <span className="text-white font-semibold">{item.totalCredits} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
