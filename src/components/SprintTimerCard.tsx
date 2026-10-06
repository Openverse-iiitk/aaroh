import React from 'react';
import { Sprint, User } from '../types';
import { Calendar, RefreshCw, StopCircle, PlayCircle, Lock, Flag, CheckCircle2, Clock } from 'lucide-react';

interface SprintTimerCardProps {
  sprint: Sprint;
  currentUser: User | null;
  onSyncDaily: () => void;
  onToggleStatus: () => void;
  onEndTracking: () => void;
  onStartNewSprint: () => void;
  isSyncing: boolean;
}

export const SprintTimerCard: React.FC<SprintTimerCardProps> = ({
  sprint,
  currentUser,
  onSyncDaily,
  onToggleStatus,
  onEndTracking,
  onStartNewSprint,
  isSyncing
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Calculate day names for the 7 days
  const startDate = new Date(sprint.startDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      dayNum: i + 1,
      label: `Day ${i + 1}`,
      dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isCompleted: i + 1 < sprint.currentDay,
      isCurrent: i + 1 === sprint.currentDay,
      isFuture: i + 1 > sprint.currentDay
    };
  });

  return (
    <div className="panel-glass p-6 w-full max-w-5xl mx-auto mb-10 transition-all">
      {/* Top row: Sprint Title & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="w-4 h-4 text-lavender-accent" />
            <span className="text-xs font-medium uppercase tracking-wider text-fog">
              Weekly Sprint Window
            </span>
            <span className="text-steel">•</span>
            <span className="text-xs text-ash">7 Calendar Days</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-lilac-white">
            {sprint.name}
          </h2>
          <p className="text-sm text-ash mt-1">
            {sprint.isFinalized
              ? 'Tracking has concluded. Final credit scores are frozen.'
              : 'Pull requests are ingested daily and manually scored by admins.'}
          </p>
        </div>

        {/* Tracking Status Pill & Admin Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {sprint.isFinalized ? (
            <div className="badge-pill px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-lavender-accent">
              <Lock className="w-3.5 h-3.5" />
              <span>FINALIZED & LOCKED</span>
            </div>
          ) : sprint.status === 'ACTIVE' ? (
            <div className="px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE TRACKING</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center gap-2 text-xs font-medium text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>TRACKING PAUSED</span>
            </div>
          )}

          {/* Sync Trigger button */}
          {!sprint.isFinalized && (
            <button
              onClick={onSyncDaily}
              disabled={isSyncing || sprint.status !== 'ACTIVE'}
              className="btn-secondary !text-xs !py-1.5 !px-3 disabled:opacity-40"
              title="Fetch today's pull request updates"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-lavender-accent ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Updating Day...' : 'Update Daily PRs'}</span>
            </button>
          )}

          {/* Admin End Tracking / Start New Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {!sprint.isFinalized ? (
                <>
                  <button
                    onClick={onToggleStatus}
                    className="btn-ghost !text-xs !py-1.5 !px-2.5 flex items-center gap-1.5"
                    title={sprint.status === 'ACTIVE' ? 'Pause tracking' : 'Resume tracking'}
                  >
                    {sprint.status === 'ACTIVE' ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onEndTracking}
                    className="px-3 py-1.5 rounded-btn bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 text-xs font-medium transition-colors flex items-center gap-1.5"
                    title="End tracking now and show final leaderboard"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>End Tracking & Lock</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onStartNewSprint}
                  className="btn-primary !text-xs !py-1.5 !px-3 flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Start Next Week Sprint</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Sprint Timeline Progression */}
      <div className="pt-6">
        <div className="flex items-center justify-between text-xs text-fog mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-lavender-accent" />
            <span>Daily Tracking Rhythm: Updates every 24 hours</span>
          </div>
          <span>
            Current: {sprint.isFinalized ? 'Completed' : `Day ${sprint.currentDay} of 7`}
          </span>
        </div>

        {/* 7 Day Step Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {days.map((day) => {
            const isFinished = sprint.isFinalized || day.isCompleted;
            const isToday = !sprint.isFinalized && day.isCurrent;

            return (
              <div
                key={day.dayNum}
                className={`p-3 rounded-btn border text-left transition-all ${
                  isToday
                    ? 'bg-deep-indigo border-lavender-accent shadow-[0_0_15px_rgba(147,130,255,0.2)]'
                    : isFinished
                    ? 'bg-midnight-surface/80 border-white/10 opacity-80'
                    : 'bg-void-canvas border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-semibold tracking-wider ${
                    isToday ? 'text-lavender-accent' : isFinished ? 'text-ash' : 'text-steel'
                  }`}>
                    {day.label}
                  </span>
                  {isFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-lavender-accent/70" />
                  ) : isToday ? (
                    <span className="w-2 h-2 rounded-full bg-lavender-accent animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-steel" />
                  )}
                </div>
                <div className="text-[12px] font-medium text-lilac-white truncate">
                  {day.dateStr}
                </div>
                <div className="text-[10px] text-fog mt-0.5">
                  {isFinished ? 'PRs Logged' : isToday ? 'Live Syncing' : 'Upcoming'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
