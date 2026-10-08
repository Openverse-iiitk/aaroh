import React from 'react';
import { Link } from '@tanstack/react-router';
import { InfoCard } from '../components/InfoCard';
import { Sparkles, Compass, Zap, Globe, Users, Code2 } from 'lucide-react';

const cards = [
  {
    icon: Zap,
    tint: 'indigo' as const,
    label: 'Mission',
    title: 'Our Mission',
    body: 'Open source powers the modern digital world. HackAaroh brings people together to learn, build, and give back to the projects they rely on every day.',
    footer: 'Learn, build, give back',
  },
  {
    icon: Globe,
    tint: 'purple' as const,
    label: 'Everyone',
    title: 'Open to Everyone',
    body: 'Whether you are writing your first line of code or maintaining a large project, there is a place for you at HackAaroh.',
    footer: 'All skill levels welcome',
  },
  {
    icon: Users,
    tint: 'pink' as const,
    label: 'Community',
    title: 'Community First',
    body: 'Aaroh is organised by Openverse, a community of builders who believe in learning together and sharing what we make.',
    footer: 'Organised by Openverse',
  },
  {
    icon: Code2,
    tint: 'amber' as const,
    label: 'Experience',
    title: 'Hands-on Experience',
    body: 'Work with real codebases, collaborate with other developers, and pick up practical engineering skills along the way.',
    footer: 'Real codebases, real skills',
  },
];

export const AboutPage: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-12">
    <div className="text-center max-w-3xl mx-auto space-y-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>The Event</span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
        About{' '}
        <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          HackAaroh
        </span>
      </h1>
      <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
        HackAaroh is the open-source event by Openverse, a place to start contributing, meet fellow
        builders, and grow together.
      </p>
      <div className="pt-2">
        <Link to="/faq" className="btn-secondary !px-5 !py-2.5">
          <Compass className="w-4 h-4 text-indigo-300" />
          <span>Read the FAQ</span>
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((c) => (
        <InfoCard key={c.title} {...c} />
      ))}
    </div>

  </div>
);
