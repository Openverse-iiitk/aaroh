import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GitPullRequest,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  FileQuestion,
  ExternalLink,
  Github,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'tracking' | 'scoring' | 'rules';
  question: string;
  answer: string;
  highlights?: string[];
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-hackaaroh',
    category: 'general',
    question: 'What is HackAaroh and how does the PR Sprint work?',
    answer:
      'HackAaroh is an intensive open-source contribution sprint. Instead of counting superficial commit numbers, HackAaroh tracks pull requests authored across eligible repositories and evaluates them on real architectural depth, test resilience, and project impact.',
    highlights: ['Automated PR ingestion', 'Nightly 00:00 UTC evaluations', 'Merit-based leaderboard']
  },
  {
    id: 'who-can-join',
    category: 'general',
    question: 'Who can participate, and is there any registration fee?',
    answer:
      'HackAaroh is 100% free and open to everyone—from university students and self-taught developers to experienced open-source maintainers. All you need is an active GitHub account to authenticate.',
    highlights: ['Completely free', 'Open to all skill levels', 'Instant 1-click GitHub sign-in']
  },
  {
    id: 'how-prs-tracked',
    category: 'tracking',
    question: 'How does HackAaroh discover and track my pull requests?',
    answer:
      'Once you sign in with GitHub, the platform maps your GitHub handle. The background ingestion engine monitors all public repositories in the tracked ecosystem list, automatically pulling your PR metadata (additions, deletions, commits, review status, and merge state).',
    highlights: ['No manual forms to copy-paste', 'Tracks additions, diffs & commits', 'Auto-updates on merge']
  },
  {
    id: 'eligible-repos',
    category: 'tracking',
    question: 'Which repositories are eligible for scoring?',
    answer:
      'Eligible repositories include recognized open-source projects such as React, Next.js, Bun, Rust, Linux, Tailwind CSS, TanStack, shadcn/ui, VS Code, and Astral uv, plus designated HackAaroh repositories. Maintainers can also expand the ecosystem list through the admin portal.',
    highlights: ['Tier-1 open-source repositories', 'Publicly accessible repos only', 'Updated dynamically by admins']
  },
  {
    id: 'draft-closed-prs',
    category: 'tracking',
    question: 'Do Draft pull requests or closed unmerged PRs count?',
    answer:
      'Draft PRs are not eligible for evaluation until marked "Ready for Review". Closed pull requests that were rejected or closed without merge receive 0 credits. PRs merged into upstream repositories receive full priority during daily review rounds.',
    highlights: ['Draft PRs must be marked ready', 'Merged PRs receive priority', 'Rejected PRs receive 0 pts']
  },
  {
    id: 'scoring-rubric',
    category: 'scoring',
    question: 'How are pull requests graded? What is the 4-pillar rubric?',
    answer:
      'Every pull request is graded up to 100 points across four equal 25-point pillars: 1) Code Quality (formatting, idiomatic design, error handling), 2) Complexity (algorithmic depth, architecture), 3) Project Impact (user value, closed issues, performance gains), and 4) Test Coverage (unit/integration tests, edge cases).',
    highlights: ['25 pts Code Quality', '25 pts Technical Complexity', '25 pts Project Impact', '25 pts Test Coverage']
  },
  {
    id: 'nightly-cycle',
    category: 'scoring',
    question: 'When do scores and leaderboard standings update?',
    answer:
      'Scoring runs on a continuous daily cycle culminating every night at 00:00 UTC. The live countdown HUD on the home page displays the exact remaining hours, minutes, and seconds until the next nightly evaluation cycle.',
    highlights: ['Nightly 00:00 UTC cutoff', 'Live Countdown HUD', 'Real-time leaderboard updates']
  },
  {
    id: 'can-score-be-adjusted',
    category: 'scoring',
    question: 'Can my score be updated if I push new commits after review?',
    answer:
      'Yes. If reviewers provide feedback or request revisions, and you push additional commits or test cases, administrators can re-review and adjust your score during subsequent evaluation rounds before the sprint is frozen.',
    highlights: ['Iterative feedback supported', 'Re-grading on pushed revisions', 'Transparent reviewer notes']
  },
  {
    id: 'anti-spam-policy',
    category: 'rules',
    question: 'What is the policy on AI-generated spam or low-effort PRs?',
    answer:
      'HackAaroh strictly enforces a zero-tolerance anti-spam policy. Trivial typo fixes, automated bulk PRs, unverified AI code dumps, or PRs submitted purely for leaderboard farming will receive 0 points and may lead to disqualification from the sprint podium.',
    highlights: ['Zero-tolerance for spam', 'No low-effort typo farming', 'Disqualification for abusive activity']
  },
  {
    id: 'sprint-finalization',
    category: 'rules',
    question: 'What happens when a sprint concludes and podium is finalized?',
    answer:
      'When an admin finalizes the sprint, rankings are permanently locked. The top 3 contributors are awarded official Gold, Silver, and Bronze podium standings with commemorative event badges and achievement summaries.',
    highlights: ['Permanent locked podium', 'Top 3 trophy recognition', 'Contributor certificate eligibility']
  }
];

export const FaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'what-is-hackaaroh': true,
    'scoring-rubric': true
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.highlights?.some((h) => h.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Contributor Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Everything you need to know about participation, pull request tracking, 4-pillar rubric grading, and leaderboard standings.
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions (e.g., rubric, repositories, 00:00 UTC, scoring)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0e0a22] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'general', label: 'General & Overview' },
            { id: 'tracking', label: 'PR Tracking & Ingestion' },
            { id: 'scoring', label: 'Rubric & Scoring' },
            { id: 'rules', label: 'Rules & Fair Play' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-[#151226] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((item) => {
            const isOpen = !!openItems[item.id];

            return (
              <div
                key={item.id}
                className="rounded-xl bg-[#090520]/80 border border-white/10 overflow-hidden transition-all duration-200 hover:border-indigo-500/30"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {item.question}
                  </span>
                  <span className="p-1 rounded bg-white/5 text-zinc-400 flex-shrink-0 mt-0.5">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 space-y-3 animate-fade-in">
                    <div className="h-px w-full bg-white/5 mb-3" />
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {item.answer}
                    </p>

                    {item.highlights && item.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.highlights.map((h) => (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{h}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-10 rounded-xl bg-[#0e0a22] border border-white/10 text-center space-y-2">
            <FileQuestion className="w-8 h-8 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No questions found</h3>
            <p className="text-xs text-zinc-400">
              No FAQ items matched your query &ldquo;{searchQuery}&rdquo;. Try another keyword or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="text-xs text-indigo-400 hover:underline pt-2 inline-block"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Still Have Questions Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0718] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-semibold text-white">Still have questions about the sprint?</h3>
          <p className="text-xs text-zinc-400">
            Learn more about the rules, sprint schedule, or connect with organizers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/about" className="btn-secondary !text-xs !px-4 !py-2">
            <span>Read About Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/leaderboard" className="btn-primary !text-xs !px-4 !py-2">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Check Leaderboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
