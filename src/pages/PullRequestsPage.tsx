import React, { useState } from 'react';
import { PullRequest, Sprint, User } from '../types';
import { GitPullRequest, GitMerge, ExternalLink, ShieldCheck, Plus, Minus, GitCommit, Filter, Search } from 'lucide-react';

interface PullRequestsPageProps {
  pullRequests: PullRequest[];
  sprint: Sprint;
  currentUser: User | null;
  onSelectPrForReview: (pr: PullRequest) => void;
  onOpenSubmitPr: () => void;
}

export const PullRequestsPage: React.FC<PullRequestsPageProps> = ({
  pullRequests = [],
  sprint,
  currentUser,
  onSelectPrForReview,
  onOpenSubmitPr
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];

  const filteredPrs = safePrs.filter((pr) => {
    if (selectedDay !== 'ALL' && pr.dayOfSprint !== selectedDay) return false;
    if (selectedStatus !== 'ALL' && pr.reviewStatus !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.author.toLowerCase().includes(q) ||
        pr.repo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="badge-pill inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-medium text-lilac-white">
            <GitPullRequest className="w-3.5 h-3.5 text-lavender-accent" />
            <span>Weekly Contribution Log</span>
          </div>
          <h2 className="text-3xl font-medium text-lilac-white">
            Sprint Pull Requests
          </h2>
          <p className="text-sm text-ash mt-1">
            Browse all GitHub pull requests submitted across the 7-day sprint window.
          </p>
        </div>

        <button
          onClick={onOpenSubmitPr}
          disabled={sprint.isFinalized}
          className="btn-primary !text-xs !py-2 !px-4 self-start sm:self-auto disabled:opacity-40"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Submit Pull Request</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="panel-glass p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Day Pills filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-fog mr-1 font-medium">Sprint Day:</span>
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-2.5 py-1 rounded-btn transition-colors ${
              selectedDay === 'ALL'
                ? 'bg-deep-indigo text-lilac-white border border-lavender-accent/40 font-medium'
                : 'bg-midnight-surface text-fog hover:text-lilac-white border border-white/5'
            }`}
          >
            All 7 Days
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 rounded-btn transition-colors ${
                selectedDay === day
                  ? 'bg-deep-indigo text-lilac-white border border-lavender-accent/40 font-medium'
                  : 'bg-midnight-surface text-fog hover:text-lilac-white border border-white/5'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>

        {/* Review Status & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="REVIEWED">Scored by Admin</option>
            <option value="PENDING_REVIEW">Needs Admin Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-fog absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PRs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white placeholder:text-steel focus:outline-none focus:border-lavender-accent"
            />
          </div>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="space-y-4">
        {filteredPrs.length > 0 ? (
          filteredPrs.map((pr) => (
            <div
              key={pr.id}
              className="panel-glass p-5 hover:border-lavender-accent/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Top metadata row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <img
                      src={pr.authorAvatar}
                      alt={pr.author}
                      className="w-5 h-5 rounded-full object-cover border border-white/10"
                    />
                    <span className="font-medium text-lilac-white">@{pr.author}</span>
                    <span className="text-steel">•</span>
                    <span className="text-ash">{pr.repo}</span>
                    <span className="text-steel">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-deep-indigo text-lavender-accent text-[11px] font-medium">
                      Day {pr.dayOfSprint}
                    </span>
                    <span className="text-steel">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                        pr.state === 'merged'
                          ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <GitMerge className="w-3 h-3" />
                      {pr.state}
                    </span>
                  </div>

                  {/* PR Title & link */}
                  <h3 className="text-base font-medium text-lilac-white hover:text-lavender-accent transition-colors">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5"
                    >
                      <span>#{pr.githubPrNumber}: {pr.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-fog flex-shrink-0" />
                    </a>
                  </h3>

                  {/* PR Description */}
                  {pr.description && (
                    <p className="text-xs text-ash leading-relaxed">
                      {pr.description}
                    </p>
                  )}

                  {/* Code Stats & Tags */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-fog">
                    <span className="text-emerald-400 font-medium">
                      +{pr.additions} lines
                    </span>
                    <span className="text-rose-400 font-medium">
                      -{pr.deletions} lines
                    </span>
                    <span className="flex items-center gap-1">
                      <GitCommit className="w-3 h-3 text-lavender-accent" />
                      {pr.commitsCount} commits
                    </span>

                    {pr.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.2 rounded-btn bg-white/5 text-fog text-[10px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Admin feedback quote if reviewed */}
                  {pr.adminFeedback && (
                    <div className="mt-3 p-3 rounded-btn bg-midnight-surface/80 border border-white/5 text-xs text-ash">
                      <span className="text-fog font-medium block text-[11px] mb-0.5">
                        Admin Review by @{pr.reviewedBy || 'reviewer'}:
                      </span>
                      &ldquo;{pr.adminFeedback}&rdquo;
                    </div>
                  )}
                </div>

                {/* Score Column & Admin Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-right">
                    <span className="text-fog block text-[10px] uppercase tracking-wider">
                      Credit Score
                    </span>
                    {pr.reviewStatus === 'REVIEWED' ? (
                      <span className="text-lg font-semibold text-cosmic-gradient block">
                        +{pr.creditScore} pts
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[11px] font-semibold inline-block mt-0.5">
                        Needs Review
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => onSelectPrForReview(pr)}
                      className="btn-secondary !text-xs !py-1.5 !px-3 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-lavender-accent" />
                      <span>{pr.reviewStatus === 'REVIEWED' ? 'Edit Score' : 'Grade PR'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="panel-glass p-12 text-center text-fog text-xs">
            No pull requests match the selected day or filters.
          </div>
        )}
      </div>
    </div>
  );
};
