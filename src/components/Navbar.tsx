import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { User, Sprint } from '../types';
import { GitPullRequest, Trophy, Shield, LogOut, Github, ShieldCheck } from 'lucide-react';

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
  onLogout
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#121215]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-decoration-none">
          <div className="w-8 h-8 rounded bg-[#1f1f23] flex items-center justify-center border border-white/10">
            <GitPullRequest className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            HackAaroh <span className="text-zinc-400 font-normal">PR Tracker</span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            to="/leaderboard"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/leaderboard' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-zinc-400" />
            <span>Leaderboard</span>
          </Link>

          <Link
            to="/pull-requests"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/pull-requests' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-4 h-4 text-zinc-400" />
            <span>Submitted PRs</span>
          </Link>

          {user?.role === 'admin' ? (
            <Link
              to="/admin"
              className={`transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Admin</span>
            </Link>
          ) : (
            <Link
              to="/admin"
              className={`hidden sm:flex transition-colors items-center gap-1.5 ${
                currentPath === '/admin' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Status Indicator & User Session */}
        <div className="flex items-center gap-3">
          {sprint && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#18181b] border border-white/10 text-xs text-zinc-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  sprint.status === 'NOT_STARTED'
                    ? 'bg-zinc-500'
                    : sprint.isFinalized
                    ? 'bg-blue-400'
                    : 'bg-emerald-500'
                }`}
              />
              <span>
                {sprint.status === 'NOT_STARTED'
                  ? 'Pending Start'
                  : sprint.isFinalized
                  ? 'Concluded'
                  : `Day ${sprint.currentDay} Active`}
              </span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#18181b] border border-white/10">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-white">
                  @{user.username}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Admin
                  </span>
                )}
                <button
                  onClick={onLogout}
                  className="text-zinc-400 hover:text-white ml-1 p-0.5 rounded transition-colors"
                  title="Disconnect account"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-primary !text-xs !py-1.5 !px-3"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
