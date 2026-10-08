import React, { useState, useEffect } from 'react';
import { PullRequest, Sprint, User, AuditLog } from '../types';
import { Shield, CheckCircle2, Clock, StopCircle, PlayCircle, PauseCircle, RefreshCw, Flag, RotateCcw, AlertTriangle, ExternalLink, Award, FileCode, Check, Play, Settings, Plus, Trash2, Calendar, Lock } from 'lucide-react';
import { adminSecretLogin } from '../api/client';
import { formatGithubPrUrl } from '../utils/github';

interface AdminPageProps {
  currentUser: User | null;
  sprint: Sprint;
  pullRequests: PullRequest[];
  auditLogs: AuditLog[];
  onSelectPrForReview: (pr: PullRequest) => void;
  onToggleStatus: () => void;
  onEndTracking: () => void;
  onStartSprint?: () => void;
  onStartNewSprint: () => void;
  onSyncDaily: () => void;
  onUpdateSettings?: (payload: { dailyUpdateTime?: string; name?: string; trackedRepos?: string[] }) => void;
  onResetToNotStarted?: () => void;
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
  onStartSprint,
  onStartNewSprint,
  onSyncDaily,
  onUpdateSettings,
  onResetToNotStarted,
  onResetDatabase,
  onSwitchToAdmin,
  isSyncing
}) => {
  const [confirmEndModal, setConfirmEndModal] = useState(false);
  const [dailyTimeInput, setDailyTimeInput] = useState(sprint.dailyUpdateTime || '00:00');
  const [newRepoInput, setNewRepoInput] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (sprint.dailyUpdateTime) {
      setDailyTimeInput(sprint.dailyUpdateTime);
    }
  }, [sprint.dailyUpdateTime]);

  const isAdmin = currentUser?.role === 'admin';
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];
  const pendingPrs = safePrs.filter((pr) => pr && pr.reviewStatus === 'PENDING_REVIEW');
  const reviewedPrs = safePrs.filter((pr) => pr && pr.reviewStatus === 'REVIEWED');
  const totalCreditsAwarded = reviewedPrs.reduce((acc, curr) => acc + (curr.creditScore || 0), 0);

  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyUsername, setPasskeyUsername] = useState('Vijay-1710');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;
    setPasskeyLoading(true);
    setPasskeyError(null);
    try {
      await adminSecretLogin(passkeyInput.trim(), passkeyUsername.trim() || 'Vijay-1710');
      window.location.reload();
    } catch (err: any) {
      setPasskeyError(err.message || 'Invalid secret passkey');
      setPasskeyLoading(false);
    }
  };

  // If user is not admin, show secret organizer access terminal
  if (!isAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center">
        <div className="p-7 rounded-2xl bg-[#0e0a24] border border-white/10 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-left">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 mx-auto flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Organizer Admin Access
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Participant logins are paused. Enter your secret organizer passkey to access the management portal.
            </p>
          </div>

          {passkeyError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{passkeyError}</span>
            </div>
          )}

          <form onSubmit={handlePasskeySubmit} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Secret Passkey</label>
              <input
                type="password"
                placeholder="Enter secret passkey"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full bg-[#070417] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 font-mono"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">Admin Username</label>
              <input
                type="text"
                placeholder="Vijay-1710"
                value={passkeyUsername}
                onChange={(e) => setPasskeyUsername(e.target.value)}
                className="w-full bg-[#070417] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={passkeyLoading || !passkeyInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
            >
              <span>{passkeyLoading ? 'Verifying...' : 'Unlock Admin Hub'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveSchedule = () => {
    if (onUpdateSettings) {
      onUpdateSettings({ dailyUpdateTime: dailyTimeInput });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    }
  };

  const handleAddRepo = () => {
    if (!newRepoInput.trim() || !onUpdateSettings) return;
    const current = sprint.trackedRepos || [];
    if (!current.includes(newRepoInput.trim())) {
      onUpdateSettings({ trackedRepos: [...current, newRepoInput.trim()] });
    }
    setNewRepoInput('');
  };

  const handleRemoveRepo = (repoToRemove: string) => {
    if (!onUpdateSettings) return;
    const current = sprint.trackedRepos || [];
    onUpdateSettings({ trackedRepos: current.filter(r => r !== repoToRemove) });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Event Administration Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage tracking lifecycle, review pull requests, and configure scheduled daily syncs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onResetToNotStarted && (
            <button
              id="admin-reset-not-started-btn"
              onClick={onResetToNotStarted}
              className="btn-ghost !text-xs !py-1.5 !px-2.5 text-fog hover:text-lilac-white"
              title="Reset state to not started so you can test starting"
            >
              <span>Reset to Pending Start</span>
            </button>
          )}

          <button
            id="admin-reset-db-btn"
            onClick={onResetDatabase}
            className="btn-ghost !text-xs !py-1.5 !px-3 flex items-center gap-1 text-fog hover:text-rose-300"
            title="Reset back to initial seed data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
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
          <span className="text-[10px] text-ash">Needs admin credit score</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Graded PRs
          </span>
          <span className="text-2xl font-semibold text-emerald-400 block">
            {reviewedPrs.length}
          </span>
          <span className="text-[10px] text-ash">Approved &amp; credited</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Credits Distributed
          </span>
          <span className="text-2xl font-semibold text-white block">
            {totalCreditsAwarded} pts
          </span>
          <span className="text-[10px] text-ash">Across all contributors</span>
        </div>

        <div className="panel-glass p-4">
          <span className="text-[11px] uppercase tracking-wider text-fog block mb-1">
            Tracking Lifecycle
          </span>
          <span className="text-base font-semibold text-lilac-white block mt-1">
            {sprint.status === 'NOT_STARTED'
              ? 'NOT STARTED'
              : sprint.isFinalized
              ? 'FINALIZED'
              : `${sprint.status} (Day ${sprint.currentDay})`}
          </span>
          <span className="text-[10px] text-ash">
            {sprint.status === 'NOT_STARTED'
              ? 'Awaiting admin start'
              : sprint.isFinalized
              ? 'Rankings locked'
              : 'Admin-controlled duration'}
          </span>
        </div>
      </div>

      {/* Sprint Lifecycle Management Panel */}
      <div className="panel-glass p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lavender-accent" />
              <span>Event Lifecycle: Starts and Ends When You Choose</span>
            </h3>
            <p className="text-xs text-ash mt-0.5">
              The tracking event does not have a forced calendar cutoff. You decide when to begin and when to end tracking and reveal final rankings.
            </p>
          </div>

          <div className="text-xs text-fog">
            Status:{' '}
            <strong className="text-lilac-white">
              {sprint.status === 'NOT_STARTED'
                ? 'Pending Start'
                : sprint.status === 'ACTIVE'
                ? `Running (Day ${sprint.currentDay})`
                : sprint.status === 'PAUSED'
                ? 'Paused'
                : 'Concluded'}
            </strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
          {sprint.status === 'NOT_STARTED' ? (
            <button
              id="admin-start-sprint-btn"
              onClick={onStartSprint}
              className="btn-primary !text-xs !py-2 !px-4 flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Tracking Event Now</span>
            </button>
          ) : !sprint.isFinalized ? (
            <>
              {/* Daily PR Calculation Trigger */}
              <button
                id="admin-sync-daily-btn"
                onClick={onSyncDaily}
                disabled={isSyncing || sprint.status !== 'ACTIVE'}
                className="btn-primary !text-xs !py-2 !px-4 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Calculating Daily PRs...' : 'Run Daily Calculation Now'}</span>
              </button>

              {/* Pause / Resume */}
              <button
                id="admin-toggle-status-btn"
                onClick={onToggleStatus}
                className="btn-secondary !text-xs !py-2 !px-4"
              >
                {sprint.status === 'ACTIVE' ? (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pause Event</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Resume Event</span>
                  </>
                )}
              </button>

              {/* Pause / Resume Logins Toggle */}
              <button
                id="admin-toggle-logins-btn"
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/admin/toggle-logins', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ paused: !sprint.loginsPaused })
                    });
                    window.location.reload();
                  } catch (e) {
                    alert('Failed to update logins status');
                  }
                }}
                className={`px-3 py-2 rounded-btn text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                  sprint.loginsPaused
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                    : 'btn-secondary !py-2 !px-3'
                }`}
              >
                <Lock className={`w-3.5 h-3.5 ${sprint.loginsPaused ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{sprint.loginsPaused ? 'Logins: PAUSED (Click to Resume)' : 'Pause Logins'}</span>
              </button>

              {/* End Tracking */}
              <button
                id="admin-end-sprint-btn"
                onClick={() => setConfirmEndModal(true)}
                className="px-4 py-2 rounded-btn bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 text-xs font-medium transition-colors flex items-center gap-2"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>End Tracking &amp; Finalize Leaderboard</span>
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-lavender-accent font-medium">
                Tracking concluded on {new Date(sprint.finalizedAt || '').toLocaleDateString()}. Standings are locked.
              </span>
              <button
                id="admin-start-new-sprint-btn"
                onClick={onStartNewSprint}
                className="btn-primary !text-xs !py-2 !px-4 flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Start New Tracking Event</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily Update Schedule & Tracked Repos Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule Settings */}
        <div className="panel-glass p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-lilac-white">
            <Clock className="w-4 h-4 text-lavender-accent" />
            <span>Automatic Daily Calculation Time</span>
          </div>
          <p className="text-xs text-ash">
            Set the specific time of day (UTC) when pull requests are automatically ingested and calculated.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="admin-schedule-time-input"
              type="time"
              value={dailyTimeInput}
              onChange={(e) => setDailyTimeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveSchedule();
                }
              }}
              className="px-3 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent font-mono"
            />
            <button
              id="admin-save-schedule-btn"
              onClick={handleSaveSchedule}
              className="btn-secondary !text-xs !py-1.5 !px-3"
            >
              Save Schedule
            </button>
            {settingsSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
          <span className="text-[11px] text-fog block">
            Current: {sprint.dailyUpdateTime || '00:00'} UTC (Runs automatically every 24 hours)
          </span>
        </div>

        {/* Global Cross-Repository Tracking Scope */}
        <div className="panel-glass p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-lilac-white">
              <Settings className="w-4 h-4 text-lavender-accent" />
              <span>Cross-Repository Contributor Scope</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
              Global Scope Active
            </span>
          </div>
          <p className="text-xs text-ash leading-relaxed">
            All pull requests authored by registered contributors across <strong>all public repositories</strong> on GitHub are automatically tracked, calculated daily, and routed here for admin scoring.
          </p>

          <div className="pt-2">
            <span className="text-[11px] text-fog block mb-1.5 font-medium">
              Active Repositories Discovered from Registered Users ({sprint.trackedRepos?.length || 0}):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {sprint.trackedRepos?.map((repo) => (
                <span
                  key={repo}
                  className="px-2.5 py-1 rounded-btn bg-midnight-surface border border-white/10 text-[11px] text-lilac-white font-mono flex items-center gap-1.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-lavender-accent" />
                  <span>{repo}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRepo(repo)}
                    className="ml-0.5 text-zinc-500 hover:text-rose-400 p-0.5 rounded hover:bg-white/5 transition-colors"
                    title={`Unpin ${repo}`}
                    aria-label={`Unpin ${repo}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/5">
            <input
              id="admin-new-repo-input"
              type="text"
              placeholder="Track custom repo: e.g. org/repo"
              value={newRepoInput}
              onChange={(e) => setNewRepoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRepo();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent placeholder:text-steel"
            />
            <button
              id="admin-pin-repo-btn"
              onClick={handleAddRepo}
              disabled={!newRepoInput.trim()}
              className="btn-secondary !text-xs !py-1.5 !px-3 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pin Repo</span>
            </button>
          </div>
        </div>
      </div>

      {/* PR Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-lilac-white flex items-center gap-2">
            <Award className="w-4 h-4 text-lavender-accent" />
            <span>PR Review Queue ({pendingPrs.length} Awaiting Score)</span>
          </h3>
          <span className="text-xs text-fog">
            Admin manual code inspection &amp; credit points
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
                      {pr.isRepoOnly || !pr.githubPrNumber ? '📁 [Repo Project] ' : `#${pr.githubPrNumber}: `}{pr.title}
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
                        href={formatGithubPrUrl(pr.url, pr.repo, pr.githubPrNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lavender-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {pr.isRepoOnly || !pr.githubPrNumber ? 'View Repository' : 'GitHub PR'} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <button
                    id={`admin-review-pr-btn-${pr.id}`}
                    onClick={() => onSelectPrForReview(pr)}
                    className="btn-primary !text-xs !py-2 !px-4 flex-shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Grade &amp; Score PR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-glass p-8 text-center text-xs text-fog">
            All detected pull requests have been reviewed and credited!
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
                    {pr.isRepoOnly || !pr.githubPrNumber ? '📁 [Repo Project] ' : `#${pr.githubPrNumber}: `}{pr.title}
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
                <span className="text-sm font-semibold text-white">
                  +{pr.creditScore} pts
                </span>
                <button
                  id={`admin-adjust-pr-btn-${pr.id}`}
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
          <span>Audit &amp; Operations Log</span>
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
              End Sprint Tracking &amp; Finalize Leaderboard?
            </h3>
            <p className="text-xs text-ash leading-relaxed">
              This will officially conclude the tracking event, freeze all contributor credits,
              lock rankings, and present the celebratory final podium and leaderboard.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                id="admin-cancel-end-btn"
                onClick={() => setConfirmEndModal(false)}
                className="btn-ghost !text-xs"
              >
                Cancel
              </button>
              <button
                id="admin-confirm-end-btn"
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
