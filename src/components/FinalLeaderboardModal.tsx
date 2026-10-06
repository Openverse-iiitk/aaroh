import React from 'react';
import { LeaderboardItem, Sprint } from '../types';
import { Trophy, Award, X, Sparkles, Star, GitPullRequest, ShieldCheck, Check } from 'lucide-react';

interface FinalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint;
  leaderboard: LeaderboardItem[];
}

export const FinalLeaderboardModal: React.FC<FinalLeaderboardModalProps> = ({
  isOpen,
  onClose,
  sprint,
  leaderboard
}) => {
  if (!isOpen) return null;

  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];
  const topThree = safeLeaderboard.slice(0, 3);
  const totalPrsAwarded = safeLeaderboard.reduce((acc, curr) => acc + (curr.totalPrs || 0), 0);
  const totalCreditsAwarded = safeLeaderboard.reduce((acc, curr) => acc + (curr.totalCredits || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="panel-glass-elevated w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative border border-lavender-accent/40 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-fog hover:text-lilac-white p-1 rounded-btn hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-white/10 rounded">
            <span>Sprint Concluded</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Final Event Leaderboard
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-2">
            Weekly pull request tracking is complete. Standings are frozen and validated by sprint administrators.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6 p-3 rounded bg-[#18181b] border border-white/10 text-center text-xs">
            <div>
              <span className="text-zinc-500 block text-[11px]">Total PRs Tracked</span>
              <span className="text-base font-semibold text-white">{totalPrsAwarded}</span>
            </div>
            <div className="border-x border-white/10">
              <span className="text-zinc-500 block text-[11px]">Credits Distributed</span>
              <span className="text-base font-semibold text-white">{totalCreditsAwarded} pts</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Ranked Contributors</span>
              <span className="text-base font-semibold text-white">{leaderboard.length}</span>
            </div>
          </div>
        </div>

        {/* Top 3 Champions Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-fog mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Sprint Champions Podium</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThree.map((item, idx) => (
              <div
                key={item.user.id}
                className={`p-4 rounded-card border flex flex-col items-center text-center relative ${
                  idx === 0
                    ? 'bg-midnight-surface border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30'
                    : 'bg-midnight-surface/80 border-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mb-2.5 ${
                    idx === 0
                      ? 'bg-amber-400 text-black'
                      : idx === 1
                      ? 'bg-slate-300 text-black'
                      : 'bg-amber-700 text-white'
                  }`}
                >
                  #{idx + 1}
                </div>

                <img
                  src={item.user.avatarUrl}
                  alt={item.user.username}
                  className="w-14 h-14 rounded-full object-cover mb-2 border border-white/20"
                />

                <span className="text-sm font-medium text-lilac-white">
                  {item.user.name}
                </span>
                <span className="text-xs text-fog mb-3">@{item.user.username}</span>

                <div className="w-full pt-2 border-t border-white/5 flex justify-between text-xs">
                  <span className="text-fog">Score:</span>
                  <span className="font-semibold text-white">{item.totalCredits} pts</span>
                </div>
                <div className="w-full flex justify-between text-xs mt-1">
                  <span className="text-fog">PRs:</span>
                  <span className="font-medium text-ash">{item.totalPrs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Final Standings List */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-fog mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lavender-accent" />
            <span>All Final Standings</span>
          </h3>

          <div className="divide-y divide-white/5 rounded-card bg-midnight-surface border border-white/5 overflow-hidden">
            {safeLeaderboard.map((item) => (
              <div
                key={item.user.id}
                className="p-3.5 flex items-center justify-between text-sm hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-semibold text-xs text-fog">
                    #{item.rank}
                  </span>
                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <span className="font-medium text-lilac-white block">
                      {item.user.name}
                    </span>
                    <span className="text-xs text-fog">@{item.user.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <span className="text-fog block text-[10px]">Merged / PRs</span>
                    <span className="text-ash font-medium">
                      {item.mergedPrs} / {item.totalPrs}
                    </span>
                  </div>
                  <div>
                    <span className="text-fog block text-[10px]">Final Credits</span>
                    <span className="text-sm font-semibold text-white">
                      {item.totalCredits} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="btn-primary !px-5 !py-2">
            <Check className="w-4 h-4" />
            <span>Close Final Standings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
