import React, { useState } from 'react';
import { X, Github, ArrowRight } from 'lucide-react';
import { fetchGitHubOAuthUrl } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMockUser: (username: string, role: 'admin' | 'contributor', name?: string, avatarUrl?: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSelectMockUser,
  isLoading
}) => {
  const [customUsername, setCustomUsername] = useState('');
  const [customRole, setCustomRole] = useState<'admin' | 'contributor'>('contributor');
  const [oauthError, setOauthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthLogin = async () => {
    try {
      const data = await fetchGitHubOAuthUrl();
      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        setOauthError(data.message || 'GitHub OAuth App is not configured in .env. See setup instructions or use test accounts below.');
      }
    } catch (err) {
      setOauthError('Unable to connect to OAuth service. You can use test login below.');
    }
  };

  const demoAccounts = [
    {
      username: 'admin-starlit',
      name: 'Admin Reviewer',
      role: 'admin' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      badge: 'Admin',
      desc: 'Full review privileges: grade PRs, manage sprint settings.'
    },
    {
      username: 'manav-codes',
      name: 'Manav Sharma',
      role: 'contributor' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badge: 'Contributor',
      desc: 'Registered participant with 3 tracked PRs.'
    },
    {
      username: 'sarah-dev',
      name: 'Sarah Chen',
      role: 'contributor' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      badge: 'Contributor',
      desc: 'TypeScript contributor with 2 merged PRs.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded bg-[#121215] border border-white/10 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded bg-[#18181b] border border-white/10 mx-auto flex items-center justify-center mb-3">
            <Github className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            Sign in to HackAaroh
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Authorize with GitHub to register for tracking and participate on the leaderboard.
          </p>
        </div>

        {/* Primary GitHub OAuth button */}
        <button
          onClick={handleOAuthLogin}
          className="w-full py-2.5 px-4 rounded bg-[#24292e] hover:bg-[#2f363d] text-white border border-white/15 text-xs font-medium flex items-center justify-center gap-2 transition-colors mb-2"
        >
          <Github className="w-4 h-4" />
          <span>Authenticate with GitHub OAuth</span>
        </button>

        <p className="text-[10px] text-zinc-500 text-center mb-3">
          OAuth Callback: <code className="text-zinc-400 font-mono select-all bg-black/40 px-1 py-0.5 rounded">https://hackaaroh-main.vercel.app/api/auth/github/callback</code>
        </p>

        {oauthError && (
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 mb-4">
            {oauthError}
          </div>
        )}

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-zinc-500">
            Or test with instant accounts
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Instant Profile Switcher */}
        <div className="space-y-2 mb-5">
          {demoAccounts.map((account) => (
            <button
              key={account.username}
              onClick={() => onSelectMockUser(account.username, account.role, account.name, account.avatarUrl)}
              disabled={isLoading}
              className="w-full p-2.5 rounded bg-[#18181b] hover:bg-[#202025] border border-white/5 hover:border-white/15 text-left flex items-center justify-between gap-3 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={account.avatarUrl}
                  alt={account.username}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate">
                      {account.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                      account.role === 'admin'
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {account.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">@{account.username}</p>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Custom Username Input */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1.5">
            Or log in as any GitHub username:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. torvalds"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded bg-[#18181b] border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <select
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value as any)}
              className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/10 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="contributor">Contributor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => {
                if (customUsername.trim()) {
                  onSelectMockUser(customUsername.trim(), customRole);
                }
              }}
              disabled={!customUsername.trim() || isLoading}
              className="btn-primary !text-xs !py-1.5 !px-3 disabled:opacity-40"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
