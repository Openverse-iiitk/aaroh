import { Hero } from '../components/Hero';
import { ReflectBlackHole } from '../components/ReflectBlackHole';
import { LivePullRequestMarquee } from '../components/LivePullRequestMarquee';
import { SpotlightCard } from '../components/reactbits/SpotlightCard';
import { LeaderboardItem, PullRequest, Sprint, User } from '../types';
import { Link } from '@tanstack/react-router';
import { 
  Trophy, 
  GitPullRequest, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Users, 
  Code2, 
  Flame, 
  GitMerge, 
  Award, 
  Star, 
  Sparkles, 
  FileCheck2, 
  Terminal, 
  HelpCircle,
  ExternalLink,
  Shield,
  Github
} from 'lucide-react';

interface HomePageProps {
  sprint: Sprint;
  leaderboard?: LeaderboardItem[];
  pullRequests?: PullRequest[];
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  sprint,
  leaderboard = [],
  pullRequests = [],
  currentUser,
  onOpenAuth,
}) => {
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];
  const safePrs = Array.isArray(pullRequests) ? pullRequests : [];
  const topThree = safeLeaderboard.slice(0, 3);
  const totalCredits = safeLeaderboard.reduce((acc, curr) => acc + (curr.totalCredits || 0), 0);
  const totalMerged = safePrs.filter((p) => p.state === 'merged').length;

  const trackedRepositories = sprint.trackedRepos || [
    'facebook/react',
    'vercel/next.js',
    'rust-lang/rust',
    'oven-sh/bun',
    'nodejs/node',
    'tailwindlabs/tailwindcss',
    'tanstack/table',
    'shadcn-ui/ui',
    'microsoft/vscode',
    'astral-sh/uv',
  ];

  return (
    <div className="w-full pb-20 relative overflow-hidden">
      {/* Reflect Notes Interactive 3D Black Hole Background (Horizontal Plane & Scroll-Driven Tilt/Zoom) */}
      <ReflectBlackHole isFixed />

      {/* Logged In Welcome Banner (if authenticated) */}
      {currentUser && (
        <div className="w-full bg-blue-950/30 border-b border-blue-500/20 py-2.5 px-4 animate-fade-in">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300">
                {currentUser.role === 'admin' ? (
                  <>Signed in as <strong className="text-white">HackAaroh Admin</strong></>
                ) : (
                  <>Signed in as <strong className="text-white">@{currentUser.username}</strong></>
                )}
                {currentUser.role === 'admin' ? (
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    Lead Administrator
                  </span>
                ) : (
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                    Contributor
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Open Admin Review Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  to="/leaderboard"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>View My Ranking on Leaderboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero
        sprint={sprint}
        onOpenAuth={onOpenAuth}
        isAuthenticated={!!currentUser}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Live PR Stream Ticker */}
      <div className="mb-14">
        <LivePullRequestMarquee pullRequests={safePrs} />
      </div>

      {/* Live Event Stats Bar with ReactBits SpotlightCard */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Status */}
          <SpotlightCard className="p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Event Status
            </span>
            <div className="flex items-center gap-2 my-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  sprint.status === 'ACTIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
              <span className="text-base font-semibold text-white">
                {sprint.status === 'ACTIVE'
                  ? `Day ${sprint.currentDay} Active`
                  : sprint.isFinalized
                  ? 'Concluded'
                  : 'Pending Start'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">
              Syncs at {sprint.dailyUpdateTime || '00:00'} UTC
            </span>
          </SpotlightCard>

          {/* Registered Contributors */}
          <SpotlightCard className="p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Contributors
            </span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-semibold text-white">
                {safeLeaderboard.length}
              </span>
              <span className="text-xs text-zinc-500">participants</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">
              Across all teams
            </span>
          </SpotlightCard>

          {/* Tracked PRs */}
          <SpotlightCard className="p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Tracked Pull Requests
            </span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-semibold text-white">
                {safePrs.length}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                ({totalMerged} merged)
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">
              Tracked across GitHub
            </span>
          </SpotlightCard>

          {/* Points Distributed */}
          <SpotlightCard className="p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Credits Awarded
            </span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-semibold text-white">
                {totalCredits}
              </span>
              <span className="text-xs text-amber-400 font-medium">pts</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">
              Evaluated by admins
            </span>
          </SpotlightCard>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Simple &amp; Transparent
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1.5 tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Automated discovery means you write code, open PRs on GitHub, and our platform handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <SpotlightCard 
            spotlightColor="rgba(80, 70, 228, 0.18)" 
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                Step 01
              </span>
              <h3 className="text-base font-semibold text-white mt-1 mb-2">
                1-Click GitHub Connect
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Authenticate with your GitHub account. No complex registration forms. Your GitHub profile is automatically linked to the event roster.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant OAuth authorization</span>
            </div>
          </SpotlightCard>

          {/* Step 2 */}
          <SpotlightCard 
            spotlightColor="rgba(147, 130, 255, 0.18)" 
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                Step 02
              </span>
              <h3 className="text-base font-semibold text-white mt-1 mb-2">
                Automatic PR Tracking
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open pull requests in any public GitHub repository. We find them automatically and send them to reviewers for scoring.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tracks additions, diffs &amp; commits</span>
            </div>
          </SpotlightCard>

          {/* Step 3 */}
          <SpotlightCard 
            spotlightColor="rgba(251, 191, 36, 0.16)" 
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Step 03
              </span>
              <h3 className="text-base font-semibold text-white mt-1 mb-2">
                Daily Rubric Evaluation
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reviewers evaluate code on 4 core criteria (Quality, Complexity, Impact, Tests) to distribute points. Standings update nightly at 00:00 UTC.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permanent leaderboard podium</span>
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* 4-Pillar Evaluation Rubric Section */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="p-8 rounded-card bg-[#090520]/80 border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Scoring Transparency
              </span>
              <h2 className="text-2xl font-semibold text-white mt-1 tracking-tight">
                The 4-Pillar Evaluation Rubric
              </h2>
              <p className="text-xs text-zinc-400 mt-2">
                Every pull request is graded up to 100 points based on four equal pillars to reward well-architected, impactful contributions over spam.
              </p>
            </div>
            <Link
              to="/faq"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors self-start sm:self-auto px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
            >
              <span>Learn More in FAQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SpotlightCard 
              spotlightColor="rgba(80, 70, 228, 0.18)" 
              className="p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Code Quality</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  25 pts
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Clean formatting, idiomatic coding patterns, proper error boundaries, and self-documenting code structure.
              </p>
            </SpotlightCard>

            <SpotlightCard 
              spotlightColor="rgba(147, 130, 255, 0.18)" 
              className="p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Complexity</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  25 pts
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Technical depth, algorithmic difficulty, concurrency management, and solving intricate architectural hurdles.
              </p>
            </SpotlightCard>

            <SpotlightCard 
              spotlightColor="rgba(16, 185, 129, 0.18)" 
              className="p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Project Impact</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  25 pts
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Real-world value delivered, fixing critical user pain points, meaningful feature velocity, and performance gains.
              </p>
            </SpotlightCard>

            <SpotlightCard 
              spotlightColor="rgba(245, 158, 11, 0.18)" 
              className="p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Test Coverage</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  25 pts
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Automated unit and integration tests, defensive edge case assertions, and resilience to regressions.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>

      {/* Contributor Rewards */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="relative overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-br from-[#29120b] via-[#17102b] to-[#0b071d] p-6 sm:p-10 shadow-[0_0_45px_rgba(251,146,60,0.12)]">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-300 uppercase tracking-[0.2em]">
                <Trophy className="w-4 h-4" /> Contributor Rewards
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">20 meals on us.</h2>
              <p className="text-base text-zinc-300 mt-3">Reach the top 20 on the leaderboard and get a Zomato food voucher for your next meal.</p>
              <p className="text-xs text-zinc-500 mt-2">One voucher for each of the final top 20 contributors.</p>
            </div>
            <div className="grid grid-cols-5 gap-2 max-w-[220px]" aria-label="20 Zomato vouchers available">
              {Array.from({ length: 20 }, (_, index) => (
                <div key={index} className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-300/30 bg-orange-400/10 text-xs font-bold text-orange-200 shadow-inner">
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Ecosystem Repositories */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="border-t border-white/10 pt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Ecosystem Scope
              </span>
              <h2 className="text-xl font-semibold text-white mt-1">
                Monitored Open Source Repositories
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Pull requests from any public GitHub repository are eligible for scoring.
              </p>
            </div>
            <Link
              to="/pull-requests"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Explore All PRs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {trackedRepositories.map((repo) => (
              <a
                key={repo}
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-btn bg-[#121215] border border-white/10 hover:border-blue-500/40 hover:bg-[#18181d] text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
              >
                <Code2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                <span className="font-mono">{repo}</span>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Top Champions Spotlight (if leaderboard has items) */}
      {topThree.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 mb-20">
          <div className="border-t border-white/10 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Live Standings Preview
                </span>
                <h2 className="text-xl font-semibold text-white mt-1">
                  Current Leaders
                </h2>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>View Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThree.map((item, idx) => (
                <SpotlightCard
                  key={item.user.id}
                  spotlightColor={
                    idx === 0
                      ? 'rgba(251, 191, 36, 0.25)'
                      : idx === 1
                      ? 'rgba(203, 213, 225, 0.2)'
                      : 'rgba(217, 119, 6, 0.2)'
                  }
                  className={`p-5 flex flex-col justify-between ${
                    idx === 0
                      ? 'border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.12)]'
                      : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-400 text-black'
                            : idx === 1
                            ? 'bg-zinc-300 text-black'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-amber-300">
                        {item.totalCredits} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={item.user.avatarUrl}
                        alt={item.user.username}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {item.user.name}
                        </h4>
                        <span className="text-xs text-zinc-500">@{item.user.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                    <span>{item.totalPrs} PRs Submitted</span>
                    <span className="text-emerald-400 font-medium">{item.mergedPrs} Merged</span>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call to action bottom banner */}
      <div id="cta-banner" className="max-w-5xl mx-auto px-4">
        <div className="relative group overflow-hidden rounded-3xl border border-indigo-500/30 bg-[#070417]/70 backdrop-blur-xl p-8 sm:p-12 text-center shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(147,130,255,0.2)] hover:border-indigo-500/50 transition-all duration-300">
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/25 blur-3xl -z-10 rounded-full"
          />
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-32 bg-purple-500/20 blur-3xl -z-10 rounded-full"
          />

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
            Ready to participate in HackAaroh?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Sign in with GitHub, open a pull request from any public repository, and climb the leaderboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {currentUser ? (
              <Link to="/leaderboard" className="btn-primary !px-5 !py-2.5">
                <Trophy className="w-4 h-4" />
                <span>Go to Leaderboard</span>
              </Link>
            ) : (
              <button onClick={onOpenAuth} className="btn-primary !px-5 !py-2.5">
                <Github className="w-4 h-4" />
                <span>Authenticate with GitHub</span>
              </button>
            )}

            <Link to="/pull-requests" className="btn-secondary !px-5 !py-2.5">
              <span>View Tracked PRs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
