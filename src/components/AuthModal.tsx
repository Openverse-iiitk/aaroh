import React, { useState } from 'react';
import { X, Github, Shield, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
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
        setOauthError(data.message || 'GitHub OAuth App is not configured in .env. Please use the quick 1-click profiles below or enter your GitHub handle.');
      }
    } catch (err) {
      setOauthError('Unable to connect to OAuth service. Use quick demo login below.');
    }
  };

  const demoAccounts = [
    {
      username: 'admin-starlit',
      name: 'Admin Chief (Lead Reviewer)',
      role: 'admin' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      badge: 'Admin Access',
      desc: 'Full review privileges: grade PRs, pause/resume tracking, end sprint.'
    },
    {
      username: 'manav-codes',
      name: 'Manav Sharma',
      role: 'contributor' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badge: 'Contributor',
      desc: 'Active sprint participant with 3 submitted PRs and 175 credits.'
    },
    {
      username: 'sarah-dev',
      name: 'Sarah Chen',
      role: 'contributor' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      badge: 'Contributor',
      desc: 'TypeScript specialist with 2 merged PRs and 166 credits.'
    },
    {
      username: 'alex-rustacean',
      name: 'Alex Rivera',
      role: 'contributor' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      badge: 'Contributor',
      desc: 'Top single-PR score (92 pts) for database query performance.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel-glass-elevated w-full max-w-lg p-6 relative border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-fog hover:text-lilac-white p-1 rounded-btn hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-full bg-deep-indigo border border-lavender-accent/30 mx-auto flex items-center justify-center mb-3">
            <Github className="w-5 h-5 text-lilac-white" />
          </div>
          <h3 className="text-2xl font-medium text-lilac-white">
            Connect to Reflect<span className="text-cosmic-gradient">PR</span>
          </h3>
          <p className="text-xs sm:text-sm text-ash mt-1 max-w-sm mx-auto">
            Log in with your GitHub account to track your weekly pull request contributions and credits.
          </p>
        </div>

        {/* Primary GitHub OAuth button */}
        <button
          onClick={handleOAuthLogin}
          className="w-full py-2.5 px-4 rounded-btn bg-[#24292e] hover:bg-[#2f363d] text-white border border-white/10 text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm mb-4"
        >
          <Github className="w-4 h-4" />
          <span>Authenticate with GitHub OAuth</span>
        </button>

        {oauthError && (
          <div className="p-2.5 rounded-btn bg-deep-indigo/60 border border-lavender-accent/30 text-[11px] text-ash mb-4">
            {oauthError}
          </div>
        )}

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-fog">
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
              className="w-full p-2.5 rounded-btn bg-midnight-surface hover:bg-deep-indigo border border-white/5 hover:border-lavender-accent/40 text-left flex items-center justify-between gap-3 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={account.avatarUrl}
                  alt={account.username}
                  className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-lilac-white group-hover:text-pearl truncate">
                      {account.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      account.role === 'admin'
                        ? 'bg-iris/30 text-lavender-accent border border-iris/50'
                        : 'bg-white/5 text-fog'
                    }`}>
                      {account.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-fog truncate">@{account.username}</p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-fog group-hover:text-lavender-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Custom Username Input */}
        <div className="pt-3 border-t border-white/5">
          <label className="text-[11px] uppercase tracking-wider text-fog block mb-1.5">
            Or log in as any custom GitHub handle:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. octocat"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white placeholder:text-steel focus:outline-none focus:border-lavender-accent"
            />
            <select
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-ash focus:outline-none"
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
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
