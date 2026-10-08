import React, { useState } from 'react';
import { X, Github, AlertTriangle, ShieldCheck, GitPullRequest, Lock } from 'lucide-react';
import { fetchGitHubOAuthUrl } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  loginsPaused?: boolean;
  onSelectMockUser?: (username: string, role: 'admin' | 'contributor', name?: string, avatarUrl?: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  loginsPaused = false
}) => {
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleOAuthLogin = async () => {
    setIsRedirecting(true);
    setOauthError(null);
    try {
      const data = await fetchGitHubOAuthUrl();
      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        setIsRedirecting(false);
        setOauthError(data.message || 'GitHub OAuth App is not configured. Please contact event administrators.');
      }
    } catch (err) {
      setIsRedirecting(false);
      setOauthError('Unable to connect to GitHub authentication service. Please check your internet connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#131614] border border-white/10 relative shadow-[0_16px_50px_rgba(0,0,0,0.7)] text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#202321] border border-indigo-500/30 mx-auto flex items-center justify-center mb-3">
            <Github className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Sign in with GitHub
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Connect your official GitHub account to participate in HackAaroh, submit pull requests, and rank on the live leaderboard.
          </p>
        </div>

        {/* Logins Paused Alert */}
        {loginsPaused && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs mb-4 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-300 mb-0.5">Participant Logins Temporarily Paused</span>
              Event organizers have paused participant logins until kickoff on October 9. Stand by for the live start!
            </div>
          </div>
        )}

        {/* OAuth Error Alert */}
        {oauthError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{oauthError}</span>
          </div>
        )}

        {/* Primary GitHub OAuth action */}
        <button
          onClick={handleOAuthLogin}
          disabled={loginsPaused || isRedirecting}
          className={`w-full py-3 px-4 rounded-xl text-white border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg ${
            loginsPaused
              ? 'bg-zinc-800/60 border-white/5 text-zinc-500 cursor-not-allowed opacity-60'
              : 'bg-[#24292e] hover:bg-[#2f363d] border-white/20 hover:border-indigo-400/50'
          }`}
        >
          {loginsPaused ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Github className={`w-4 h-4 ${isRedirecting ? 'animate-spin' : ''}`} />
          )}
          <span>
            {loginsPaused
              ? 'Participant Logins Paused'
              : isRedirecting
              ? 'Redirecting to GitHub...'
              : 'Continue with GitHub'}
          </span>
        </button>

        {/* Key Information & Privacy Assurance */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-[11px] text-zinc-400">
          <div className="flex items-start gap-2">
            <GitPullRequest className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-200">Live PR Tracking:</strong> Automated PR tracking activates at October 9 event start.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-200">Public &amp; Read-Only:</strong> We only read your public GitHub profile and public contributions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
