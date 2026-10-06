import React from 'react';
import { LeaderboardItem } from '../types';
import { Trophy, Award, GitPullRequest, Star } from 'lucide-react';

interface PodiumProps {
  topThree: LeaderboardItem[];
  isFinalized: boolean;
}

export const Podium: React.FC<PodiumProps> = ({ topThree, isFinalized }) => {
  if (!topThree || topThree.length === 0) return null;

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-white">
          {isFinalized ? 'Top Event Contributors' : 'Current Leaders'}
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Scored by administrators based on pull request complexity, code quality, and impact.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-6">
        {/* 2nd Place */}
        {second && (
          <div className="order-2 md:order-1 p-5 rounded bg-[#121215] flex flex-col items-center text-center relative border border-white/10">
            <div className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center mb-3 border border-white/10">
              #2
            </div>
            <div className="relative mb-3">
              <img
                src={second.user.avatarUrl}
                alt={second.user.username}
                className="w-16 h-16 rounded-full border border-white/20 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded bg-[#18181b] flex items-center justify-center border border-white/10 text-zinc-400">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-white">
              {second.user.name}
            </h4>
            <span className="text-xs text-zinc-500">@{second.user.username}</span>

            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Score</span>
                <span className="text-sm font-semibold text-white">
                  {second.totalCredits} pts
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-zinc-500 block text-[11px]">PRs</span>
                <span className="text-sm font-medium text-zinc-300 flex items-center justify-center gap-1">
                  <GitPullRequest className="w-3 h-3 text-zinc-400" />
                  {second.totalPrs}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Center, Elevated) */}
        {first && (
          <div className="order-1 md:order-2 p-6 rounded bg-[#18181b] flex flex-col items-center text-center relative border border-white/20">
            <div className="w-7 h-7 rounded bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center justify-center mb-3 border border-amber-400/30">
              #1
            </div>
            <div className="relative mb-3">
              <img
                src={first.user.avatarUrl}
                alt={first.user.username}
                className="w-20 h-20 rounded-full border-2 border-white/30 object-cover"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded bg-[#121215] flex items-center justify-center border border-white/20 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-base font-semibold text-white">
              {first.user.name}
            </h4>
            <span className="text-xs text-zinc-400">@{first.user.username}</span>

            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Total Score</span>
                <span className="text-lg font-semibold text-white">
                  {first.totalCredits} pts
                </span>
              </div>
              <div className="w-px h-8 bg-lavender-accent/20" />
              <div>
                <span className="text-ash block text-[11px]">Pull Requests</span>
                <span className="text-base font-medium text-lilac-white flex items-center justify-center gap-1">
                  <GitPullRequest className="w-3.5 h-3.5 text-lavender-accent" />
                  {first.totalPrs}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="order-3 panel-glass p-5 flex flex-col items-center text-center relative border border-white/5 hover:border-lavender-accent/30 transition-all">
            <div className="w-6 h-6 rounded-full bg-amber-800/30 text-amber-500 text-xs font-semibold flex items-center justify-center mb-3 border border-white/10">
              #3
            </div>
            <div className="relative mb-3">
              <img
                src={third.user.avatarUrl}
                alt={third.user.username}
                className="w-16 h-16 rounded-full border-2 border-amber-700/40 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-midnight-surface flex items-center justify-center border border-white/10 text-amber-500">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base font-medium text-lilac-white">
              {third.user.name}
            </h4>
            <span className="text-xs text-fog">@{third.user.username}</span>

            <div className="mt-4 pt-3 border-t border-white/5 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-fog block text-[11px]">Credits</span>
                <span className="text-sm font-semibold text-lilac-white">
                  {third.totalCredits}
                </span>
              </div>
              <div className="w-px h-6 bg-white/5" />
              <div>
                <span className="text-fog block text-[11px]">PRs</span>
                <span className="text-sm font-medium text-ash flex items-center justify-center gap-1">
                  <GitPullRequest className="w-3 h-3 text-lavender-accent" />
                  {third.totalPrs}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
