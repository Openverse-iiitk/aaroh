import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from '@tanstack/react-table';
import { LeaderboardItem, Sprint, PullRequest, User } from '../types';
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';

interface LeaderboardPageProps {
  leaderboard: LeaderboardItem[];
  sprint: Sprint;
  pullRequests?: PullRequest[];
  currentUser?: User | null;
  onSelectPrForReview?: (pr: PullRequest) => void;
  isAdmin?: boolean;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  leaderboard = [],
  sprint,
  pullRequests = [],
  currentUser = null,
  onSelectPrForReview,
  isAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'PRS'>('LEADERBOARD');

  // Table state for Leaderboard
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'totalCredits', desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // PR Filters
  const [prViewFilter, setPrViewFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [prStatusFilter, setPrStatusFilter] = useState<string>('ALL');
  const [prSearchQuery, setPrSearchQuery] = useState('');

  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];

  const columns = useMemo<ColumnDef<LeaderboardItem>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            title="Toggle pull requests"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ),
      },
      {
        accessorKey: 'rank',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            <span>Rank</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => {
          const rank = row.original.rank;
          return (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold ${
                rank === 1
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : rank === 2
                  ? 'bg-zinc-700/50 text-zinc-200 border border-zinc-600'
                  : rank === 3
                  ? 'bg-amber-800/20 text-amber-500 border border-amber-700/30'
                  : 'text-zinc-400'
              }`}
            >
              #{rank}
            </span>
          );
        },
      },
      {
        id: 'contributor',
        accessorFn: (row) => `${row.user.name} ${row.user.username}`,
        header: 'Contributor',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <img
                src={item.user.avatarUrl}
                alt={item.user.username}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
              <div>
                <a
                  href={item.user.htmlUrl || `https://github.com/${item.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white hover:text-blue-400 transition-colors block text-xs"
                >
                  {item.user.name}
                </a>
                <span className="text-[11px] text-zinc-500">@{item.user.username}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalCredits',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            <span>Credit Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-white text-sm">
            {row.original.totalCredits} pts
          </span>
        ),
      },
      {
        accessorKey: 'totalPrs',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            <span>Pull Requests</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs space-y-0.5">
              <span className="font-medium text-white block">
                {item.totalPrs} PRs
              </span>
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <GitMerge className="w-3 h-3 text-emerald-400" />
                {item.mergedPrs} merged
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'avgCreditPerReviewedPr',
        header: 'Avg / PR',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-400">
            {row.original.avgCreditPerReviewedPr} pts
          </span>
        ),
      },
      {
        id: 'dailyCredits',
        header: 'Daily Activity',
        cell: ({ row }) => {
          const daily = row.original.dailyCredits;
          const max = Math.max(...daily, 1);
          return (
            <div className="flex items-end gap-1 h-6">
              {daily.map((credit, i) => {
                const heightPercent = Math.max(15, (credit / max) * 100);
                const isCurrent = i + 1 === sprint.currentDay;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center group relative"
                    title={`Day ${i + 1}: ${credit} pts`}
                  >
                    <div
                      style={{ height: `${credit > 0 ? heightPercent : 15}%` }}
                      className={`w-2 rounded-t-[1px] transition-all ${
                        credit > 0
                          ? 'bg-blue-500'
                          : 'bg-zinc-800'
                      } ${isCurrent ? 'ring-1 ring-blue-400' : ''}`}
                    />
                    <span className="text-[8px] text-zinc-500 mt-0.5">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          );
        },
      },
    ],
    [sprint.currentDay]
  );

  const table = useReactTable({
    data: leaderboard,
    columns,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  // Filtered PRs for Submitted PRs tab
  const displayedPrs = useMemo(() => {
    return safePrs.filter((pr) => {
      if (prViewFilter === 'MINE' && currentUser) {
        if (pr.author.toLowerCase() !== currentUser.username.toLowerCase()) {
          return false;
        }
      }
      if (prStatusFilter !== 'ALL' && pr.reviewStatus !== prStatusFilter) {
        return false;
      }
      if (prSearchQuery) {
        const q = prSearchQuery.toLowerCase();
        return (
          pr.title.toLowerCase().includes(q) ||
          pr.author.toLowerCase().includes(q) ||
          pr.repo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [safePrs, prViewFilter, currentUser, prStatusFilter, prSearchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Event Standings &amp; Pull Requests
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tracked event participants and pull request review results.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded bg-[#18181b] border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'LEADERBOARD'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('PRS')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'PRS'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Submitted PRs ({safePrs.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Leaderboard Table */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contributor..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded bg-[#121215] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <span className="text-xs text-zinc-500">
              {leaderboard.length} ranked contributors
            </span>
          </div>

          <div className="rounded bg-[#121215] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-white/10 bg-[#18181b]/60">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-3 text-xs text-zinc-400 font-medium">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-3 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>

                        {/* Expandable PR history */}
                        {row.getIsExpanded() && (
                          <tr className="bg-[#09090b]">
                            <td colSpan={columns.length} className="p-4 pl-10">
                              <div className="p-3 rounded bg-[#121215] border border-white/10 text-xs">
                                <div className="font-medium text-white mb-2 flex items-center gap-1.5">
                                  <GitPullRequest className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>
                                    Pull Requests by @{row.original.user.username} ({row.original.prs.length})
                                  </span>
                                </div>

                                <div className="space-y-2 mt-2">
                                  {row.original.prs.map((pr) => (
                                    <div
                                      key={pr.id}
                                      className="p-2.5 rounded bg-[#18181b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-zinc-500">Day {pr.dayOfSprint}</span>
                                          <span className="text-zinc-600">•</span>
                                          <span className="text-zinc-300 font-mono text-[11px]">{pr.repo}</span>
                                          <span className="text-zinc-600">•</span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                                              pr.state === 'merged'
                                                ? 'bg-purple-900/40 text-purple-300'
                                                : 'bg-emerald-900/40 text-emerald-300'
                                            }`}
                                          >
                                            {pr.state}
                                          </span>
                                        </div>
                                        <a
                                          href={pr.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                                        >
                                          <span>#{pr.githubPrNumber}: {pr.title}</span>
                                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                                        </a>
                                        {pr.adminFeedback && (
                                          <p className="text-zinc-400 italic text-[11px] mt-0.5">
                                            Feedback: &ldquo;{pr.adminFeedback}&rdquo;
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-right">
                                          <span className="text-zinc-500 block text-[10px]">Points</span>
                                          <span className="font-semibold text-white">
                                            {pr.reviewStatus === 'REVIEWED' ? `+${pr.creditScore} pts` : 'Pending'}
                                          </span>
                                        </div>

                                        {isAdmin && onSelectPrForReview && (
                                          <button
                                            onClick={() => onSelectPrForReview(pr)}
                                            className="btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                                          >
                                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                                            <span>Grade</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center p-8 text-zinc-500 text-xs">
                        No contributors found matching search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 bg-[#18181b]/30">
              <div>
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {Math.max(1, table.getPageCount())}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="btn-secondary !text-xs !py-1 !px-2.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="btn-secondary !text-xs !py-1 !px-2.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Submitted Pull Requests */}
      {activeTab === 'PRS' && (
        <div className="space-y-4">
          {/* PR Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentUser && (
                <div className="flex rounded bg-[#18181b] border border-white/10 p-0.5 text-xs">
                  <button
                    onClick={() => setPrViewFilter('ALL')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      prViewFilter === 'ALL'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All PRs
                  </button>
                  <button
                    onClick={() => setPrViewFilter('MINE')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      prViewFilter === 'MINE'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    My PRs
                  </button>
                </div>
              )}

              <select
                value={prStatusFilter}
                onChange={(e) => setPrStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-[#121215] border border-white/10 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PR or repository..."
                value={prSearchQuery}
                onChange={(e) => setPrSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded bg-[#121215] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* PR List */}
          <div className="divide-y divide-white/10 rounded bg-[#121215] border border-white/10 overflow-hidden">
            {displayedPrs.length > 0 ? (
              displayedPrs.map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-400">
                        {pr.repo}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500">Day {pr.dayOfSprint}</span>
                      <span className="text-zinc-600">•</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] ${
                          pr.state === 'merged'
                            ? 'bg-purple-900/40 text-purple-300'
                            : 'bg-emerald-900/40 text-emerald-300'
                        }`}
                      >
                        {pr.state}
                      </span>
                    </div>

                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 text-sm truncate"
                    >
                      <span>#{pr.githubPrNumber}: {pr.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    </a>

                    <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                      <span>by @{pr.author}</span>
                      <span>•</span>
                      <span className="text-emerald-400">+{pr.additions}</span>
                      <span className="text-rose-400">-{pr.deletions}</span>
                      {pr.commitsCount && (
                        <>
                          <span>•</span>
                          <span>{pr.commitsCount} commits</span>
                        </>
                      )}
                    </div>

                    {pr.adminFeedback && (
                      <div className="text-zinc-400 italic text-[11px] pt-1">
                        Review feedback: &ldquo;{pr.adminFeedback}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          pr.reviewStatus === 'REVIEWED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : pr.reviewStatus === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {pr.reviewStatus === 'REVIEWED'
                          ? `Reviewed (+${pr.creditScore} pts)`
                          : pr.reviewStatus === 'REJECTED'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </span>
                    </div>

                    {isAdmin && onSelectPrForReview && (
                      <button
                        onClick={() => onSelectPrForReview(pr)}
                        className="btn-secondary !text-xs !py-1 !px-2.5 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Grade PR</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No submitted pull requests match the current filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
