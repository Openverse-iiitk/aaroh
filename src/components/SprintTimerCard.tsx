import React, { useState, useEffect } from 'react';
import { Sprint, User } from '../types';
import { Calendar, RefreshCw, StopCircle, PlayCircle, Lock, Flag, CheckCircle2, Clock, Sparkles, Play, ShieldAlert, GitPullRequest } from 'lucide-react';

interface SprintTimerCardProps {
  sprint: Sprint;
  currentUser: User | null;
  onSyncDaily: () => void;
  onToggleStatus: () => void;
  onEndTracking: () => void;
  onStartSprint?: () => void;
  isSyncing: boolean;
}

export const SprintTimerCard: React.FC<SprintTimerCardProps> = ({
  sprint,
  currentUser,
  onSyncDaily,
  onToggleStatus,
  onEndTracking,
  onStartSprint,
  isSyncing
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Countdown timer to nextSyncAt
  useEffect(() => {
    if (!sprint.nextSyncAt || sprint.status !== 'ACTIVE' || sprint.isFinalized) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const target = new Date(sprint.nextSyncAt!).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('Due now (calculating...)');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [sprint.nextSyncAt, sprint.status, sprint.isFinalized]);

  // Days list generated dynamically based on sprint progress
  const currentDay = sprint.currentDay || 1;
  const maxDayDisplay = Math.max(5, currentDay + 1);
  const dynamicDays = Array.from({ length: maxDayDisplay }, (_, i) => {
    const dayNum = i + 1;
    return {
      dayNum,
      label: `Day ${dayNum}`,
      isCompleted: dayNum < currentDay,
      isCurrent: dayNum === currentDay && sprint.status === 'ACTIVE',
      isFuture: dayNum > currentDay
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
              Admin-Controlled Tracking Event
            </span>
            <span className="text-steel">•</span>
            <span className="text-xs text-ash">
              {sprint.status === 'NOT_STARTED'
                ? 'Pending Start'
                : sprint.isFinalized
                ? 'Concluded'
                : `Day ${sprint.currentDay} in progress`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-lilac-white">
            {sprint.name}
          </h2>
          <p className="text-sm text-ash mt-1">
            {sprint.status === 'NOT_STARTED'
              ? 'Tracking has not started yet. When the admin starts it, automatic daily PR tracking begins.'
              : sprint.isFinalized
              ? 'Tracking officially ended by admin. Standings and credits are permanently frozen.'
              : `Automatic PR tracking is active. PRs update automatically at ${sprint.dailyUpdateTime || '00:00'} UTC everyday.`}
          </p>
        </div>

        {/* Tracking Status Pill & Admin Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {sprint.status === 'NOT_STARTED' ? (
            <div className="px-3 py-1.5 rounded-full bg-deep-indigo border border-white/10 text-xs font-medium text-ash">
              <span>NOT STARTED</span>
            </div>
          ) : sprint.isFinalized ? (
            <div className="badge-pill px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-lavender-accent">
              <Lock className="w-3.5 h-3.5" />
              <span>FINAL LEADERBOARD LOCKED</span>
            </div>
          ) : sprint.status === 'ACTIVE' ? (
            <div className="px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TRACKING (DAY {sprint.currentDay})</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center gap-2 text-xs font-medium text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>TRACKING PAUSED</span>
            </div>
          )}

          {/* Manual Run Daily Sync trigger */}
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={onSyncDaily}
              disabled={isSyncing}
              className="btn-secondary !text-xs !py-1.5 !px-3 disabled:opacity-40"
              title="Run today's daily PR calculation now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-lavender-accent ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Calculating PRs...' : 'Run Daily Update Now'}</span>
            </button>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {sprint.status === 'NOT_STARTED' ? (
                <button
                  onClick={onStartSprint}
                  className="btn-primary !text-xs !py-1.5 !px-3 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Tracking Event</span>
                </button>
              ) : !sprint.isFinalized ? (
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
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Automatic Ingestion Highlight Callout */}
      <div className="mt-4 p-3.5 rounded-btn bg-deep-indigo/60 border border-lavender-accent/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-zinc-300">
            <strong>Automatic PR Calculation:</strong> Pull requests across all repositories for registered contributors are evaluated daily at{' '}
            <span className="text-white font-medium">{sprint.dailyUpdateTime || '00:00'} UTC</span>.
          </span>
        </div>

        {timeRemaining && (
          <div className="flex-shrink-0 px-2.5 py-1 rounded bg-midnight-surface border border-white/10 text-ash text-[11px] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-lavender-accent" />
            <span>Next update in: <strong className="text-lilac-white font-mono">{timeRemaining}</strong></span>
          </div>
        )}
      </div>

      {/* Dynamic Sprint Timeline Progression */}
      {sprint.status !== 'NOT_STARTED' && (
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs text-fog mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-lavender-accent" />
              <span>
                Started:{' '}
                {sprint.startDate
                  ? new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'N/A'}
                {sprint.endDate && ` • Ended: ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </span>
            </div>
            <span>
              {sprint.isFinalized
                ? `Total Duration: ${sprint.currentDay} Days`
                : `Currently on Day ${sprint.currentDay}`}
            </span>
          </div>

          {/* Dynamic Day Step Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {dynamicDays.map((day) => {
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
                  <div className="flex items-center justify-between mb-1">
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
                  <div className="text-[11px] text-fog">
                    {isFinished ? 'PRs Graded' : isToday ? 'Live Syncing' : 'Upcoming'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
