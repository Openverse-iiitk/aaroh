import React, { useState } from 'react';
import { PullRequest, Sprint, User, AuditLog } from '../types';
import { Shield, CheckCircle2, Clock, StopCircle, PlayCircle, RefreshCw, Flag, RotateCcw, AlertTriangle, ExternalLink, Award, FileCode, Check } from 'lucide-react';

interface AdminPageProps {
  currentUser: User | null;
  sprint: Sprint;
  pullRequests: PullRequest[];
  auditLogs: AuditLog[];
  onSelectPrForReview: (pr: PullRequest) => void;
  onToggleStatus: () => void;
  onEndTracking: () => void;
  onStartNewSprint: () => void;
  onSyncDaily: () => void;
  onResetDatabase: () => void;
  onSwitchToAdmin: () => void;
  isSyncing: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  sprint,
  pullRequests = [],
  auditLogs = [],
  onSelectPrForReview,
  onToggleStatus,
  onEndTracking,
  onStartNewSprint,
  onSyncDaily,
  onResetDatabase,
  onSwitchToAdmin,
  isSyncing
}) => {
  const [confirmEndModal, setConfirmEndModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];
  const pendingPrs = safePrs.filter((pr) => pr && pr.reviewStatus === 'PENDING_REVIEW');
  const reviewedPrs = safePrs.filter((pr) => pr && pr.reviewStatus === 'REVIEWED');
  const totalCreditsAwarded = reviewedPrs.reduce((acc, curr) => acc + (curr.creditScore || 0), 0);

  // If user is not admin, show testing switch banner
  if (!isAdmin) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="panel-glass p-8 space-y-4 border border-lavender-accent/30 shadow-badge">
          <div className="w-12 h-12 rounded-full bg-deep-indigo border border-lavender-accent/40 mx-auto flex items-center justify-center">
            <Shield className="w-6 h-6 text-lavender-accent" />
          </div>
          <h2 className="text-2xl font-medium text-lilac-white">
            Admin Review & Tracking Portal
          </h2>
          <p className="text-sm text-ash max-w-md mx-auto">
            You are currently browsing as a standard contributor. Admin privileges are required
            to manually grade pull requests and manage the 7-day tracking lifecycle.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onSwitchToAdmin}
              className="btn-primary !px-5 !py-2.5"
            >
              <Shield className="w-4 h-4" />
              <span>Switch to Admin Account (admin-starlit)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="badge-pill inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-medium text-lavender-accent">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Review & Scoring Operations</span>
          </div>
          <h2 className="text-3xl font-medium text-lilac-white">
            Sprint Administration Hub
          </h2>
          <p className="text-sm text-ash mt-1">
            Manually grade pull requests, assign credit scores, update daily tracking, and declare the final leaderboard.
          </p>
        </div>

        <button
          onClick={onResetDatabase}
          className="btn-ghost !text-xs !py-1.5 !px-3 self-start sm:self-auto flex items-center gap-1 text-fog hover:text-rose-300"
          title="Reset back to initial seed data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Test Database</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Awaiting Review
          </span>
          <span className="text-2xl font-semibold text-amber-300 block">
            {pendingPrs.length}
          </span>
          <span className="text-[10px] text-ash">Needs manual score</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Graded PRs
          </span>
          <span className="text-2xl font-semibold text-emerald-400 block">
            {reviewedPrs.length}
          </span>
          <span className="text-[10px] text-ash">Approved & credited</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Credits Distributed
          </span>
          <span className="text-2xl font-semibold text-cosmic-gradient block">
            {totalCreditsAwarded} pts
          </span>
          <span className="text-[10px] text-ash">Across all contributors</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Sprint Lifecycle
          </span>
          <span className="text-base font-semibold text-lilac-white block mt-1">
            {sprint.isFinalized ? 'FINALIZED' : `${sprint.status} (Day ${sprint.currentDay})`}
          </span>
          <span className="text-[10px] text-ash">
            {sprint.isFinalized ? 'Leaderboard frozen' : 'Active weekly cycle'}
          </span>
        </div>
      </div>

      {/* Sprint Tracking Controls Panel */}
      <div className="panel-glass p-6 space-y-4">
        <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-lavender-accent" />
          <span>Sprint Tracking Lifecycle Controls</span>
        </h3>
        <p className="text-xs text-ash">
          Control when tracking starts, pauses, or officially ends to produce the final leaderboard.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!sprint.isFinalized ? (
            <>
              {/* Daily Sync */}
              <button
                onClick={onSyncDaily}
                disabled={isSyncing || sprint.status !== 'ACTIVE'}
                className="btn-primary !text-xs !py-2 !px-4 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Ingesting Day Updates...' : 'Trigger Daily PR Sync'}</span>
              </button>

              {/* Pause / Resume */}
              <button
                onClick={onToggleStatus}
                className="btn-secondary !text-xs !py-2 !px-4"
              >
                {sprint.status === 'ACTIVE' ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pause Sprint Tracking</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Resume Sprint Tracking</span>
                  </>
                )}
              </button>

              {/* End Tracking & Lock Final Leaderboard */}
              <button
                onClick={() => setConfirmEndModal(true)}
                className="px-4 py-2 rounded-btn bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 text-xs font-medium transition-colors flex items-center gap-2"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>End Tracking & Show Final Leaderboard</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-lavender-accent font-medium">
                Tracking concluded on {new Date(sprint.finalizedAt || '').toLocaleDateString()}.
              </span>
              <button
                onClick={onStartNewSprint}
                className="btn-primary !text-xs !py-2 !px-4 flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Initialize Next Week Sprint</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PR Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
            <Award className="w-4 h-4 text-lavender-accent" />
            <span>PR Review Queue ({pendingPrs.length} Pending)</span>
          </h3>
          <span className="text-xs text-fog">
            Review code quality & assign credit points
          </span>
        </div>

        {pendingPrs.length > 0 ? (
          <div className="space-y-3">
            {pendingPrs.map((pr) => (
              <div
                key={pr.id}
                className="panel-glass p-5 border border-amber-500/20 hover:border-lavender-accent/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                        Needs Review
                      </span>
                      <span className="text-steel">•</span>
                      <img
                        src={pr.authorAvatar}
                        alt={pr.author}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-medium text-lilac-white">@{pr.author}</span>
                      <span className="text-steel">•</span>
                      <span className="text-ash">{pr.repo}</span>
                      <span className="text-steel">•</span>
                      <span className="text-fog">Day {pr.dayOfSprint}</span>
                    </div>

                    <h4 className="text-sm font-medium text-lilac-white">
                      #{pr.githubPrNumber}: {pr.title}
                    </h4>

                    {pr.description && (
                      <p className="text-xs text-ash line-clamp-2">
                        {pr.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-fog">
                      <span className="text-emerald-400">+{pr.additions}</span>
                      <span className="text-rose-400">-{pr.deletions}</span>
                      <span>{pr.commitsCount} commits</span>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lavender-accent hover:underline flex items-center gap-1"
                      >
                        GitHub PR <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPrForReview(pr)}
                    className="btn-primary !text-xs !py-2 !px-4 flex-shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Grade & Score PR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-glass p-8 text-center text-xs text-fog">
            All pull requests have been reviewed and credited!
          </div>
        )}
      </div>

      {/* Recently Graded PRs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Recently Scored Pull Requests ({reviewedPrs.length})</span>
        </h3>

        <div className="divide-y divide-white/5 panel-glass overflow-hidden text-xs">
          {reviewedPrs.map((pr) => (
            <div key={pr.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lilac-white truncate">
                    #{pr.githubPrNumber}: {pr.title}
                  </span>
                  <span className="text-fog">(@{pr.author})</span>
                </div>
                {pr.adminFeedback && (
                  <p className="text-fog italic text-[11px] truncate">
                    &ldquo;{pr.adminFeedback}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold text-cosmic-gradient">
                  +{pr.creditScore} pts
                </span>
                <button
                  onClick={() => onSelectPrForReview(pr)}
                  className="btn-secondary !text-[11px] !py-1 !px-2.5"
                >
                  Adjust
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
          <FileCode className="w-4 h-4 text-lavender-accent" />
          <span>Audit & Operations Log</span>
        </h3>

        <div className="panel-glass p-4 max-h-56 overflow-y-auto space-y-2 text-xs font-mono">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-fog">
              <span className="text-steel flex-shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className="text-lavender-accent flex-shrink-0">
                {log.action}
              </span>
              <span className="text-ash">by {log.actor}:</span>
              <span className="text-lilac-white">{log.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm End Modal Dialog */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="panel-glass-elevated max-w-md p-6 space-y-4 border border-rose-500/40">
            <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-xl font-medium text-lilac-white">
              End Sprint Tracking & Finalize Leaderboard?
            </h3>
            <p className="text-xs text-ash leading-relaxed">
              This will officially conclude the 7-day tracking sprint, freeze all contributor credits,
              lock rankings, and present the celebratory final podium and leaderboard.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setConfirmEndModal(false)}
                className="btn-ghost !text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmEndModal(false);
                  onEndTracking();
                }}
                className="px-4 py-2 rounded-btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
              >
                Yes, Finalize Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
