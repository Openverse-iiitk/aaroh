import React, { useState, useEffect } from 'react';
import { Sprint } from '../types';
import { Link } from '@tanstack/react-router';
import { Clock, Sparkles, ArrowRight, Flame } from 'lucide-react';

interface TopCountdownBannerProps {
  sprint?: Sprint;
}

export const TopCountdownBanner: React.FC<TopCountdownBannerProps> = ({ sprint }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isDue, setIsDue] = useState<boolean>(false);

  useEffect(() => {
    if (!sprint?.nextSyncAt || sprint?.status !== 'ACTIVE' || sprint?.isFinalized) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const target = new Date(sprint.nextSyncAt!).getTime();
      const diff = target - Date.now();

      if (diff <= 0) {
        setIsDue(true);
        setTimeLeft('00:00:00 (Ingesting...)');
        return;
      }

      setIsDue(false);
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sprint?.nextSyncAt, sprint?.status, sprint?.isFinalized]);

  if (!sprint || sprint.status !== 'ACTIVE' || sprint.isFinalized) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-indigo-950/80 border-b border-indigo-500/20 text-xs py-1.5 px-4 backdrop-blur-md relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Sprint Day Status */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span>DAY {sprint.currentDay} SPRINT</span>
            <span className="text-indigo-400/50">•</span>
            <span className="text-indigo-300 font-normal hidden sm:inline">
              Nightly PR Ingestion Cycle
            </span>
          </span>
        </div>

        {/* Center: Live Countdown Highlight */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-0.5 rounded-full border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-[11px] text-zinc-300 hidden md:inline">Next Evaluation In:</span>
          <span className="font-mono font-bold text-white tracking-wider text-[12px]">
            {timeLeft || 'Calculating...'}
          </span>
        </div>

        {/* Right: Quick Action Link */}
        <Link
          to="/leaderboard"
          className="text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors text-[11px] shrink-0"
        >
          <span className="hidden sm:inline">Live Standings</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
