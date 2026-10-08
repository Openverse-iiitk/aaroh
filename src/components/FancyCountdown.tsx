import React, { useState, useEffect } from 'react';
import { Sprint } from '../types';
import { Clock, Sparkles, AlertCircle, CheckCircle2, Play, Lock, ShieldCheck, Flame, GitPullRequest } from 'lucide-react';

interface FancyCountdownProps {
  sprint: Sprint;
}

export const FancyCountdown: React.FC<FancyCountdownProps> = ({ sprint }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
    totalSeconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isDue: false,
    totalSeconds: 0
  });

  useEffect(() => {
    if (!sprint.nextSyncAt || sprint.status !== 'ACTIVE' || sprint.isFinalized) {
      return;
    }

    const calculateTime = () => {
      const target = new Date(sprint.nextSyncAt!).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isDue: true,
          totalSeconds: 0
        });
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const days = Math.floor(totalSecs / (24 * 3600));
      const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isDue: false,
        totalSeconds: totalSecs
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [sprint.nextSyncAt, sprint.status, sprint.isFinalized]);

  // Daily cycle progress calculation (assuming 24h = 86400s per day cycle)
  const fullCycleSeconds = 24 * 3600;
  const remainingSeconds = Math.min(fullCycleSeconds, Math.max(0, timeLeft.totalSeconds));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((fullCycleSeconds - remainingSeconds) / fullCycleSeconds) * 100)));

  // Format with leading zero
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 mb-14 relative">
      {/* Outer ambient decorative glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"
      />

      <div className="relative rounded-2xl bg-[#0f0f13]/90 border border-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle background radial pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.25)]">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Daily Scoring Countdown
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-medium text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Ticker
                </span>
              </div>
              <h3 className="text-base font-medium text-white mt-0.5">
                Next PR Ingestion &amp; Calculation Round
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-400">
            <span className="block text-zinc-500 text-[11px]">Evaluation Window</span>
            <span className="font-mono text-zinc-200 font-medium">
              Every day at {sprint.dailyUpdateTime || '00:00'} UTC
            </span>
          </div>
        </div>

        {/* Main Countdown Display */}
        {sprint.status === 'NOT_STARTED' ? (
          <div className="py-10 text-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 mx-auto flex items-center justify-center text-zinc-400 mb-3">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            <h4 className="text-lg font-semibold text-white">Sprint Awaiting Start</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              The administrator has not started this event yet. Once active, the automated 24-hour daily timer begins.
            </p>
          </div>
        ) : sprint.isFinalized ? (
          <div className="py-10 text-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-blue-950 border border-blue-500/30 mx-auto flex items-center justify-center text-blue-400 mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-white">Event Concluded &amp; Standings Frozen</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              All daily evaluations are complete. The final podium champions have been immortalized on the leaderboard.
            </p>
          </div>
        ) : sprint.status === 'PAUSED' ? (
          <div className="py-10 text-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white">Daily Timer Paused</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              The sprint is temporarily paused by the administrators. PR scoring will resume once unpaused.
            </p>
          </div>
        ) : timeLeft.isDue ? (
          <div className="py-10 text-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-white">Ingestion In Progress!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              The daily timer reached zero. The automated scheduler is processing pull requests for Day {(sprint.currentDay || 1) + 1}.
            </p>
          </div>
        ) : (
          <div className="py-6 sm:py-8 relative z-10">
            {/* Number Blocks */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto">
              {/* Days Box (Shown if days > 0) */}
              {timeLeft.days > 0 && (
                <div className="flex flex-col items-center">
                  <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-b from-[#181820] to-[#121217] border border-white/10 flex items-center justify-center shadow-inner relative group hover:border-blue-500/40 transition-colors">
                    <span className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                      {pad(timeLeft.days)}
                    </span>
                    <span className="absolute top-1.5 right-2 text-[9px] font-mono text-zinc-600 uppercase">
                      D
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-2">
                    Days
                  </span>
                </div>
              )}

              {/* Hours Box */}
              <div className="flex flex-col items-center">
                <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-b from-[#181820] to-[#121217] border border-white/10 flex items-center justify-center shadow-inner relative group hover:border-blue-500/40 transition-colors">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                  <span className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                    {pad(timeLeft.hours)}
                  </span>
                  <span className="absolute top-1.5 right-2 text-[9px] font-mono text-zinc-600 uppercase">
                    H
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-2">
                  Hours
                </span>
              </div>

              {/* Minutes Box */}
              <div className="flex flex-col items-center">
                <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-b from-[#181820] to-[#121217] border border-white/10 flex items-center justify-center shadow-inner relative group hover:border-indigo-500/40 transition-colors">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
                  <span className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    {pad(timeLeft.minutes)}
                  </span>
                  <span className="absolute top-1.5 right-2 text-[9px] font-mono text-zinc-600 uppercase">
                    M
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-2">
                  Minutes
                </span>
              </div>

              {/* Seconds Box with Pulse */}
              <div className="flex flex-col items-center">
                <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-b from-[#1c1c24] to-[#141419] border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)] relative group">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                  <span className="font-mono text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    {pad(timeLeft.seconds)}
                  </span>
                  <span className="absolute top-1.5 right-2 text-[9px] font-mono text-blue-500 uppercase">
                    S
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block" />
                  Seconds
                </span>
              </div>
            </div>

            {/* Daily Cycle Progress Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Day {sprint.currentDay || 1} Cycle Elapsed</span>
                </span>
                <span className="font-mono text-white">{progressPercent}% complete</span>
              </div>
              
              <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer / Helper Note */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Eligible PRs opened before the deadline will be graded in this batch.</span>
          </div>
          <span className="text-zinc-500 font-mono">
            Timezone: UTC • Auto-reschedules nightly
          </span>
        </div>
      </div>
    </div>
  );
};
