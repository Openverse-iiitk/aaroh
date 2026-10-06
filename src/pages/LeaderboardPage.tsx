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
import { LeaderboardItem, Sprint, PullRequest } from '../types';
import { Trophy, Search, ChevronDown, ChevronRight, ArrowUpDown, GitPullRequest, GitMerge, ExternalLink, ShieldCheck, Star } from 'lucide-react';

interface LeaderboardPageProps {
  leaderboard: LeaderboardItem[];
  sprint: Sprint;
  onSelectPrForReview?: (pr: PullRequest) => void;
  isAdmin?: boolean;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  leaderboard = [],
  sprint,
  onSelectPrForReview,
  isAdmin
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'totalCredits', desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const columns = useMemo<ColumnDef<LeaderboardItem>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1 text-fog hover:text-lilac-white transition-colors"
            title="Expand pull requests"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="w-4 h-4 text-lavender-accent" />
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
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-fog hover:text-lilac-white"
          >
            <span>Rank</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => {
          const rank = row.original.rank;
          return (
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  rank === 1
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                    : rank === 2
                    ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                    : rank === 3
                    ? 'bg-amber-800/20 text-amber-500 border border-amber-700/40'
                    : 'bg-white/5 text-fog'
                }`}
              >
                #{rank}
              </span>
              {rank === 1 && <Star className="w-3 h-3 fill-amber-300 text-amber-300 hidden sm:inline" />}
            </div>
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
            <div className="flex items-center gap-3">
              <img
                src={item.user.avatarUrl}
                alt={item.user.username}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
              <div>
                <a
                  href={item.user.htmlUrl || `https://github.com/${item.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-lilac-white hover:text-lavender-accent transition-colors block leading-snug"
                >
                  {item.user.name}
                </a>
                <span className="text-xs text-fog">@{item.user.username}</span>
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
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-fog hover:text-lilac-white"
          >
            <span>Credit Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-semibold text-cosmic-gradient text-base">
            {row.original.totalCredits} pts
          </div>
        ),
      },
      {
        accessorKey: 'totalPrs',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-fog hover:text-lilac-white"
          >
            <span>Pull Requests</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs space-y-0.5">
              <span className="font-medium text-lilac-white block">
                {item.totalPrs} PRs
              </span>
              <span className="text-[11px] text-fog flex items-center gap-1">
                <GitMerge className="w-3 h-3 text-emerald-400" />
                {item.mergedPrs} merged
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'avgCreditPerReviewedPr',
        header: 'Avg Score / PR',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-ash">
            {row.original.avgCreditPerReviewedPr} pts
          </span>
        ),
      },
      {
        id: 'dailyCredits',
        header: 'Daily Velocity (Days 1–7)',
        cell: ({ row }) => {
          const daily = row.original.dailyCredits;
          const max = Math.max(...daily, 1);
          return (
            <div className="flex items-end gap-1 h-7">
              {daily.map((credit, i) => {
                const heightPercent = Math.max(15, (credit / max) * 100);
                const isCurrent = i + 1 === sprint.currentDay;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center group relative"
                    title={`Day ${i + 1}: ${credit} credits`}
                  >
                    <div
                      style={{ height: `${credit > 0 ? heightPercent : 15}%` }}
                      className={`w-2.5 rounded-t-[2px] transition-all ${
                        credit > 0
                          ? 'bg-lavender-accent group-hover:bg-lilac-white'
                          : 'bg-steel/30'
                      } ${isCurrent ? 'ring-1 ring-lavender-accent/60' : ''}`}
                    />
                    <span className="text-[8px] text-steel mt-0.5">{i + 1}</span>
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
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="badge-pill inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-medium text-lilac-white">
            <Trophy className="w-3.5 h-3.5 text-lavender-accent" />
            <span>{sprint.isFinalized ? 'Sprint Concluded' : 'Live Standings'}</span>
          </div>
          <h2 className="text-3xl font-medium text-lilac-white">
            {sprint.isFinalized ? 'Final Leaderboard' : 'Sprint Leaderboard'}
          </h2>
          <p className="text-sm text-ash mt-1">
            {sprint.isFinalized
              ? 'Final credit distribution frozen. Top ranking contributors crowned.'
              : 'Ranked dynamically by total credits awarded from manually reviewed pull requests.'}
          </p>
        </div>

        {/* Global Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contributor..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white placeholder:text-steel focus:outline-none focus:border-lavender-accent"
          />
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="panel-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/5 bg-midnight-surface/50">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3.5 text-xs text-fog font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>

                    {/* Sub-row for expanded PR history */}
                    {row.getIsExpanded() && (
                      <tr className="bg-void-canvas/70">
                        <td colSpan={columns.length} className="p-4 pl-12">
                          <div className="p-4 rounded-btn bg-midnight-surface border border-white/5 text-xs">
                            <h4 className="font-medium text-lilac-white mb-2 flex items-center gap-1.5">
                              <GitPullRequest className="w-3.5 h-3.5 text-lavender-accent" />
                              <span>
                                Pull Requests by @{row.original.user.username} ({row.original.prs.length})
                              </span>
                            </h4>

                            <div className="space-y-2 mt-3">
                              {row.original.prs.map((pr) => (
                                <div
                                  key={pr.id}
                                  className="p-3 rounded bg-void-canvas border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-fog">Day {pr.dayOfSprint}</span>
                                      <span className="text-steel">•</span>
                                      <span className="text-ash">{pr.repo}</span>
                                      <span className="text-steel">•</span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                          pr.state === 'merged'
                                            ? 'bg-purple-950/40 text-purple-300'
                                            : 'bg-emerald-950/40 text-emerald-300'
                                        }`}
                                      >
                                        {pr.state}
                                      </span>
                                    </div>
                                    <a
                                      href={pr.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-lilac-white hover:text-lavender-accent transition-colors flex items-center gap-1"
                                    >
                                      <span>#{pr.githubPrNumber}: {pr.title}</span>
                                      <ExternalLink className="w-3 h-3 text-fog" />
                                    </a>
                                    {pr.adminFeedback && (
                                      <p className="text-fog italic text-[11px] mt-1">
                                        Reviewer: &ldquo;{pr.adminFeedback}&rdquo;
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                      <span className="text-fog block text-[10px]">Score</span>
                                      <span className="font-semibold text-cosmic-gradient">
                                        {pr.reviewStatus === 'REVIEWED' ? `+${pr.creditScore} pts` : 'Pending'}
                                      </span>
                                    </div>

                                    {isAdmin && onSelectPrForReview && (
                                      <button
                                        onClick={() => onSelectPrForReview(pr)}
                                        className="btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                                      >
                                        <ShieldCheck className="w-3 h-3 text-lavender-accent" />
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
                  <td colSpan={columns.length} className="text-center p-8 text-fog text-xs">
                    No contributors found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs text-fog bg-midnight-surface/30">
          <div>
            Showing page {table.getState().pagination.pageIndex + 1} of{' '}
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
  );
};
