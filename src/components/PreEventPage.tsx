import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Shield } from 'lucide-react';
import '../styles/home.css';
import { ReflectBlackHole } from './ReflectBlackHole';
import { PixelHeatmap } from './PixelHeatmap';
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
    label: 'Step 01',
    title: 'Build in the open',
    body: 'An open-source event where contributors ship real work to real projects.',
    footer: 'Real projects, real impact'
  },
  {
    label: 'Step 02',
    title: 'Learn by contributing',
    body: 'Pick a project, explore the code, and make your mark one change at a time.',
    footer: 'Hands-on learning'
  },
  {
    label: 'Step 03',
    title: 'Grow together',
    body: 'Meet fellow builders, share what you learn, and level up as a community.',
    footer: 'Community driven'
  }
];

const pad = (n: number) => n.toString().padStart(2, '0');

const DigitPair: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="mono flex gap-1" aria-hidden="true">
      <span className="clock-digit">{value[0]}</span>
      <span className="clock-digit">{value[1]}</span>
    </div>
    <span className="mono text-[10px] text-[var(--faint)] sm:text-xs">{label}</span>
  </div>
);

const Colon: React.FC = () => (
  <span className="mono pt-2 text-2xl text-[var(--faint)] sm:pt-3" aria-hidden="true">:</span>
);

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
    <div className="home-v3 w-full flex-1 overflow-hidden">
      {/* Original backdrop, tinted green */}
      <div className="bh-green">
        <ReflectBlackHole isFixed />
      </div>

      {/* Admin Quick Jump Bar (if organizer is signed in) */}
      {isAdmin && (
        <div className="layer border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-6">
            <p className="text-[var(--muted)]">
              Signed in as <span className="text-[var(--text)]">HackAaroh Organizer</span>
            </p>
            <div className="flex items-center gap-5">
              {onToggleLiveView && (
                <button type="button" onClick={onToggleLiveView} className="link inline-flex cursor-pointer items-center gap-1 text-sm">
                  Preview live tracker
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <Link to="/admin" className="link inline-flex items-center gap-1.5 text-sm">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Admin dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Hero ---------- */}
      <section className="layer mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="mono rise mb-8 text-xs tracking-[0.28em] text-[var(--accent)] sm:text-sm">
          &gt; OPENVERSE PRESENTS
        </p>

        <h1 className="sr-only">HackAaroh, the open source event by Openverse</h1>
        <PixelHeatmap label="HackAaroh Sprint" />

        <p className="rise rise-2 mt-10 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Welcome to HackAaroh, the open-source event by Openverse. Get ready to contribute, collaborate, and build something that matters.
        </p>

        {/* Countdown to kickoff */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="mono text-xs text-[var(--faint)]">Event starts in</p>
          {timeLeft.isStarted ? (
            <p className="mono text-lg font-semibold text-[var(--accent)]">The event has officially started!</p>
          ) : (
            <div
              role="timer"
              aria-label={`${timeLeft.days > 0 ? `${timeLeft.days} days ` : ''}${timeLeft.hours} hours ${timeLeft.minutes} minutes ${timeLeft.seconds} seconds until the event starts`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {timeLeft.days > 0 && (
                  <>
                    <DigitPair value={pad(timeLeft.days)} label="days" />
                    <Colon />
                  </>
                )}
                <DigitPair value={pad(timeLeft.hours)} label="hours" />
                <Colon />
                <DigitPair value={pad(timeLeft.minutes)} label="minutes" />
                <Colon />
                <DigitPair value={pad(timeLeft.seconds)} label="seconds" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- What to expect ---------- */}
      <section className="layer mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Get ready to contribute.</h2>
          <p className="mt-3 max-w-sm text-[var(--muted)]">
            Three things to look forward to when the event begins.
          </p>
        </div>
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {STEP_CARDS.map((card, i) => (
            <li key={card.label} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6">
              <span className="mono text-sm text-[var(--accent)]">{pad(i + 1)}</span>
              <div>
                <h3 className="text-lg font-medium">{card.title}</h3>
                <p className="mt-1.5 max-w-lg text-[var(--muted)]">{card.body}</p>
                <p className="mono mt-3 text-xs text-[var(--faint)]">{card.footer}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
