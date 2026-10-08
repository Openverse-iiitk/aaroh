import React, { useEffect, useState } from 'react';
import { ShinyText } from '../components/reactbits/ShinyText';
import { InfoCard } from '../components/InfoCard';
import { FlipUnit } from '../components/FlipUnit';
import { Code2, GitBranch, Users, Sparkles } from 'lucide-react';

const highlights = [
  {
    icon: Code2,
    tint: 'indigo' as const,
    label: 'Step 01',
    title: 'Build in the open',
    body: 'An open-source event where contributors ship real work to real projects.',
    footer: 'Real projects, real impact',
  },
  {
    icon: GitBranch,
    tint: 'purple' as const,
    label: 'Step 02',
    title: 'Learn by contributing',
    body: 'Pick a project, explore the code, and make your mark one change at a time.',
    footer: 'Hands-on learning',
  },
  {
    icon: Users,
    tint: 'pink' as const,
    label: 'Step 03',
    title: 'Grow together',
    body: 'Meet fellow builders, share what you learn, and level up as a community.',
    footer: 'Community driven',
  },
];

// 9 Oct 2026, 12:00 AM (midnight) IST (UTC+05:30), fixed so every visitor counts down to the same moment
const EVENT_START = new Date('2026-10-09T00:00:00+05:30').getTime();

const Countdown: React.FC = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      // Re-sync to the next whole second so digits never skip or double-flip
      timer = setTimeout(tick, 1000 - (t % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const diff = Math.max(0, EVENT_START - now);
  if (diff === 0) {
    return <p className="text-lg font-semibold text-emerald-300">The event has started!</p>;
  }
  const days = Math.floor(diff / 86400000);
  const units = [
    ...(days > 0 ? [{ label: 'Days', value: days }] : []),
    { label: 'Hours', value: Math.floor(diff / 3600000) % 24 },
    { label: 'Minutes', value: Math.floor(diff / 60000) % 60 },
    { label: 'Seconds', value: Math.floor(diff / 1000) % 60 },
  ];

  return (
    <div className="w-full rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-[#140d33]/80 to-[#0a0618]/80 backdrop-blur-md p-5 sm:p-7 space-y-5 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Event starts in</span>
      </div>
      <div className="h-px bg-white/10" />
      <div className="flex items-start justify-center gap-2 sm:gap-5">
        {units.map(({ label, value }, i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className="flex flex-col gap-2 pt-10 sm:pt-14 lg:pt-16">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
              </div>
            )}
            <FlipUnit
              val={String(value).padStart(2, '0')}
              label={label}
              isHighlight={label === 'Seconds'}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => (
  <div className="relative w-full flex-1 flex flex-col">
    <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-20 max-w-4xl mx-auto space-y-6">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Openverse presents</span>
      </div>

      <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight">
        <ShinyText text="HackAaroh" />
      </h1>

      <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
        Welcome to HackAaroh, the open-source event by Openverse. Get ready to
        contribute, collaborate, and build something that matters.
      </p>

      <Countdown />
    </section>

    <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24 grid gap-5 md:grid-cols-3">
      {highlights.map((h) => (
        <InfoCard key={h.title} {...h} />
      ))}
    </section>
  </div>
);
