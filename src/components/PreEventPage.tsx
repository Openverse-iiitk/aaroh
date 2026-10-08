import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Sparkles, Code2, GitPullRequest, Users, Check, Shield, ArrowRight } from 'lucide-react';
import { ShinyText } from './reactbits/ShinyText';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { FlipUnit } from './FlipUnit';
import { User, Sprint } from '../types';

interface PreEventPageProps {
  sprint?: Sprint;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  isAdmin?: boolean;
  onToggleLiveView?: () => void;
}

const STEP_CARDS = [
  {
    icon: Code2,
    tint: 'indigo',
    label: 'Step 01',
    title: 'Build in the open',
    body: 'An open-source event where contributors ship real work to real projects.',
    footer: 'Real projects, real impact'
  },
  {
    icon: GitPullRequest,
    tint: 'purple',
    label: 'Step 02',
    title: 'Learn by contributing',
    body: 'Pick a project, explore the code, and make your mark one change at a time.',
    footer: 'Hands-on learning'
  },
  {
    icon: Users,
    tint: 'pink',
    label: 'Step 03',
    title: 'Grow together',
    body: 'Meet fellow builders, share what you learn, and level up as a community.',
    footer: 'Community driven'
  }
];

const TINTS: Record<string, { icon: string; label: string; spot: string }> = {
  indigo: {
    icon: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    label: 'text-indigo-400',
    spot: 'rgba(46,255,123, 0.18)'
  },
  purple: {
    icon: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    label: 'text-purple-400',
    spot: 'rgba(46,255,123, 0.18)'
  },
  pink: {
    icon: 'border-pink-500/20 bg-pink-500/10 text-pink-400',
    label: 'text-pink-400',
    spot: 'rgba(46,255,123, 0.18)'
  }
};

export const PreEventPage: React.FC<PreEventPageProps> = ({
  currentUser,
  onToggleLiveView
}) => {
  // Official target start: October 9, 2026 00:00 IST
  const targetStartMs = new Date('2026-10-08T18:30:00.000Z').getTime();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isStarted: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: false
  });

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, targetStartMs - now);

      if (diff === 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true });
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isStarted: false
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetStartMs]);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="relative w-full flex-1 flex flex-col">

      {/* Admin Quick Jump Bar (if organizer is signed in) */}
      {isAdmin && (
        <div className="relative z-30 w-full bg-indigo-950/40 border-b border-indigo-500/20 py-2 px-4 text-center text-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Signed in as <strong className="text-white">HackAaroh Organizer</strong>
            </span>
            <div className="flex items-center gap-4">
              {onToggleLiveView && (
                <button
                  onClick={onToggleLiveView}
                  className="text-indigo-300 hover:text-white font-medium flex items-center gap-1 transition-colors underline-offset-2 hover:underline cursor-pointer"
                >
                  <span>Preview Live Tracker</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <Link
                to="/admin"
                className="text-emerald-400 hover:text-white font-medium flex items-center gap-1 transition-colors underline-offset-2 hover:underline"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-16 sm:pt-24 pb-16 max-w-4xl mx-auto space-y-6">
        {/* Openverse presents badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Openverse presents</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight text-white select-none">
          <ShinyText text="HackAaroh" speed={3} />
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
          Welcome to HackAaroh, the open-source event by Openverse. Get ready to contribute, collaborate, and build something that matters.
        </p>

        {/* Digital Split-flap Countdown Container */}
        <div className="w-full max-w-2xl rounded-3xl border border-indigo-500/25 bg-[#0b0f0d]/85 backdrop-blur-md p-5 sm:p-7 space-y-5 mt-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Event starts in</span>
          </div>

          <div className="h-px bg-white/10" />

          {timeLeft.isStarted ? (
            <div className="py-6 text-center">
              <span className="text-lg font-bold text-emerald-400">
                The event has officially started!
              </span>
            </div>
          ) : (
            <div className="flex items-start justify-center gap-2 sm:gap-4 my-2">
              {timeLeft.days > 0 && (
                <>
                  <FlipUnit val={String(timeLeft.days).padStart(2, '0')} label="Days" />
                  <div className="flex flex-col gap-2 pt-10 sm:pt-14 lg:pt-16">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                  </div>
                </>
              )}

              <FlipUnit val={String(timeLeft.hours).padStart(2, '0')} label="Hours" />
              <div className="flex flex-col gap-2 pt-10 sm:pt-14 lg:pt-16">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
              </div>

              <FlipUnit val={String(timeLeft.minutes).padStart(2, '0')} label="Minutes" />
              <div className="flex flex-col gap-2 pt-10 sm:pt-14 lg:pt-16">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
              </div>

              <FlipUnit val={String(timeLeft.seconds).padStart(2, '0')} label="Seconds" isHighlight />
            </div>
          )}
        </div>
      </section>

      {/* 3 Step Cards Grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24 grid gap-5 md:grid-cols-3 w-full">
        {STEP_CARDS.map((card) => {
          const tintConfig = TINTS[card.tint];
          const Icon = card.icon;

          return (
            <SpotlightCard
              key={card.label}
              spotlightColor={tintConfig.spot}
              className="p-6 flex flex-col justify-between group rounded-2xl border border-white/10 bg-[#131614]/90 shadow-xl"
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform ${tintConfig.icon}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${tintConfig.label}`}>
                  {card.label}
                </span>
                <h3 className="text-base font-semibold text-white mt-1 mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {card.body}
                </p>
              </div>

              <div className="pt-4 mt-5 border-t border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{card.footer}</span>
              </div>
            </SpotlightCard>
          );
        })}
      </section>
    </div>
  );
};
