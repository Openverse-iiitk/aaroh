import React from 'react';
import { Sparkles, Trophy, GitPullRequest, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Sprint } from '../types';

interface HeroProps {
  sprint?: Sprint;
  onOpenSubmitPr: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  sprint,
  onOpenSubmitPr,
  onOpenAuth,
  isAuthenticated
}) => {
  return (
    <section className="relative pt-12 pb-16 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
      {/* Decorative Aurora backdrop glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-iris/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* AI Badge Pill */}
      <div className="badge-pill inline-flex items-center gap-2 px-4 py-1.5 mb-6">
        <Sparkles className="w-3.5 h-3.5 text-lavender-accent" />
        <span className="text-[13px] font-medium text-lilac-white tracking-wide uppercase">
          7-Day Open Source Tracking Sprint
        </span>
      </div>

      {/* Signature AeonikPro medium display headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-lilac-white leading-[1.14] mb-6">
        Track GitHub pull requests across a{' '}
        <span className="text-cosmic-gradient">starlit sprint</span>
      </h1>

      {/* Subtitle in Inter V 18px color Ash */}
      <p className="text-base sm:text-lg text-ash max-w-2xl font-normal leading-relaxed mb-8">
        Connect your GitHub account to record daily contributions. Admins manually review
        each pull request and award credit scores, culminating in the final leaderboard podium.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/leaderboard" className="btn-primary !px-5 !py-2.5">
          <Trophy className="w-4 h-4 text-white" />
          <span>View Live Leaderboard</span>
        </Link>

        {isAuthenticated ? (
          <button
            onClick={onOpenSubmitPr}
            disabled={sprint?.isFinalized}
            className="btn-secondary !px-4 !py-2.5 disabled:opacity-50"
          >
            <GitPullRequest className="w-4 h-4 text-lavender-accent" />
            <span>Submit Pull Request</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-secondary !px-4 !py-2.5"
          >
            <GitPullRequest className="w-4 h-4 text-lavender-accent" />
            <span>Connect GitHub</span>
          </button>
        )}

        <Link
          to="/admin"
          className="btn-ghost !text-sm flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-lavender-accent/80" />
          <span>Admin Review Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Aurora Divider */}
      <div className="w-full max-w-xl my-10 aurora-divider" />
    </section>
  );
};
