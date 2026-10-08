import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  GitPullRequest,
  Trophy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  Award,
  Layers,
  Terminal,
  Zap,
  Globe,
  Users,
  Compass,
  FileCheck2,
  Github
} from 'lucide-react';

interface AboutPageProps {
  currentUser?: any;
  onOpenAuth?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ currentUser, onOpenAuth }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The Open Source Tracking Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          About <span className="text-[#2eff7b]">HackAaroh</span> PR Tracker
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          HackAaroh is an open-source sprint where meaningful pull requests earn points, recognition, and rewards.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {currentUser ? (
            <Link to="/leaderboard" className="btn-primary !px-5 !py-2.5">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Explore Standings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary !px-5 !py-2.5">
              <Github className="w-4 h-4" />
              <span>Join Sprint with GitHub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <Link to="/faq" className="btn-secondary !px-5 !py-2.5">
            <Compass className="w-4 h-4 text-indigo-300" />
            <span>Read Sprint FAQ</span>
          </Link>
        </div>
      </div>

      {/* Mission & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0e110f]/80 border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Our Mission</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Open source powers the modern digital world, yet recognizing contributors fairly is often broken by vanity metrics like sheer commit counts or spammy documentation PRs.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              HackAaroh replaces vanity metrics with an objective <strong>4-pillar evaluation rubric</strong> (Quality, Complexity, Impact, Tests) to honor engineers who solve hard problems and deliver resilient code.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Merit-first, community-driven evaluation</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e110f]/80 border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Contribute Anywhere</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Submit pull requests from any public GitHub repository. You are not limited to a preset list of projects.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              We find your public pull requests automatically, and you can also submit one directly for review.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-xs text-indigo-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>1-Click GitHub authentication &amp; zero-friction sync</span>
          </div>
        </div>
      </div>

      {/* How The Architecture Works */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Under The Hood
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1 tracking-tight">
            How The PR Tracking Engine Works
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5">
            Four streamlined steps connecting your GitHub activity to the live podium.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#111412] border border-white/10 hover:border-indigo-500/30 transition-all">
            <span className="text-xs font-mono font-bold text-indigo-400">01</span>
            <h3 className="text-sm font-semibold text-white mt-2 mb-1">GitHub OAuth Connect</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in with your GitHub account. Your username is linked to the event roster securely without sharing personal credentials.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111412] border border-white/10 hover:border-purple-500/30 transition-all">
            <span className="text-xs font-mono font-bold text-purple-400">02</span>
            <h3 className="text-sm font-semibold text-white mt-2 mb-1">Automated Discovery</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We find your public pull requests and collect the details reviewers need, such as the repository, changes, commits, and merge status.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111412] border border-white/10 hover:border-pink-500/30 transition-all">
            <span className="text-xs font-mono font-bold text-pink-400">03</span>
            <h3 className="text-sm font-semibold text-white mt-2 mb-1">Daily Rubric Scoring</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Evaluators review pull requests nightly against four criteria up to 100 points, preventing spam and rewarding architectural depth.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111412] border border-white/10 hover:border-amber-500/30 transition-all">
            <span className="text-xs font-mono font-bold text-amber-400">04</span>
            <h3 className="text-sm font-semibold text-white mt-2 mb-1">00:00 UTC Standings</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Scores calculate nightly at 00:00 UTC. The live leaderboard and countdown HUD update in real time toward the final sprint podium.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars Scoring Deep Dive */}
      <div className="p-8 rounded-2xl bg-[#0c0f0d]/80 border border-white/10 backdrop-blur-xl space-y-6">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Evaluation Standard
          </span>
          <h2 className="text-2xl font-semibold text-white mt-1">The 100-Point Scoring Rubric</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Each evaluated pull request receives up to 100 points divided equally among four core dimensions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#181b19] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">1. Code Quality &amp; Idiomatic Design</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">25 pts</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Clean modular structure, adherence to project conventions, self-documenting code, type safety, and defensive error boundaries.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181b19] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">2. Technical Complexity &amp; Architecture</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">25 pts</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Depth of problem solved, algorithmic efficiency, state handling, concurrency management, and difficult refactoring.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181b19] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">3. Real-World Project Impact</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">25 pts</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Closing high-priority issues, user-facing utility, performance optimizations, and reducing maintainer technical debt.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181b19] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">4. Testing &amp; Regression Resilience</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">25 pts</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Comprehensive unit/integration test coverage, edge cases, robust mocking, and verification that builds and CI workflows pass.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-8 sm:p-10 rounded-2xl bg-[#0b0f0d]/80 border border-white/10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Ready to Make an Impact?</h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Join hundreds of developers making meaningful contributions, earning recognition, and learning production-grade engineering practices.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {currentUser ? (
            <Link to="/pull-requests" className="btn-primary !px-5 !py-2.5">
              <GitPullRequest className="w-4 h-4" />
              <span>View Submitted PRs</span>
            </Link>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary !px-5 !py-2.5">
              <Github className="w-4 h-4" />
              <span>Connect GitHub &amp; Start Sprint</span>
            </button>
          )}
          <Link to="/leaderboard" className="btn-secondary !px-5 !py-2.5">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Check Current Leaderboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
