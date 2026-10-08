import React, { useState, useEffect } from 'react';
import { Shield, Key, ArrowRight, Check, Copy, AlertTriangle, Lock } from 'lucide-react';
import { adminSecretLogin } from '../api/client';

export const SecretAdminPage: React.FC = () => {
  const [passkey, setPasskey] = useState('');
  const [username, setUsername] = useState('Vijay-1710');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);

  // Auto-authenticate if key is provided in query params (?key=...)
  useEffect(() => {
    if (typeof window === 'undefined' || autoAttempted) return;
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('key') || params.get('passkey');
    const userParam = params.get('user') || params.get('username') || 'Vijay-1710';

    if (keyParam) {
      setPasskey(keyParam);
      setUsername(userParam);
      setAutoAttempted(true);
      setLoading(true);
      adminSecretLogin(keyParam, userParam)
        .then(() => {
          window.location.href = '/admin';
        })
        .catch((err) => {
          setLoading(false);
          setError(err.message || 'Invalid secret key in URL');
        });
    }
  }, [autoAttempted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await adminSecretLogin(passkey.trim(), username.trim() || 'Vijay-1710');
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Invalid secret passkey');
      setLoading(false);
    }
  };

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/secret-admin?key=${encodeURIComponent(passkey || 'aaroh-admin-2026')}`
    : 'https://hackaaroh-main.vercel.app/secret-admin?key=aaroh-admin-2026';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#131614] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 mx-auto flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Organizer Secret Access
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Private portal for HackAaroh event organizers. Access the dashboard, manage sprint configuration, and review submissions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Secret Admin Passkey</span>
            </label>
            <input
              type="password"
              placeholder="Enter secret key (e.g. aaroh-admin-2026)"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full bg-[#0a0d0b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 font-mono transition-colors"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-lavender-accent" />
              <span>Admin Username / Handle</span>
            </label>
            <input
              type="text"
              placeholder="Vijay-1710"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0a0d0b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !passkey.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2eff7b] hover:bg-[#6bffa1] disabled:opacity-50 text-[#03140a] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Shareable Link Helper Card */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="text-[11px] font-medium text-zinc-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-zinc-400">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Shareable Direct Link (Organizers Only):</span>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0d0b] p-2 rounded-lg border border-white/5">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="bg-transparent text-[11px] text-zinc-400 font-mono w-full focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center gap-1 transition-colors flex-shrink-0 border border-indigo-500/30"
              title="Copy link to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            Anyone opening this link with the key will automatically authenticate and access the Admin panel. Share privately with authorized organizers.
          </p>
        </div>
      </div>
    </div>
  );
};
