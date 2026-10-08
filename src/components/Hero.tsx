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
  // Official event start date: October 9, 2026 at 00:00 IST = 2026-10-08T18:30:00.000Z
  const eventStartTime = sprint?.startDate
    ? new Date(sprint.startDate).getTime()
    : new Date('2026-10-08T18:30:00.000Z').getTime();

  const [timerState, setTimerState] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUpcoming: boolean;
    computedDay: number;
    totalSeconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isUpcoming: true,
    computedDay: 1,
    totalSeconds: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const isUpcoming = now < eventStartTime;

      if (isUpcoming) {
        // Countdown to the event starting tomorrow (Oct 9, 00:00 IST)
        const diff = Math.max(0, eventStartTime - now);
        const totalSecs = Math.floor(diff / 1000);
        const days = Math.floor(totalSecs / (24 * 3600));
        const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        setTimerState({
          days,
          hours,
          minutes,
          seconds,
          isUpcoming: true,
          computedDay: 1,
          totalSeconds: totalSecs
        });
      } else {
        // Event is Live! Day 1, Day 2, Day 3 computed automatically from startDate
        const elapsedMs = now - eventStartTime;
        const currentDay = Math.floor(elapsedMs / (24 * 3600 * 1000)) + 1;

        // Daily evaluation target cutoff
        const nextMilestone = sprint?.nextSyncAt
          ? new Date(sprint.nextSyncAt).getTime()
          : eventStartTime + currentDay * 24 * 3600 * 1000;
        const diff = Math.max(0, nextMilestone - now);
        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        setTimerState({
          days: 0,
          hours,
          minutes,
          seconds,
          isUpcoming: false,
          computedDay: currentDay,
          totalSeconds: totalSecs
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [eventStartTime, sprint?.nextSyncAt]);

  const pad = (n: number) => n.toString().padStart(2, '0');

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
                  {timerState.isUpcoming
                    ? 'EVENT STARTS TOMORROW • OCTOBER 9TH'
                    : `DAY ${timerState.computedDay} • TRACKING LIVE & ACTIVE`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                  {timerState.isUpcoming ? 'COUNTDOWN TO LAUNCH' : `DAY ${timerState.computedDay}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{timerState.isUpcoming ? 'Event Kickoff:' : 'Daily Cutoff:'}</span>
                </span>
                <span className="font-mono text-white text-[11px] font-semibold bg-black/50 px-2 py-0.5 rounded border border-white/10 shadow-inner">
                  {timerState.isUpcoming ? 'Oct 9, 00:00 IST' : `${sprint?.dailyUpdateTime || '00:00'} UTC Nightly`}
                </span>
              </div>
            </div>

            {/* Countdown Sub-heading */}
            <div className="text-center mb-3">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-indigo-300 uppercase">
                {timerState.isUpcoming ? 'The Event Starts In' : `Day ${timerState.computedDay} Scoring Cutoff In`}
              </span>
            </div>

            {/* Large Digital Counter Blocks (Days/Hours, Minutes, Seconds) */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1.5 sm:gap-3.5 lg:gap-4.5 my-1.5 w-full">
                {timerState.days > 0 && (
                  <>
                    <FlipUnit val={pad(timerState.days)} label="Days" />
                    <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-indigo-400/80 -mt-5 sm:-mt-7 animate-pulse select-none">
                      :
                    </span>
                  </>
                )}

                <FlipUnit val={pad(timerState.hours)} label="Hours" />

                <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-indigo-400/80 -mt-5 sm:-mt-7 animate-pulse select-none">
                  :
                </span>

                <FlipUnit val={pad(timerState.minutes)} label="Minutes" />

                <span className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-indigo-400/80 -mt-5 sm:-mt-7 animate-pulse select-none">
                  :
                </span>

                <FlipUnit val={pad(timerState.seconds)} label="Seconds" isHighlight />
              </div>

              {/* Progress and status message */}
              <div className="pt-1.5 text-center text-xs text-zinc-400">
                {timerState.isUpcoming ? (
                  <span>
                    Get your GitHub account ready — automated PR tracking and project submissions open at midnight!
                  </span>
                ) : (
                  <span>
                    Daily evaluation running for Day {timerState.computedDay}. Pull requests are being graded by organizers.
                  </span>
                )}
              </div>
            </div>
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
          The Starlit GitHub Challenge &{' '}
          <ShinyText
            text="Live PR Leaderboard"
            className="text-4xl sm:text-6xl font-bold tracking-tight text-cosmic-gradient drop-shadow-[0_4px_24px_rgba(168,85,247,0.5)]"
          />
        </h1>

        <p className="text-sm sm:text-base text-zinc-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.98)]">
          Open pull requests from any public GitHub repository. We track your contributions, reviewers award points for meaningful work, and the leaderboard updates every night.
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
          <span>Any Public Repository</span>
        </div>
        <span className="text-zinc-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>4-Pillar Code Rubric (100 Pts)</span>
        </div>
        <span className="text-zinc-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Daily 00:00 UTC Update</span>
        </div>
      </div>
    </div>
  </section>
);
};
