import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { User, Sprint } from '../types';
import { GitPullRequest, Trophy, Shield, LogOut, Github, ShieldCheck, Info, HelpCircle } from 'lucide-react';
import { ReflectLogo } from './ReflectLogo';

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
    <header className="sticky top-0 z-40 w-full border-b border-indigo-500/15 bg-[#0a0815]/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
          <div className="group-hover:scale-105 transition-transform flex items-center justify-center">
            <ReflectLogo size={32} />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1">
            Reflect<span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent font-medium">PR</span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/leaderboard"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/leaderboard' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Leaderboard</span>
          </Link>

          <Link
            to="/pull-requests"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/pull-requests' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-zinc-400" />
            <span>Submitted PRs</span>
          </Link>

          <Link
            to="/about"
            className={`hidden sm:flex transition-colors items-center gap-1.5 ${
              currentPath === '/about' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>About</span>
          </Link>

          <Link
            to="/faq"
            className={`hidden sm:flex transition-colors items-center gap-1.5 ${
              currentPath === '/faq' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>FAQ</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-400" />
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
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-btn bg-[#161326] border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                <img
                  src={user.role === 'admin' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' : user.avatarUrl}
                  alt={user.role === 'admin' ? 'HackAaroh Admin' : user.username}
                  className="w-5 h-5 rounded-full object-cover border border-indigo-400/30"
                />
                <span className="text-xs font-medium text-white">
                  {user.role === 'admin' ? '@hackaaroh' : `@${user.username}`}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    HackAaroh Admin
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
