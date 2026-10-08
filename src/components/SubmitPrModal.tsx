import React, { useState } from 'react';
import { X, GitPullRequest, Plus, ExternalLink, Check } from 'lucide-react';
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
  const [repo, setRepo] = useState('');
  const [title, setTitle] = useState('feat: optimize reactive fiber work reconciliation loop');
  const [description, setDescription] = useState('Enhanced async reconciliation batching, reducing redundant tree traversals by 40%.');
  const [url, setUrl] = useState('');
  const [additions, setAdditions] = useState(140);
  const [deletions, setDeletions] = useState(18);
  const [commitsCount, setCommitsCount] = useState(2);
  const [tagsInput, setTagsInput] = useState('feature, tanstack, ui');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !repo) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const cleanRepo = repo
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/pull\/\d+.*$/i, '')
      .replace(/\/$/, '');

    await onSubmitPr({
      repo: cleanRepo,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      additions: Number(additions),
      deletions: Number(deletions),
      commitsCount: Number(commitsCount),
      tags: tags.length ? tags : ['contribution']
    });

    setTitle('');
    setDescription('');
    setUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel-glass-elevated w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 relative border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-fog hover:text-lilac-white p-1 rounded-btn hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-xs font-medium uppercase tracking-wider text-lavender-accent">
          <GitPullRequest className="w-4 h-4" />
          <span>Submit a Contribution or Project</span>
        </div>

        <h3 className="text-xl font-medium text-lilac-white">
          Submit Work for Admin Review
        </h3>
        <p className="text-xs text-ash mt-1">
          Submit an open-source pull request OR a complete project repository. Evaluators will inspect your GitHub code and assign rubric credit scores.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1">
              GitHub Repository or Project Link *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. facebook/react or https://github.com/your-org/your-repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full p-2.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
            />
            <p className="text-[11px] text-ash mt-1.5">You can enter either &ldquo;owner/repo&rdquo; or paste the full GitHub repository URL.</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1">
              Contribution or Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. feat: Realtime collaborative canvas or project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent placeholder:text-steel"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              placeholder="Summarize key features, architecture, bug fixes, or performance gains."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent placeholder:text-steel resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1">
              Specific PR URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://github.com/owner/repo/pull/123 (leave empty if submitting entire repo)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent placeholder:text-steel"
            />
            <p className="text-[11px] text-ash mt-1">If no PR exists, leave this empty. Evaluators will review your repository directly.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-fog block mb-1">
                Lines Added (+)
              </label>
              <input
                type="number"
                min="0"
                value={additions}
                onChange={(e) => setAdditions(Number(e.target.value))}
                className="w-full p-2 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-fog block mb-1">
                Lines Deleted (-)
              </label>
              <input
                type="number"
                min="0"
                value={deletions}
                onChange={(e) => setDeletions(Number(e.target.value))}
                className="w-full p-2 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-fog block mb-1">
                Commits
              </label>
              <input
                type="number"
                min="1"
                value={commitsCount}
                onChange={(e) => setCommitsCount(Number(e.target.value))}
                className="w-full p-2 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="ui, tanstack, bugfix"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2.5 rounded-btn bg-midnight-surface border border-white/10 text-xs text-lilac-white focus:outline-none focus:border-lavender-accent placeholder:text-steel"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-ghost !text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title}
              className="btn-primary !text-xs !py-2 !px-4"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit to Review Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
