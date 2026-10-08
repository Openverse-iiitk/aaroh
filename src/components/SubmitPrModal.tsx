import React, { useState, useMemo } from 'react';
import { X, GitPullRequest, ExternalLink, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import { User, Sprint } from '../types';

interface SubmitPrModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  sprint?: Sprint;
  onSubmitPr: (payload: {
    repo: string;
    title: string;
    description: string;
    url: string;
    additions: number;
    deletions: number;
    commitsCount: number;
    tags: string[];
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const SubmitPrModal: React.FC<SubmitPrModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sprint,
  onSubmitPr,
  isSubmitting
}) => {
  const [prUrl, setPrUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Validate PR link in real-time
  const prAnalysis = useMemo(() => {
    const trimmed = prUrl.trim();
    if (!trimmed) return null;

    const prRegex = /(?:https?:\/\/github\.com\/)?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i;
    const match = trimmed.match(prRegex);

    if (match) {
      return {
        isValid: true,
        owner: match[1],
        repoName: match[2],
        fullRepo: `${match[1]}/${match[2]}`,
        prNumber: parseInt(match[3], 10),
        canonicalUrl: `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}`
      };
    }

    // Check if user entered a plain repository link without /pull/
    const repoOnlyRegex = /(?:https?:\/\/github\.com\/)?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/)?$/i;
    const repoMatch = trimmed.match(repoOnlyRegex);
    if (repoMatch) {
      return {
        isValid: false,
        isRepoOnly: true,
        fullRepo: `${repoMatch[1]}/${repoMatch[2]}`
      };
    }

    return { isValid: false, isRepoOnly: false };
  }, [prUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!prAnalysis || !prAnalysis.isValid) {
      setSubmissionError('Please provide a valid GitHub Pull Request link with a PR number (e.g. https://github.com/owner/repo/pull/123). Plain repository links cannot be submitted.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await onSubmitPr({
        repo: prAnalysis.fullRepo!,
        title: title.trim() || `PR #${prAnalysis.prNumber}: Contribution to ${prAnalysis.fullRepo}`,
        description: description.trim(),
        url: prAnalysis.canonicalUrl!,
        additions: 0,
        deletions: 0,
        commitsCount: 1,
        tags: tags.length ? tags : ['contribution']
      });

      setPrUrl('');
      setTitle('');
      setDescription('');
      setSubmissionError(null);
      onClose();
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit pull request to evaluation queue');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 rounded-2xl bg-[#131614] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <GitPullRequest className="w-4 h-4" />
          <span>Verified GitHub Pull Request Submission</span>
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          Submit Pull Request for Evaluation
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Submit a live pull request that you authored on any public GitHub repository. Our automated system will verify your contribution directly via the GitHub API.
        </p>

        {submissionError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs mt-4 flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-300 mb-0.5">Submission Rejected</span>
              {submissionError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1.5 flex items-center justify-between">
              <span>GitHub Pull Request URL *</span>
              <span className="text-[11px] font-normal text-zinc-400">Must include /pull/NUMBER</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://github.com/owner/repository/pull/123"
              value={prUrl}
              onChange={(e) => {
                setPrUrl(e.target.value);
                setSubmissionError(null);
              }}
              className="w-full p-2.5 rounded-xl bg-[#0a0d0b] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400 font-mono transition-colors"
              autoFocus
            />

            {/* Validation Feedback */}
            {prAnalysis && prAnalysis.isValid && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  Valid Pull Request detected: <strong className="font-mono">{prAnalysis.fullRepo} #{prAnalysis.prNumber}</strong>
                </span>
              </div>
            )}

            {prAnalysis && !prAnalysis.isValid && prAnalysis.isRepoOnly && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300">Plain repository URL detected:</strong>
                  HackAaroh requires a specific Pull Request URL. Please enter the full link to your pull request in this repository (e.g. <span className="font-mono text-white">https://github.com/{prAnalysis.fullRepo}/pull/123</span>).
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Contribution Title <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank to automatically fetch title from GitHub"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0a0d0b] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Description &amp; Notes <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Highlight key architecture improvements, bug fixes, or performance gains."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0a0d0b] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Tags <span className="text-zinc-400 font-normal">(Comma separated, optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. backend, algorithm, optimization, bugfix"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0a0d0b] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !prAnalysis?.isValid}
              className="py-2.5 px-5 rounded-xl bg-[#2eff7b] hover:bg-[#6bffa1] disabled:opacity-40 text-[#03140a] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Validating with GitHub...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Verified PR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
