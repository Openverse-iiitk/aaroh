import React, { useState, useMemo } from 'react';
import { PullRequest, Sprint, User } from '../types';
import {
  GitPullRequest,
  GitMerge,
  ExternalLink,
  ShieldCheck,
  GitCommit,
  Search,
  CheckCircle2,
  Clock,
  Github,
  Award,
  Sparkles,
  UserCheck,
  Filter,
  Layers,
  ChevronDown,
  X,
  Plus,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { formatGithubPrUrl } from '../utils/github';

interface PullRequestsPageProps {
  pullRequests: PullRequest[];
  sprint: Sprint;
  currentUser: User | null;
  onSelectPrForReview: (pr: PullRequest) => void;
  onOpenAuth?: () => void;
  onOpenSubmitPr?: () => void;
  onSyncGitHub?: () => Promise<any> | void;
  isSyncingGitHub?: boolean;
}

export const PullRequestsPage: React.FC<PullRequestsPageProps> = ({
  pullRequests = [],
  sprint,
  currentUser,
  onSelectPrForReview,
  onOpenAuth,
  onOpenSubmitPr,
  onSyncGitHub,
  isSyncingGitHub
}) => {
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

  // Extract distinct repositories
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

  // Base list
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

  const resetFilters = () => {
    setSelectedDay('ALL');
    setSelectedRepo('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedDay !== 'ALL' ||
    selectedRepo !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Live PR Tracking
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Submitted Pull Requests
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            All pull requests authored across monitored open-source repositories.
            Evaluations run nightly with scores locked at{' '}
            <span className="text-white font-medium">{sprint.dailyUpdateTime || '00:00'} UTC</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs text-zinc-300 px-3 py-1.5 rounded-lg bg-[#120f24] border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span><strong>{allDistinctRepos.length}</strong> Repos Tracked</span>
          </div>
          <div className="text-xs text-zinc-300 px-3 py-1.5 rounded-lg bg-[#120f24] border border-white/10 flex items-center gap-2">
            <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong>{safePrs.length}</strong> Total PRs</span>
          </div>
          {currentUser && onSyncGitHub && (
            <button
              onClick={() => onSyncGitHub()}
              disabled={isSyncingGitHub}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#15112f] hover:bg-[#1e1942] text-zinc-200 border border-indigo-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-1"
              title="Automatically sync your pull requests from any public repository on GitHub"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
              <span>{isSyncingGitHub ? 'Syncing...' : 'Sync from GitHub'}</span>
            </button>
          )}
          {onOpenSubmitPr && (
            <button
              onClick={currentUser ? onOpenSubmitPr : (onOpenAuth || onOpenSubmitPr)}
              className="btn-primary !text-xs !py-1.5 !px-3.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-transform ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit PR</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary View Switcher: All PRs vs My PRs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-xl bg-[#0e0a22] border border-white/10">
        <div className="inline-flex rounded-lg p-1 bg-[#080517]">
          <button
            onClick={() => setViewMode('ALL')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>All Pull Requests</span>
            <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] font-mono">
              {safePrs.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('MINE')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'MINE'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>My PRs</span>
            {currentUser && (
              <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] font-mono">
                {myPrs.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-zinc-400 px-2 flex items-center gap-1.5">
          <span>Active View:</span>
          <span className="text-white font-medium">
            {viewMode === 'MINE'
              ? currentUser
                ? currentUser.role === 'admin'
                  ? 'HackAaroh Admin PRs'
                  : `@${currentUser.username}'s PRs`
                : 'Personal Contributions (Sign in)'
              : 'Ecosystem Submissions'}
          </span>
        </div>
      </div>

      {/* Personal Dashboard Summary Card (when viewing My PRs) */}
      {viewMode === 'MINE' && currentUser && (
        <div className="p-5 rounded-2xl bg-[#0e0a22]/90 border border-indigo-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.role === 'admin' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' : currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {currentUser.role === 'admin' ? 'HackAaroh Admin' : currentUser.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-mono border border-indigo-500/30">
                    {currentUser.role === 'admin' ? '@hackaaroh' : `@${currentUser.username}`}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your tracked open-source pull requests and nightly evaluation scores.
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-right">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Credits Earned</span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                +{myStats.totalCredits} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#140f2e] border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Tracked PRs</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {myStats.totalPrs}
              </span>
              <span className="text-[10px] text-zinc-500">Across ecosystem</span>
            </div>

            <div className="p-3 rounded-xl bg-[#140f2e] border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Scored by Reviewers</span>
              <span className="text-lg font-bold text-emerald-400 block mt-0.5">
                {myStats.reviewedPrs}
              </span>
              <span className="text-[10px] text-zinc-500">Avg {myStats.avgScore} pts / PR</span>
            </div>

            <div className="p-3 rounded-xl bg-[#140f2e] border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Awaiting Scoring</span>
              <span className="text-lg font-bold text-amber-300 block mt-0.5">
                {myStats.pendingPrs}
              </span>
              <span className="text-[10px] text-zinc-500">Nightly evaluation</span>
            </div>

            <div className="p-3 rounded-xl bg-[#140f2e] border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Repositories</span>
              <span className="text-lg font-bold text-purple-300 block mt-0.5">
                {myStats.distinctRepos.length}
              </span>
              <span className="text-[10px] text-zinc-500 truncate block">
                {myStats.distinctRepos.slice(0, 2).join(', ') || 'None yet'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Guest Notice if "My PRs" selected while logged out */}
      {viewMode === 'MINE' && !currentUser && (
        <div className="p-8 rounded-2xl bg-[#0e0a22]/90 border border-indigo-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Connect Your GitHub Account
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              Sign in with your GitHub profile to view your personal pull request submissions, official rubric evaluations, and earned points.
            </p>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="btn-primary !px-5 !py-2.5 mx-auto"
            >
              <Github className="w-4 h-4" />
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#090520]/80 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Sprint Day selector pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-400 mr-1 font-medium">Sprint Day:</span>
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedDay === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-[#151226] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            All Days
          </button>
          {availableDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-[#151226] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>

        {/* Search & dropdown filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Repo Filter */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#140f2b] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Repositories ({allDistinctRepos.length})</option>
            {allDistinctRepos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#140f2b] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEWED">Scored PRs</option>
            <option value="PENDING_REVIEW">Awaiting Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Search box */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, repo, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-7 py-1.5 rounded-lg bg-[#140f2b] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 underline font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* PR Cards List */}
      <div className="space-y-3.5">
        {filteredPrs.length > 0 ? (
          filteredPrs.map((pr) => {
            const isMyPr = currentUser && pr.author.toLowerCase() === currentUser.username.toLowerCase();

            return (
              <div
                key={pr.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isMyPr
                    ? 'bg-[#0f0b29] border-indigo-500/40 shadow-[0_4px_24px_rgba(99,102,241,0.12)]'
                    : 'bg-[#090520]/80 border-white/10 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Top Row: Author, Repo, Sprint Day, State Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={pr.authorAvatar}
                          alt={pr.author}
                          className="w-5 h-5 rounded-full object-cover border border-white/15"
                        />
                        <span className="font-semibold text-white">@{pr.author}</span>
                        {isMyPr && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                            You
                          </span>
                        )}
                      </div>

                      <span className="text-zinc-600">•</span>

                      {/* Repo Badge with link */}
                      <a
                        href={formatGithubPrUrl(undefined, pr.repo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-[11px] border border-white/5 transition-colors flex items-center gap-1"
                      >
                        <Github className="w-3 h-3 text-zinc-400" />
                        <span>{pr.repo}</span>
                      </a>

                      <span className="text-zinc-600">•</span>

                      {/* Sprint Day */}
                      <span className="px-2 py-0.5 rounded-full bg-[#181432] text-indigo-300 text-[11px] font-medium border border-indigo-500/20">
                        Day {pr.dayOfSprint}
                      </span>

                      {/* Merge / Open / Repo State */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 border ${
                          pr.isRepoOnly || !pr.githubPrNumber
                            ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                            : pr.state === 'merged'
                            ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                            : pr.state === 'closed'
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {pr.isRepoOnly || !pr.githubPrNumber ? (
                          <>
                            <FolderGit2 className="w-3 h-3" />
                            <span>Repository</span>
                          </>
                        ) : (
                          <>
                            <GitMerge className="w-3 h-3" />
                            <span className="capitalize">{pr.state}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* PR Title & Link */}
                    <div>
                      <h3 className="text-base font-semibold text-white hover:text-indigo-300 transition-colors leading-snug">
                        <a
                          href={formatGithubPrUrl(pr.url, pr.repo, pr.githubPrNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 group cursor-pointer"
                        >
                          {pr.isRepoOnly || !pr.githubPrNumber ? (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                              REPO PROJECT
                            </span>
                          ) : (
                            <span className="font-mono text-indigo-400 font-bold">#{pr.githubPrNumber}</span>
                          )}
                          <span>{pr.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-300 transition-colors flex-shrink-0" />
                        </a>
                      </h3>

                      {pr.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {pr.description}
                        </p>
                      )}
                    </div>

                    {/* Diff stats, commits & tags */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 pt-0.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-medium">
                        +{pr.additions}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-400 border border-rose-500/20 font-mono text-[11px] font-medium">
                        -{pr.deletions}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <GitCommit className="w-3 h-3 text-indigo-400" />
                        <span>{pr.commitsCount} commits</span>
                      </span>

                      {pr.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.2 rounded bg-white/5 text-zinc-400 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Rubric Evaluation Breakdown (when reviewed) */}
                    {pr.reviewStatus === 'REVIEWED' && (
                      <div className="mt-3 p-3.5 rounded-xl bg-[#120d2c] border border-indigo-500/20 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Official HackAaroh Rubric Evaluation
                          </span>
                          {pr.reviewedAt && (
                            <span className="text-zinc-500 text-[10px]">
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
                          <p className="text-xs text-zinc-200 italic pl-2.5 border-l-2 border-indigo-500/50 leading-relaxed">
                            &ldquo;{pr.adminFeedback}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">
                            Evaluated without specific reviewer notes.
                          </p>
                        )}

                        {pr.adminCriteria && (
                          <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-[#0a071c] border border-white/5 flex items-center justify-between">
                              <span className="text-zinc-400 text-[10px]">Quality</span>
                              <span className="text-white font-mono font-semibold">
                                {pr.adminCriteria.quality || 20}/25
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-[#0a071c] border border-white/5 flex items-center justify-between">
                              <span className="text-zinc-400 text-[10px]">Complexity</span>
                              <span className="text-white font-mono font-semibold">
                                {pr.adminCriteria.complexity || 20}/25
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-[#0a071c] border border-white/5 flex items-center justify-between">
                              <span className="text-zinc-400 text-[10px]">Impact</span>
                              <span className="text-white font-mono font-semibold">
                                {pr.adminCriteria.impact || 20}/25
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-[#0a071c] border border-white/5 flex items-center justify-between">
                              <span className="text-zinc-400 text-[10px]">Tests</span>
                              <span className="text-white font-mono font-semibold">
                                {pr.adminCriteria.testCoverage || 15}/25
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {pr.reviewStatus === 'PENDING_REVIEW' && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300/80 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>Queued for daily 00:00 UTC rubric evaluation.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Score Badge & Admin Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                        Credit Score
                      </span>
                      {pr.reviewStatus === 'REVIEWED' ? (
                        <div className="mt-0.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-white font-bold text-sm font-mono shadow-sm">
                          +{pr.creditScore} pts
                        </div>
                      ) : (
                        <span className="mt-0.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-white/10 text-[11px] font-medium inline-block">
                          Awaiting Grade
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => onSelectPrForReview(pr)}
                        className="btn-secondary !text-xs !py-1 !px-2.5 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{pr.reviewStatus === 'REVIEWED' ? 'Adjust Score' : 'Grade PR'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 rounded-2xl bg-[#090520]/80 border border-white/10 text-center space-y-3">
            <GitPullRequest className="w-8 h-8 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No pull requests match this filter</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {viewMode === 'MINE'
                ? "You haven't authored any pull requests matching the current filters."
                : 'Try adjusting the sprint day, repository, or review status filters.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="btn-secondary !text-xs !py-1 !px-3"
              >
                Clear Active Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
