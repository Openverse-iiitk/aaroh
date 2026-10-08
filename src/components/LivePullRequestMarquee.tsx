import React from 'react';
import { PullRequest } from '../types';
import { GitPullRequest, GitMerge } from 'lucide-react';

interface LivePullRequestMarqueeProps {
  pullRequests: PullRequest[];
}

export const LivePullRequestMarquee: React.FC<LivePullRequestMarqueeProps> = ({ pullRequests }) => {
  if (!pullRequests || pullRequests.length === 0) return null;

  // Duplicate list to create a seamless infinite loop marquee
  const displayPrs = [...pullRequests, ...pullRequests, ...pullRequests];

  return (
    <div className="w-full overflow-hidden py-3 border-y border-white/5 bg-[#060317]/50 backdrop-blur-md relative group/slider">
      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030014] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030014] to-transparent z-10" />

      {/* Relaxed, slow ambient gliding stream */}
      <div className="animate-marquee flex items-center gap-4 whitespace-nowrap will-change-transform">
        {displayPrs.map((pr, index) => (
          <div
            key={`${pr.id}-${index}`}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#100a26]/70 hover:bg-[#18113c] border border-white/10 hover:border-indigo-400/40 text-xs transition-all shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            <img
              src={pr.authorAvatar}
              alt={pr.author}
              className="w-4 h-4 rounded-full object-cover border border-white/20"
            />
            <span className="font-medium text-white">@{pr.author}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-[11px] text-zinc-300">{pr.repo}</span>

            {pr.state === 'merged' ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                <GitMerge className="w-2.5 h-2.5" />
                Merged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                <GitPullRequest className="w-2.5 h-2.5" />
                {pr.isRepoOnly || !pr.githubPrNumber ? 'Repo Project' : `PR #${pr.githubPrNumber}`}
              </span>
            )}

            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-emerald-400">+{pr.additions}</span>
              <span className="text-rose-400">-{pr.deletions}</span>
            </div>

            {pr.reviewStatus === 'REVIEWED' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                +{pr.creditScore} pts
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
