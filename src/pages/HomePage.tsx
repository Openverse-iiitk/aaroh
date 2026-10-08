import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, Github } from 'lucide-react';
import '../styles/home.css';
import { PixelHeatmap } from '../components/PixelHeatmap';
import { LeaderboardItem, PullRequest, Sprint, User } from '../types';
import { formatGithubPrUrl } from '../utils/github';

interface HomePageProps {
  sprint: Sprint;
  leaderboard?: LeaderboardItem[];
  pullRequests?: PullRequest[];
  currentUser: User | null;
  onOpenAuth: () => void;
}

/* ---------- helpers ---------- */

const pad = (n: number) => n.toString().padStart(2, '0');

// Official event start date: October 9, 2026 at 00:00 IST = 2026-10-08T18:30:00.000Z
const OFFICIAL_START_MS = new Date('2026-10-08T18:30:00.000Z').getTime();

/* Before kickoff: counts down to the event start. After: counts down to the day's scoring cutoff. */
function useEventCountdown(sprint: Sprint | undefined, enabled: boolean) {
  const eventStartTime =
    sprint?.startDate && new Date(sprint.startDate).getTime() >= OFFICIAL_START_MS
      ? new Date(sprint.startDate).getTime()
      : OFFICIAL_START_MS;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const isUpcoming = now < eventStartTime;
  const computedDay = isUpcoming ? 1 : Math.floor((now - eventStartTime) / 86400000) + 1;
  const target = isUpcoming
    ? eventStartTime
    : sprint?.nextSyncAt
    ? new Date(sprint.nextSyncAt).getTime()
    : eventStartTime + computedDay * 86400000;
  const secondsLeft = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(secondsLeft / 86400);

  return {
    isUpcoming,
    computedDay,
    d: days > 0 ? pad(days) : null,
    h: pad(Math.floor((secondsLeft % 86400) / 3600)),
    m: pad(Math.floor((secondsLeft % 3600) / 60)),
    s: pad(secondsLeft % 60),
    isDue: secondsLeft === 0,
  };
}

const relativeTime = (iso: string) => {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  return rtf.format(Math.round(diffSec / 86400), 'day');
};

const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

const Avatar: React.FC<{ src?: string; name: string; size?: number }> = ({ src, name, size = 32 }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/^@/, '')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded bg-[#0e3a24] text-[11px] font-medium text-[var(--accent)]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || '?'
      )}
    </span>
  );
};

const DigitPair: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="mono flex gap-1" aria-hidden="true">
      <span className="clock-digit">{value[0]}</span>
      <span className="clock-digit">{value[1]}</span>
    </div>
    <span className="mono text-[10px] text-[var(--faint)] sm:text-xs">{label}</span>
  </div>
);

const SectionTitle: React.FC<{ title: string; body?: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {body && <p className="mt-2 text-[var(--muted)]">{body}</p>}
    </div>
    {action}
  </div>
);

/* ---------- page ---------- */

export const HomePage: React.FC<HomePageProps> = ({
  sprint,
  leaderboard = [],
  pullRequests = [],
  currentUser,
  onOpenAuth,
}) => {
  const board = Array.isArray(leaderboard) ? leaderboard : [];
  const prs = Array.isArray(pullRequests) ? pullRequests : [];

  const countdown = useEventCountdown(sprint, !sprint?.isFinalized);
  const updateTime = sprint?.dailyUpdateTime || '00:00';
  const isAdmin = currentUser?.role === 'admin';

  const targetStartMs = new Date('2026-10-08T18:30:00.000Z').getTime();
  const isPreEvent = (Date.now() < targetStartMs) || Boolean(sprint?.isUpcoming);
  const [adminPreviewLive, setAdminPreviewLive] = useState(false);

  const totalCredits = board.reduce((sum, item) => sum + (item.totalCredits || 0), 0);
  const mergedCount = prs.filter((p) => p.state === 'merged').length;
  const topThree = board.slice(0, 3);

  const sortedPrs = useMemo(
    () => [...prs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [prs]
  );
  const repos = (sprint?.trackedRepos?.length ? sprint.trackedRepos : []).slice(0, 8);

  const statusLine = sprint?.isFinalized
    ? 'Sprint over. Final standings are locked.'
    : countdown?.isUpcoming
    ? 'Event starts Oct 9, 00:00 IST. PR tracking opens at midnight.'
    : `Day ${countdown?.computedDay || 1} live. Scores refresh at ${updateTime} UTC.`;

  /* One label per intent, used everywhere on this page */
  const PrimaryAction = () => {
    if (!currentUser) {
      return (
        <button type="button" onClick={onOpenAuth} className="btn btn-primary">
          <Github className="h-4 w-4" aria-hidden="true" />
          Sign in with GitHub
        </button>
      );
    }
    if (isAdmin) {
      return (
        <Link to="/admin" className="btn btn-primary">
          Open admin portal
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      );
    }
    return (
      <Link to="/leaderboard" className="btn btn-primary">
        Check my standing
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  };

  const steps = [
    {
      title: 'Sign in with GitHub',
      body: 'One click links your account to the event. There is no form to fill in.',
    },
    {
      title: 'Open pull requests anywhere',
      body: 'Any public repository counts. We find your PRs on our own and read their commits and diffs.',
    },
    {
      title: 'Get scored every night',
      body: `Reviewers grade each PR on four criteria. The board updates at ${updateTime} UTC.`,
    },
  ];

  const criteria = [
    { name: 'Code quality', body: 'Clean, readable code that fits the project style and handles errors.' },
    { name: 'Complexity', body: 'How hard the problem was: tricky logic, state, performance or refactors.' },
    { name: 'Impact', body: 'Real value for the project, like fixing a painful bug or adding a wanted feature.' },
    { name: 'Tests', body: 'Tests that cover edge cases and keep the change from breaking later.' },
  ];

  return (
    <div className="home-v3 w-full overflow-hidden">

      {/* ---------- Hero ---------- */}
      <section className="layer mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="mono rise mb-8 text-xs tracking-[0.28em] text-[var(--accent)] sm:text-sm">
          &gt; THE OPEN SOURCE TRACKING PLATFORM
        </p>

        <h1 className="sr-only">HackAaroh Sprint, the open source tracking platform</h1>
        <PixelHeatmap label="HackAaroh Sprint" />

        <p className="rise rise-2 mt-10 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Open pull requests on any public GitHub repo. Reviewers score each one out of 100, and the leaderboard
          refreshes every night.
        </p>

        <div className="rise rise-2 mt-8 flex flex-wrap items-center justify-center gap-3">
          <PrimaryAction />
          <Link to="/leaderboard" className="btn btn-ghost">
            See the leaderboard
          </Link>
        </div>

        {/* Countdown to the next scoring run */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="mono text-xs text-[var(--faint)]">{statusLine}</p>
          {countdown ? (
            <div
              role="timer"
              aria-label={`${countdown.d ? `${countdown.d} days ` : ''}${countdown.h} hours ${countdown.m} minutes ${countdown.s} seconds until ${countdown.isUpcoming ? 'the event starts' : 'scoring'}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {countdown.d && (
                  <>
                    <DigitPair value={countdown.d} label="days" />
                    <span className="mono pt-2 text-2xl text-[var(--faint)] sm:pt-3" aria-hidden="true">:</span>
                  </>
                )}
                <DigitPair value={countdown.h} label="hours" />
                <span className="mono pt-2 text-2xl text-[var(--faint)] sm:pt-3" aria-hidden="true">:</span>
                <DigitPair value={countdown.m} label="minutes" />
                <span className="mono pt-2 text-2xl text-[var(--faint)] sm:pt-3" aria-hidden="true">:</span>
                <DigitPair value={countdown.s} label="seconds" />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------- Numbers ---------- */}
      <section className="layer mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <dl className="panel grid grid-cols-2 divide-[var(--line)] rounded-lg lg:grid-cols-4 lg:divide-x">
          {[
            { label: 'Contributors', value: formatNumber(board.length) },
            { label: 'Pull requests tracked', value: formatNumber(prs.length) },
            { label: 'Merged so far', value: formatNumber(mergedCount) },
            { label: 'Points awarded', value: formatNumber(totalCredits) },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`px-5 py-6 sm:px-6 ${i % 2 === 1 ? 'border-l border-[var(--line)] lg:border-l-0' : ''} ${i > 1 ? 'border-t border-[var(--line)] lg:border-t-0' : ''}`}
            >
              <dt className="text-sm text-[var(--muted)]">{item.label}</dt>
              <dd className="mono mt-2 text-3xl font-semibold text-[var(--accent)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="layer mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">No forms. Just code.</h2>
          <p className="mt-3 max-w-sm text-[var(--muted)]">
            Keep working on GitHub the way you already do. We handle the tracking.
          </p>
        </div>
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {steps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6">
              <span className="mono text-sm text-[var(--accent)]">{pad(i + 1)}</span>
              <div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-1.5 max-w-lg text-[var(--muted)]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Rubric ---------- */}
      <section className="layer mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <SectionTitle
          title="Scored out of 100."
          body="Four criteria, 25 points each. Careful, meaningful work beats a pile of tiny PRs."
          action={
            <Link to="/faq" className="link self-start text-sm sm:self-auto">
              How scoring works
            </Link>
          }
        />
        <div className="mb-8 grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="h-2 rounded-sm" style={{ background: ['#0e3a24', '#1d8a49', '#27d968', '#2eff7b'][n - 1] }} />
          ))}
        </div>
        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {criteria.map((c) => (
            <div key={c.name} className="border-t border-[var(--line-strong)] pt-4">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{c.name}</span>
                <span className="mono text-sm text-[var(--accent)]">25</span>
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{c.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Rewards ---------- */}
      <section className="layer border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:gap-16">
          <div>
            <p className="mono text-6xl font-semibold text-[var(--accent)] sm:text-7xl">20</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">The top 20 eat on us.</h2>
            <p className="mt-3 max-w-md text-[var(--muted)]">
              Finish in the final top 20 and you get a Zomato voucher for a meal. One each, no catch.
            </p>
          </div>
          <ol className="grid max-w-[18rem] grid-cols-5 gap-1.5 sm:max-w-xs" aria-label="20 Zomato vouchers">
            {Array.from({ length: 20 }, (_, i) => (
              <li
                key={i}
                className="reward-cell mono"
                style={{ background: ['#27d968', '#2eff7b', '#1d8a49', '#6bffa1'][(i * 7 + (i % 3)) % 4] }}
              >
                {i + 1}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Current leaders ---------- */}
      {topThree.length > 0 && (
        <section className="layer mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle
            title="Current leaders"
            action={
              <Link to="/leaderboard" className="link inline-flex items-center gap-1 self-start text-sm sm:self-auto">
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <ol className="panel divide-y divide-[var(--line)] rounded-lg">
            {topThree.map((item, i) => (
              <li key={item.user.id} className={`flex items-center gap-4 px-5 sm:px-6 ${i === 0 ? 'py-6' : 'py-4'}`}>
                <span className={`mono w-6 text-sm ${i === 0 ? 'text-[var(--accent)]' : 'text-[var(--faint)]'}`}>{i + 1}</span>
                <Avatar src={item.user.avatarUrl} name={item.user.username} size={i === 0 ? 44 : 36} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${i === 0 ? 'text-lg' : ''}`}>@{item.user.username}</p>
                  <p className="mono text-xs text-[var(--muted)]">
                    {item.totalPrs} PRs, {item.mergedPrs} merged
                  </p>
                </div>
                <p className={`mono tnum ${i === 0 ? 'text-2xl text-[var(--accent)]' : 'text-lg'}`}>
                  {formatNumber(item.totalCredits)} <span className="text-sm text-[var(--faint)]">pts</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- Repositories + latest PRs ---------- */}
      <section className="layer mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <SectionTitle
          title="Latest pull requests"
          body="Pull requests from any public GitHub repository can earn points."
          action={
            <Link to="/pull-requests" className="link self-start text-sm sm:self-auto">
              All pull requests
            </Link>
          }
        />
        {repos.length > 0 && (
          <ul className="mb-8 flex flex-wrap gap-2">
            {repos.map((repo) => (
              <li key={repo}>
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  translate="no"
                  className="mono inline-flex items-center gap-1.5 rounded border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {repo}
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
        {sortedPrs.length > 0 ? (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {sortedPrs.slice(0, 5).map((pr) => (
              <li key={pr.id}>
                <a
                  href={formatGithubPrUrl(pr.url, pr.repo, pr.githubPrNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/[0.02]"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${pr.state === 'merged' ? 'bg-[var(--accent)]' : 'bg-[#1d8a49]'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium group-hover:text-[var(--accent)]">{pr.title}</span>
                    <span className="mono block truncate text-xs text-[var(--faint)]" translate="no">
                      {pr.repo}{pr.isRepoOnly || !pr.githubPrNumber ? ' (repo project)' : `#${pr.githubPrNumber}`} by @{pr.author},{' '}
                      {relativeTime(pr.createdAt)}
                    </span>
                  </span>
                  <span className="mono shrink-0 text-xs text-[var(--muted)]">
                    {pr.reviewStatus === 'REVIEWED' ? <span className="text-[var(--accent)]">+{pr.creditScore} pts</span> : 'In review'}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-y border-[var(--line)] py-10 text-center text-[var(--muted)]">
            No pull requests yet. Open one on any public repo and it will appear here.
          </p>
        )}
      </section>

      {/* ---------- Closing ---------- */}
      <section className="layer border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your next PR could count tonight.</h2>
            <p className="mt-2 text-[var(--muted)]">Open it anywhere on GitHub. It shows up here on its own.</p>
          </div>
          <PrimaryAction />
        </div>
      </section>
    </div>
  );
};
