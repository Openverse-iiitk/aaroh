import React from 'react';
import { GitPullRequest, Trophy, ShieldCheck, ArrowRight, Github } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Sprint } from '../types';

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
  return (
    <section className="pt-16 pb-12 flex flex-col items-center text-center px-4 max-w-3xl mx-auto">
      {/* Event Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded">
        <span>HackAaroh Sprint Event</span>
        <span className="text-zinc-600">•</span>
        <span>Daily PR Evaluation</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-5 leading-tight">
        Open Source PR Tracking &amp; Leaderboard
      </h1>

      {/* Clear, direct description - no jargon */}
      <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-normal leading-relaxed mb-8">
        Connect your GitHub account to participate. Pull requests authored across
        repositories are tracked and scored daily. Reviewers evaluate code quality
        and award points towards the event leaderboard.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isAuthenticated ? (
          isAdmin ? (
            <Link to="/admin" className="btn-primary">
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          ) : (
            <Link to="/leaderboard" className="btn-primary">
              <Trophy className="w-4 h-4" />
              <span>Go to Leaderboard &amp; Submitted PRs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )
        ) : (
          <>
            <button
              onClick={onOpenAuth}
              className="btn-primary"
            >
              <Github className="w-4 h-4" />
              <span>Sign in with GitHub</span>
            </button>

            <Link to="/leaderboard" className="btn-secondary">
              <Trophy className="w-4 h-4" />
              <span>View Leaderboard</span>
            </Link>
          </>
        )}
      </div>
    </section>
  );
};
