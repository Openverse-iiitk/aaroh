import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { User, Sprint } from '../types';
import { GitPullRequest, Trophy, Shield, Sparkles, LogOut, Github, PlusCircle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  sprint?: Sprint;
  onOpenAuth: () => void;
  onOpenSubmitPr: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  sprint,
  onOpenAuth,
  onOpenSubmitPr,
  onLogout
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="sticky top-4 z-50 w-full px-4 flex justify-center">
      <nav className="nav-pill flex items-center justify-between gap-4 px-5 py-2 w-full max-w-5xl transition-all">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group text-decoration-none">
          <div className="w-8 h-8 rounded-full bg-deep-indigo flex items-center justify-center border border-lavender-accent/30 group-hover:border-lavender-accent transition-colors shadow-badge">
            <Sparkles className="w-4 h-4 text-lavender-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-medium tracking-tight text-lilac-white group-hover:text-pearl transition-colors flex items-center gap-1.5">
              Reflect<span className="text-cosmic-gradient font-normal">PR</span>
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <div className="hidden md:flex items-center gap-6 text-[15px]">
          <Link
            to="/"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/' ? 'text-lilac-white font-medium' : 'text-fog hover:text-lilac-white'
            }`}
          >
            Overview
          </Link>

          <Link
            to="/leaderboard"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/leaderboard' ? 'text-lilac-white font-medium' : 'text-fog hover:text-lilac-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-lavender-accent/70" />
            Leaderboard
          </Link>

          <Link
            to="/pull-requests"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/pull-requests' ? 'text-lilac-white font-medium' : 'text-fog hover:text-lilac-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-lavender-accent/70" />
            Pull Requests
          </Link>

          <Link
            to="/admin"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/admin' ? 'text-lilac-white font-medium' : 'text-fog hover:text-lilac-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-lavender-accent" />
            Admin Review
            {user?.role === 'admin' && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-iris/30 text-lavender-accent border border-iris/50 font-medium">
                Admin
              </span>
            )}
          </Link>
        </div>

        {/* Sprint Status Indicator Pill */}
        {sprint && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-void-canvas border border-white/5 text-xs text-ash">
            <span
              className={`w-2 h-2 rounded-full ${
                sprint.isFinalized
                  ? 'bg-lavender-accent shadow-[0_0_8px_rgba(147,130,255,0.8)]'
                  : sprint.status === 'ACTIVE'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {sprint.isFinalized
                ? 'Final Leaderboard Locked'
                : `Day ${sprint.currentDay} of ${sprint.totalDays}`}
            </span>
          </div>
        )}

        {/* User Session & CTAs */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSubmitPr}
                disabled={sprint?.isFinalized}
                className="btn-secondary !text-xs !py-1.5 !px-2.5 hidden sm:inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={sprint?.isFinalized ? 'Sprint has ended' : 'Submit PR for scoring'}
              >
                <PlusCircle className="w-3.5 h-3.5 text-lavender-accent" />
                <span>Submit PR</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-7 h-7 rounded-full border border-lavender-accent/40 object-cover"
                />
                <span className="hidden sm:inline text-xs font-medium text-lilac-white">
                  @{user.username}
                </span>
                <button
                  onClick={onLogout}
                  className="text-fog hover:text-lilac-white p-1 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-primary !text-xs !py-1.5 !px-3.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
