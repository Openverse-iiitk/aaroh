import React, { useState, useEffect } from 'react';
import { PullRequest } from '../types';
import { X, ExternalLink, ShieldCheck, Check, Star, AlertCircle, FileCode, GitCommit, Plus, Minus } from 'lucide-react';
import { formatGithubPrUrl } from '../utils/github';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pr: PullRequest | null;
  onSubmitReview: (payload: {
    prId: string;
    creditScore: number;
    feedback: string;
    criteria: {
      quality: number;
      complexity: number;
      impact: number;
      testCoverage: number;
    };
    reviewStatus: 'REVIEWED' | 'REJECTED';
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  pr,
  onSubmitReview,
  isSubmitting
}) => {
  const [quality, setQuality] = useState(20);
  const [complexity, setComplexity] = useState(20);
  const [impact, setImpact] = useState(20);
  const [testCoverage, setTestCoverage] = useState(15);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'REVIEWED' | 'REJECTED'>('REVIEWED');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pr) {
      setError(null);
      if (pr.adminCriteria) {
        setQuality(pr.adminCriteria.quality || 20);
        setComplexity(pr.adminCriteria.complexity || 20);
        setImpact(pr.adminCriteria.impact || 20);
        setTestCoverage(pr.adminCriteria.testCoverage || 15);
      } else {
        setQuality(20);
        setComplexity(20);
        setImpact(20);
        setTestCoverage(15);
      }
      setFeedback(pr.adminFeedback || '');
      setReviewStatus(pr.reviewStatus === 'REJECTED' ? 'REJECTED' : 'REVIEWED');
    }
  }, [pr]);

  if (!isOpen || !pr) return null;

  const totalScore = quality + complexity + impact + testCoverage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmitReview({
        prId: pr.id,
        creditScore: reviewStatus === 'REJECTED' ? 0 : totalScore,
        feedback,
        criteria: {
          quality,
          complexity,
          impact,
          testCoverage
        },
        reviewStatus
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review');
    }
  };

  const applyPreset = (q: number, c: number, i: number, t: number, note: string) => {
    setQuality(q);
    setComplexity(c);
    setImpact(i);
    setTestCoverage(t);
    if (!feedback) {
      setFeedback(note);
    }
    setReviewStatus('REVIEWED');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel-glass-elevated w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 relative border border-white/10 shadow-2xl">
        <button
          id="review-close-x-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-fog hover:text-lilac-white p-1 rounded-btn hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2 text-xs font-medium uppercase tracking-wider text-lavender-accent">
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Code Review & Credit Scoring</span>
        </div>

        <h3 className="text-xl font-medium text-lilac-white pr-8">
          Review {pr.isRepoOnly || !pr.githubPrNumber ? 'Project' : `PR #${pr.githubPrNumber}`}: {pr.title}
        </h3>

        {/* PR Metadata card */}
        <div className="mt-4 p-4 rounded-btn bg-midnight-surface border border-white/5 text-xs text-ash space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={pr.authorAvatar}
                alt={pr.author}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-medium text-lilac-white">@{pr.author}</span>
              <span className="text-steel">•</span>
              <span className="text-fog">{pr.repo}</span>
              <span className="text-steel">•</span>
              <span className="px-2 py-0.5 rounded-full bg-deep-indigo text-lavender-accent text-[11px]">
                Day {pr.dayOfSprint}
              </span>
            </div>

            <a
              href={formatGithubPrUrl(pr.url, pr.repo, pr.githubPrNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lavender-accent hover:text-lilac-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-fog text-[13px] leading-relaxed">
            {pr.description || 'No description provided.'}
          </p>

          <div className="flex items-center gap-4 pt-1 text-[11px] text-fog">
            <span className="flex items-center gap-1 text-emerald-400">
              <Plus className="w-3 h-3" /> {pr.additions} lines
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <Minus className="w-3 h-3" /> {pr.deletions} lines
            </span>
            <span className="flex items-center gap-1">
              <GitCommit className="w-3 h-3 text-lavender-accent" /> {pr.commitsCount} commits
            </span>
          </div>
        </div>

        {/* Scoring Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-2">
              Quick Rubric Presets
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                id="preset-minor-btn"
                type="button"
                onClick={() => applyPreset(10, 5, 5, 5, 'Quick bugfix or typo correction.')}
                className="px-2.5 py-1 rounded-btn bg-midnight-surface border border-white/5 hover:border-lavender-accent/40 text-ash hover:text-lilac-white transition-colors"
              >
                Minor Patch (25 pts)
              </button>
              <button
                id="preset-feature-btn"
                type="button"
                onClick={() => applyPreset(20, 15, 15, 10, 'Well-crafted feature PR with solid code structure.')}
                className="px-2.5 py-1 rounded-btn bg-midnight-surface border border-white/5 hover:border-lavender-accent/40 text-ash hover:text-lilac-white transition-colors"
              >
                Feature Work (60 pts)
              </button>
              <button
                id="preset-high-impact-btn"
                type="button"
                onClick={() => applyPreset(25, 25, 25, 20, 'Exceptional architecture, performance gains & tests.')}
                className="px-2.5 py-1 rounded-btn bg-midnight-surface border border-white/5 hover:border-lavender-accent/40 text-ash hover:text-lilac-white transition-colors"
              >
                Outstanding / High Impact (95 pts)
              </button>
            </div>
          </div>

          {/* Rubric Criteria Sliders */}
          <div className="p-4 rounded-card bg-midnight-surface border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-fog">
                Admin Evaluation Criteria
              </span>
              <div className="text-right">
                <span className="text-xs text-ash">Calculated Credit Score: </span>
                <span className="text-base font-semibold text-white">
                  {reviewStatus === 'REJECTED' ? 0 : totalScore} pts
                </span>
              </div>
            </div>

            {/* Quality Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash">Code Quality & Cleanliness (0-25)</span>
                <span className="font-semibold text-lilac-white">{quality} pts</span>
              </div>
              <input
                id="review-quality-slider"
                type="range"
                min="0"
                max="25"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-lavender-accent cursor-pointer"
              />
            </div>

            {/* Complexity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash">Problem Complexity & Depth (0-25)</span>
                <span className="font-semibold text-lilac-white">{complexity} pts</span>
              </div>
              <input
                id="review-complexity-slider"
                type="range"
                min="0"
                max="25"
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
                className="w-full accent-lavender-accent cursor-pointer"
              />
            </div>

            {/* Impact Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash">Project Impact & Usefulness (0-25)</span>
                <span className="font-semibold text-lilac-white">{impact} pts</span>
              </div>
              <input
                id="review-impact-slider"
                type="range"
                min="0"
                max="25"
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="w-full accent-lavender-accent cursor-pointer"
              />
            </div>

            {/* Test Coverage Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash">Test Coverage & Documentation (0-25)</span>
                <span className="font-semibold text-lilac-white">{testCoverage} pts</span>
              </div>
              <input
                id="review-tests-slider"
                type="range"
                min="0"
                max="25"
                value={testCoverage}
                onChange={(e) => setTestCoverage(Number(e.target.value))}
                className="w-full accent-lavender-accent cursor-pointer"
              />
            </div>
          </div>

          {/* Feedback textarea */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fog block mb-1.5">
              Reviewer Notes / Feedback to Contributor
            </label>
            <textarea
              id="review-feedback-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Great architectural choices and comprehensive integration tests. Awarded high credits for impact!"
              rows={3}
              className="w-full p-3 rounded-btn bg-midnight-surface border border-white/10 text-lilac-white text-sm focus:outline-none focus:border-lavender-accent resize-none placeholder:text-steel"
            />
          </div>

          {/* Review Status Selector */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-fog">Review Decision:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-lilac-white">
              <input
                id="review-radio-approve"
                type="radio"
                name="status"
                value="REVIEWED"
                checked={reviewStatus === 'REVIEWED'}
                onChange={() => setReviewStatus('REVIEWED')}
                className="accent-lavender-accent"
              />
              <span>Approve & Award Credits</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-ash">
              <input
                id="review-radio-reject"
                type="radio"
                name="status"
                value="REJECTED"
                checked={reviewStatus === 'REJECTED'}
                onChange={() => setReviewStatus('REJECTED')}
                className="accent-rose-500"
              />
              <span>Reject (0 credits)</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              id="review-cancel-btn"
              type="button"
              onClick={onClose}
              className="btn-ghost !text-xs"
            >
              Cancel
            </button>
            <button
              id="review-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary !text-xs !py-2 !px-4"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Review...' : 'Save Review & Update Leaderboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
