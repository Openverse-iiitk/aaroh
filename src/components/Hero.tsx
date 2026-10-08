import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  Trophy, 
  ShieldCheck, 
  ArrowRight, 
  Github, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Compass, 
  Clock, 
  Flame, 
  Activity,
  Layers,
  Code2
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Sprint } from '../types';
import { ShinyText } from './reactbits/ShinyText';
import { FlipUnit } from './FlipUnit';

interface HeroProps {
  sprint?: Sprint;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  isAdmin?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  sprint,
  onOpenAuth,
  isAuthenticated,
  isAdmin = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
    totalSeconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isDue: false,
    totalSeconds: 0
  });

  useEffect(() => {
    if (!sprint?.nextSyncAt || sprint?.status !== 'ACTIVE' || sprint?.isFinalized) {
      return;
    }

    const updateTimer = () => {
      const target = new Date(sprint.nextSyncAt!).getTime();
      const diff = target - Date.now();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isDue: true, totalSeconds: 0 });
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isDue: false,
        totalSeconds: totalSecs
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [sprint?.nextSyncAt, sprint?.status, sprint?.isFinalized]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Daily cycle progress percentage
  const fullCycleSeconds = 24 * 3600;
  const remainingSeconds = Math.min(fullCycleSeconds, Math.max(0, timeLeft.totalSeconds));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((fullCycleSeconds - remainingSeconds) / fullCycleSeconds) * 100)));

  return (
    <section className="w-full relative flex flex-col items-center pt-8 pb-16">
      <div className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center text-center relative z-10">
        {/* TOP COUNTDOWN MISSION HUD - Split-flap 3D flip cards */}
      <div className="relative z-20 pointer-events-auto w-full max-w-[760px] mb-10 animate-fade-in">
        <div className="relative group overflow-hidden rounded-3xl border border-indigo-500/30 bg-[#070417]/50 backdrop-blur-xl p-4 sm:p-5 sm:px-6 shadow-[0_25px_60px_rgba(0,0,0,0.75),0_0_40px_rgba(147,130,255,0.25)]">
          {/* Subtle cosmic border glow */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50 pointer-events-none -z-10" />

          <div>
            {/* Top Header Row within the counter HUD */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-bold text-white tracking-wider uppercase text-[11px] sm:text-xs">
                  {sprint?.status === 'ACTIVE'
                    ? `Sprint Day ${sprint.currentDay || 1} • Ingestion Cycle Active`
                    : sprint?.isFinalized
                    ? 'Sprint Concluded • Standings Locked'
                    : 'Sprint Registration Open'}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                  {progressPercent}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Cutoff:</span>
                </span>
                <span className="font-mono text-white text-[11px] font-semibold bg-black/50 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  {sprint?.dailyUpdateTime || '00:00'} UTC Nightly
                </span>
              </div>
            </div>

            {/* Large Digital Counter Blocks (Hours, Minutes, Seconds) */}
            {sprint?.status === 'ACTIVE' && !sprint?.isFinalized ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-1.5 sm:gap-3.5 lg:gap-4.5 my-1.5 w-full">
                  {/* Hours 3D Flip Card */}
                  <FlipUnit val={pad(timeLeft.hours)} label="Hours" />

                  {/* Pulsing Colon Separator */}
                  <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-indigo-400/80 -mt-5 sm:-mt-7 animate-pulse select-none">
                    :
                  </span>

                  {/* Minutes 3D Flip Card */}
                  <FlipUnit val={pad(timeLeft.minutes)} label="Minutes" />

                  {/* Pulsing Colon Separator */}
                  <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-indigo-400/80 -mt-5 sm:-mt-7 animate-pulse select-none">
                    :
                  </span>

                  {/* Seconds 3D Flip Card (Highlighted with active tick glow) */}
                  <FlipUnit val={pad(timeLeft.seconds)} label="Seconds" isHighlight />
                </div>

                {/* Rich Cycle Progress Track & Metadata Bar */}
                <div className="pt-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 px-0.5 font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>24-Hour Cycle Window</span>
                    </span>
                    <span className="font-mono text-indigo-300">
                      {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s to scoring
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-zinc-900/90 border border-white/5 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                <span>
                  {sprint?.isFinalized
                    ? 'Standings are locked in permanently. Explore the final podium.'
                    : 'Countdown initiates automatically when sprint status is set to active.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Headline */}
      <div className="relative z-10 max-w-3xl mb-6">
        {/* Soft contrast scrim ensuring typography is razor sharp against vibrant black hole */}
        <div 
          aria-hidden="true"
          className="absolute -inset-x-8 -inset-y-6 bg-[radial-gradient(ellipse_at_center,rgba(3,0,20,0.7)_0%,rgba(3,0,20,0.35)_55%,transparent_75%)] pointer-events-none -z-10 rounded-full blur-lg" 
        />
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-5 leading-[1.12] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
          The Starlit GitHub Sprint &{' '}
          <ShinyText
            text="Live PR Leaderboard"
            className="text-4xl sm:text-6xl font-bold tracking-tight text-cosmic-gradient drop-shadow-[0_4px_24px_rgba(168,85,247,0.5)]"
          />
        </h1>

        <p className="text-sm sm:text-base text-zinc-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.98)]">
          Author pull requests across top open-source repositories. The ingestion engine discovers your commits, 
          evaluates them under a 4-pillar rubric (Quality, Complexity, Impact, Tests), and updates standings every night.
        </p>
      </div>

      {/* Action Buttons - Highest z-index with pointer-events-auto */}
      <div className="relative z-20 pointer-events-auto flex flex-wrap items-center justify-center gap-3.5 mb-10">
        {isAuthenticated ? (
          isAdmin ? (
            <>
              <Link to="/admin" className="btn-primary !px-6 !py-3 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
              <Link to="/leaderboard" className="btn-secondary !px-6 !py-3 text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>View Full Leaderboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/leaderboard" className="btn-primary !px-6 !py-3 text-sm">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Check My Standing</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
              <Link to="/pull-requests" className="btn-secondary !px-6 !py-3 text-sm">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />
                <span>Explore Tracked PRs</span>
              </Link>
            </>
          )
        ) : (
          <>
            <button
              onClick={onOpenAuth}
              className="btn-primary !px-6 !py-3 text-sm group"
            >
              <Github className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Sign in with GitHub to Compete</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-80 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link to="/leaderboard" className="btn-secondary !px-5 !py-3 text-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Explore Leaderboard</span>
            </Link>

            <Link to="/about" className="btn-secondary !px-5 !py-3 text-sm">
              <Compass className="w-4 h-4 text-indigo-300" />
              <span>Learn More</span>
            </Link>
          </>
        )}
      </div>

      {/* Feature Highlights Pills */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pt-3 border-t border-white/5 w-full max-w-2xl">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-Repository Ingestion</span>
        </div>
        <span className="text-zinc-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>4-Pillar Code Rubric (100 Pts)</span>
        </div>
        <span className="text-zinc-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Nightly 00:00 UTC Ticker</span>
        </div>
      </div>
    </div>
  </section>
);
};
