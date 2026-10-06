import React, { useState, useMemo } from 'react';
import { PullRequest, Sprint, User } from '../types';
import {
  GitPullRequest,
  GitMerge,
  ExternalLink,
  ShieldCheck,
  GitCommit,
  Search,
  Globe,
  UserCheck,
  Star,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Github
} from 'lucide-react';

interface PullRequestsPageProps {
  pullRequests: PullRequest[];
  sprint: Sprint;
  currentUser: User | null;
  onSelectPrForReview: (pr: PullRequest) => void;
  onOpenAuth?: () => void;
}

export const PullRequestsPage: React.FC<PullRequestsPageProps> = ({
  pullRequests = [],
  sprint,
  currentUser,
  onSelectPrForReview,
  onOpenAuth
}) => {
  // Check URL query parameters if view=mine is specified
  const initialMode = typeof window !== 'undefined' && window.location.search.includes('view=mine')
    ? 'MINE'
    : 'ALL';

  const [viewMode, setViewMode] = useState<'ALL' | 'MINE'>(initialMode);
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedRepo, setSelectedRepo] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];

  // Extract distinct repositories across all tracked PRs
  const allDistinctRepos = useMemo(() => {
    return Array.from(new Set(safePrs.map((pr) => pr.repo))).filter(Boolean);
  }, [safePrs]);

  // Personal user PR calculations
  const myPrs = useMemo(() => {
    if (!currentUser) return [];
    return safePrs.filter(
      (pr) => pr.author.toLowerCase() === currentUser.username.toLowerCase()
    );
  }, [safePrs, currentUser]);

  const myStats = useMemo(() => {
    const reviewed = myPrs.filter((pr) => pr.reviewStatus === 'REVIEWED');
    const pending = myPrs.filter((pr) => pr.reviewStatus === 'PENDING_REVIEW');
    const totalCredits = reviewed.reduce((sum, pr) => sum + (Number(pr.creditScore) || 0), 0);
    const repos = Array.from(new Set(myPrs.map((pr) => pr.repo))).filter(Boolean);

    return {
      totalPrs: myPrs.length,
      reviewedPrs: reviewed.length,
      pendingPrs: pending.length,
      totalCredits,
      avgScore: reviewed.length > 0 ? Math.round(totalCredits / reviewed.length) : 0,
      distinctRepos: repos
    };
  }, [myPrs]);

  // Base list depending on view mode
  const basePrs = viewMode === 'MINE' ? myPrs : safePrs;

  const filteredPrs = basePrs.filter((pr) => {
    if (selectedDay !== 'ALL' && pr.dayOfSprint !== selectedDay) return false;
    if (selectedRepo !== 'ALL' && pr.repo !== selectedRepo) return false;
    if (selectedStatus !== 'ALL' && pr.reviewStatus !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.author.toLowerCase().includes(q) ||
        pr.repo.toLowerCase().includes(q) ||
        pr.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const availableDays = Array.from(
    { length: Math.max(1, sprint.currentDay || 1) },
    (_, i) => i + 1
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Submitted Pull Requests
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            All pull requests authored by registered participants across repositories.
            Daily evaluation calculated at <span className="text-white font-medium">{sprint.dailyUpdateTime || '00:00'} UTC</span>.
          </p>
        </div>

        {/* Repositories Counter */}
        <div className="text-xs text-zinc-400 px-3 py-1.5 rounded bg-[#18181b] border border-white/10 flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{allDistinctRepos.length} Repositories Tracked</span>
        </div>
      </div>

      {/* Primary View Switcher: All PRs vs My PR Reviews */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1 rounded bg-[#18181b] border border-white/10">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121215] rounded">
          <button
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-zinc-400" />
            <span>All Pull Requests</span>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-zinc-400">
              {safePrs.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('MINE')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'MINE'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>My PRs</span>
            {currentUser && (
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-zinc-300 font-semibold">
                {myPrs.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick summary text */}
        <div className="text-xs text-zinc-400 px-3 py-1 flex items-center justify-between sm:justify-end gap-2">
          <span>Viewing:</span>
          <span className="text-white font-medium">
            {viewMode === 'MINE'
              ? currentUser
                ? `@${currentUser.username}'s PRs`
                : 'Personal PRs (Sign-in Required)'
              : 'All Participants'}
          </span>
        </div>
      </div>

      {/* Personal Dashboard Card when "My PR Reviews Only" is selected */}
      {viewMode === 'MINE' && currentUser && (
        <div className="p-4 rounded bg-[#121215] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Contributor Summary
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-white/10">
                    @{currentUser.username}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tracked pull requests and review scores.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Total Points:</span>
              <span className="text-lg font-semibold text-white">
                +{myStats.totalCredits} pts
              </span>
            </div>
          </div>

          {/* 4 Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-btn bg-midnight-surface/80 border border-white/5">
              <span className="text-fog block text-[11px]">Tracked PRs</span>
              <span className="text-lg font-semibold text-lilac-white block mt-0.5">
                {myStats.totalPrs} PRs
              </span>
              <span className="text-[10px] text-steel">Across all repositories</span>
            </div>

            <div className="p-3 rounded-btn bg-midnight-surface/80 border border-white/5">
              <span className="text-fog block text-[11px]">Scored by Admin</span>
              <span className="text-lg font-semibold text-emerald-400 block mt-0.5">
                {myStats.reviewedPrs} Reviewed
              </span>
              <span className="text-[10px] text-steel">Avg {myStats.avgScore} pts / review</span>
            </div>

            <div className="p-3 rounded-btn bg-midnight-surface/80 border border-white/5">
              <span className="text-fog block text-[11px]">Pending Admin Grading</span>
              <span className="text-lg font-semibold text-amber-300 block mt-0.5">
                {myStats.pendingPrs} in Queue
              </span>
              <span className="text-[10px] text-steel">Daily sprint evaluation</span>
            </div>

            <div className="p-3 rounded-btn bg-midnight-surface/80 border border-white/5">
              <span className="text-fog block text-[11px]">Active Repositories</span>
              <span className="text-lg font-semibold text-lavender-accent block mt-0.5">
                {myStats.distinctRepos.length} Repos
              </span>
              <span className="text-[10px] text-steel truncate block">
                {myStats.distinctRepos.slice(0, 2).join(', ') || 'None yet'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Guest Notice if "My PR Reviews" chosen while not authenticated */}
      {viewMode === 'MINE' && !currentUser && (
        <div className="panel-glass p-8 text-center space-y-4 border border-lavender-accent/30 animate-fade-in">
          <div className="w-12 h-12 rounded bg-[#18181b] border border-white/10 flex items-center justify-center mx-auto text-zinc-300">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-lilac-white">
              Connect GitHub to View Only Your PR Reviews
            </h3>
            <p className="text-xs text-ash max-w-md mx-auto mt-1 leading-relaxed">
              When connected, your pull requests across any GitHub repository are tracked automatically.
              You can view admin feedback, rubric evaluations, and personal credit totals here.
            </p>
          </div>
          {onOpenAuth && (
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="btn-primary !px-5 !py-2.5 mx-auto"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="panel-glass p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
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
            All Days
          </button>
          {availableDays.map((day) => (
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

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Repository Dropdown */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-2.5 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
          >
            <option value="ALL">All Repositories ({allDistinctRepos.length})</option>
            {allDistinctRepos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="REVIEWED">Scored by Admin</option>
            <option value="PENDING_REVIEW">Needs Admin Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-fog absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, repo, tags..."
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
          filteredPrs.map((pr) => {
            const isMyPr = currentUser && pr.author.toLowerCase() === currentUser.username.toLowerCase();

            return (
              <div
                key={pr.id}
                className={`panel-glass p-5 hover:border-lavender-accent/30 transition-all ${
                  isMyPr ? 'border-lavender-accent/20 bg-deep-indigo/10' : ''
                }`}
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
                      {isMyPr && (
                        <span className="px-1.5 py-0.2 rounded-full bg-iris/30 text-lavender-accent text-[10px] font-semibold border border-iris/40">
                          You
                        </span>
                      )}
                      <span className="text-steel">•</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-lilac-white font-mono text-[11px]">
                        {pr.repo}
                      </span>
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

                    {/* Detailed Admin Review Card */}
                    {pr.reviewStatus === 'REVIEWED' && (
                      <div className="mt-3 p-3.5 rounded-btn bg-midnight-surface border border-white/5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-fog font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Admin Review by @{pr.reviewedBy || 'admin-starlit'}:
                          </span>
                          {pr.reviewedAt && (
                            <span className="text-steel text-[10px]">
                              {new Date(pr.reviewedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>

                        {pr.adminFeedback ? (
                          <div className="text-xs text-lilac-white italic pl-2 border-l-2 border-lavender-accent/40">
                            &ldquo;{pr.adminFeedback}&rdquo;
                          </div>
                        ) : (
                          <div className="text-xs text-steel italic">
                            No written notes provided by reviewer.
                          </div>
                        )}

                        {/* 4 Rubric Criteria Breakdown */}
                        {pr.adminCriteria && (
                          <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-1.5 rounded bg-void-canvas/70 border border-white/5">
                              <span className="text-steel block text-[10px]">Quality</span>
                              <span className="text-lilac-white font-mono font-medium">
                                {pr.adminCriteria.quality || 20}/25
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-void-canvas/70 border border-white/5">
                              <span className="text-steel block text-[10px]">Complexity</span>
                              <span className="text-lilac-white font-mono font-medium">
                                {pr.adminCriteria.complexity || 20}/25
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-void-canvas/70 border border-white/5">
                              <span className="text-steel block text-[10px]">Impact</span>
                              <span className="text-lilac-white font-mono font-medium">
                                {pr.adminCriteria.impact || 20}/25
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-void-canvas/70 border border-white/5">
                              <span className="text-steel block text-[10px]">Test Coverage</span>
                              <span className="text-lilac-white font-mono font-medium">
                                {pr.adminCriteria.testCoverage || 15}/25
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {pr.reviewStatus === 'PENDING_REVIEW' && (
                      <div className="mt-2 p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/80 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>Awaiting admin review &amp; manual credit scoring.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Score Column & Admin Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="text-fog block text-[10px] uppercase tracking-wider">
                        Credit Score
                      </span>
                      {pr.reviewStatus === 'REVIEWED' ? (
                        <span className="text-base font-semibold text-white block">
                          +{pr.creditScore} pts
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-white/10 text-[11px] font-medium inline-block mt-0.5">
                          Needs Review
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => onSelectPrForReview(pr)}
                        className="btn-secondary !text-xs !py-1 !px-2.5 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>{pr.reviewStatus === 'REVIEWED' ? 'Adjust Score' : 'Grade PR'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="panel-glass p-12 text-center text-fog text-xs space-y-2">
            <p>
              {viewMode === 'MINE'
                ? "You don't have any pull requests matching this filter."
                : 'No pull requests match the selected filters.'}
            </p>
            {viewMode === 'MINE' && (
              <button
                onClick={() => {
                  setSelectedDay('ALL');
                  setSelectedRepo('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="btn-ghost !text-xs !py-1 !px-3 text-lavender-accent hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
