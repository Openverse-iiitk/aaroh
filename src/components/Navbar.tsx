import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { User, Sprint } from '../types';
import { GitPullRequest, Trophy, Shield, LogOut, Github, ShieldCheck, Info, HelpCircle } from 'lucide-react';

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

  const targetStartMs = new Date('2026-10-08T18:30:00.000Z').getTime();
  const isPreEvent = (Date.now() < targetStartMs) || Boolean(sprint?.isUpcoming);
  const isAdmin = user?.role === 'admin';

  return (
    <header className="home-nav sticky top-0 z-40 w-full border-b border-white/10 bg-[#060507]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2eff7b]">
            <GitPullRequest className="w-4 h-4 text-[#03140a]" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight whitespace-nowrap">
            HackAaroh {!isPreEvent && <span className="text-zinc-400 font-medium hidden sm:inline">PR Tracker</span>}
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-4 sm:gap-5 text-sm min-w-0">
          {(!isPreEvent || isAdmin) && (
            <>
              <Link
                to="/leaderboard"
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath === '/leaderboard' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                <span>Leaderboard</span>
              </Link>

              <Link
                to="/pull-requests"
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath === '/pull-requests' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                <span className="hidden md:inline">Submitted PRs</span><span className="md:hidden">PRs</span>
              </Link>
            </>
          )}

          <Link
            to="/about"
            className={`flex transition-colors items-center gap-1.5 ${
              currentPath === '/about' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>About</span>
          </Link>

          <Link
            to="/faq"
            className={`flex transition-colors items-center gap-1.5 ${
              currentPath === '/faq' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>FAQ</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin' ? 'text-white font-medium' : 'text-indigo-400 hover:text-indigo-300'
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
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-btn bg-[#191c1a] border border-indigo-500/30">
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
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="btn-primary !text-xs !py-1.5 !px-3 shrink-0 whitespace-nowrap"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Sign in<span className="hidden sm:inline"> with GitHub</span></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
