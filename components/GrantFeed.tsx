'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ResearcherProfile } from '@/components/ProfileForm';
import SaveDeadlineButton from '@/components/SaveDeadlineButton';
import LetterModal from '@/components/LetterModal';

const FEED_KEY = 'grant_compass_feed';
const FEED_TTL = 30 * 60 * 1000; // 30 min
const LAST_VISIT_KEY = 'grant_compass_last_feed_visit';
const HISTORY_KEY = 'grant_compass_history';

interface FeedGrant {
  grantId: number;
  score: number;
  reason: string;
  grant: {
    title: string;
    agency: string;
    amount: number | null;
    deadline: string | null;
    description: string;
    url: string;
  };
}

interface NewsItem {
  title: string;
  summary: string;
  date: string;
  url: string;
  agency: string;
  searchQuery: string;
}

interface FeedCache {
  results: FeedGrant[];
  news: NewsItem[];
  timestamp: number;
}

interface GrantFeedProps {
  profile: ResearcherProfile | null;
  onSearchQuery?: (query: string) => void;
}

// ── Score bar ────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  const color = c >= 76 ? 'bg-green-500' : c >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  const label = c >= 76 ? 'text-green-700' : c >= 50 ? 'text-yellow-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${label}`}>{c}</span>
    </div>
  );
}

// ── Agency badge ─────────────────────────────────────────────────
function AgencyBadge({ agency }: { agency: string }) {
  const u = agency.toUpperCase();
  if (u.includes('NIH')) return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">NIH</span>;
  if (u.includes('NSF')) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">NSF</span>;
  if (u.includes('DOE')) return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">DOE</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{agency.slice(0, 8)}</span>;
}

// ── Deadline chip ─────────────────────────────────────────────────
function DeadlineChip({ deadline }: { deadline: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(deadline); due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return null;
  const cls = days < 30 ? 'bg-red-50 text-red-700' : days <= 60 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {days === 0 ? 'Due today' : `${days}d left`}
    </span>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <div className="h-4 w-10 rounded-full bg-slate-200" />
        <div className="h-4 flex-1 rounded bg-slate-200" />
      </div>
      <div className="h-1.5 rounded-full bg-slate-200" />
      <div className="h-3 w-3/4 rounded bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-3 w-12 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ── Minutes ago ───────────────────────────────────────────────────
function minutesAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'just now';
  if (diff === 1) return '1 minute ago';
  if (diff < 60) return `${diff} minutes ago`;
  const h = Math.floor(diff / 60);
  return h === 1 ? '1 hour ago' : `${h} hours ago`;
}

// ── Feed grant card ───────────────────────────────────────────────
function FeedGrantCard({
  result,
  onGenerateLetter,
  onSearch,
}: {
  result: FeedGrant;
  onGenerateLetter: () => void;
  onSearch: (q: string) => void;
}) {
  const g = result.grant;
  const amount = g.amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(g.amount)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2.5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Title + badge */}
      <div className="flex items-start gap-2">
        <AgencyBadge agency={g.agency} />
        {g.url ? (
          <a href={g.url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-800 leading-snug hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
            {g.title}
          </a>
        ) : (
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">{g.title}</p>
        )}
      </div>

      {/* Score */}
      <ScoreBar score={result.score} />

      {/* Reason */}
      <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-indigo-200 pl-2 line-clamp-2">
        {result.reason}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {amount && <span className="font-medium text-slate-600">{amount}</span>}
        {g.deadline && <DeadlineChip deadline={g.deadline} />}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
        {g.url && (
          <a href={g.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Grant
          </a>
        )}
        <button onClick={onGenerateLetter}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Letter
        </button>
        {g.url && (
          <SaveDeadlineButton
            grantTitle={g.title}
            agency={g.agency}
            deadline={g.deadline}
            fundingAmount={g.amount}
            grantUrl={g.url}
          />
        )}
      </div>
    </div>
  );
}

// ── News card ─────────────────────────────────────────────────────
function NewsCard({ item, onSearch }: { item: NewsItem; onSearch: (q: string) => void }) {
  const agencyColor =
    item.agency === 'NIH' ? 'bg-blue-100 text-blue-700' :
    item.agency === 'NSF' ? 'bg-green-100 text-green-700' :
    'bg-slate-100 text-slate-600';

  const formattedDate = (() => {
    try {
      return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return item.date; }
  })();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${agencyColor}`}>{item.agency}</span>
        <span className="text-[10px] text-slate-400">{formattedDate}</span>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
        {item.title}
      </a>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.summary}</p>
      <button
        onClick={() => onSearch(item.searchQuery)}
        className="self-start inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        Find Related Grants
      </button>
    </div>
  );
}

// ── Main GrantFeed export ─────────────────────────────────────────
export default function GrantFeed({ profile, onSearchQuery }: GrantFeedProps) {
  const router = useRouter();
  const [feedResults, setFeedResults] = useState<FeedGrant[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [letterGrant, setLetterGrant] = useState<FeedGrant | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const getHistory = (): { description: string }[] => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const loadFeed = useCallback(async (force = false) => {
    // Check cache first
    if (!force) {
      try {
        const raw = localStorage.getItem(FEED_KEY);
        if (raw) {
          const cache: FeedCache = JSON.parse(raw);
          if (Date.now() - cache.timestamp < FEED_TTL) {
            setFeedResults(cache.results ?? []);
            setNews(cache.news ?? []);
            setLastUpdated(cache.timestamp);
            const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
            setHasNew(cache.timestamp > lastVisit && (cache.results ?? []).length > 0);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    const history = getHistory().slice(0, 5);
    const hasProfile = profile?.department || profile?.university;
    if (!hasProfile && history.length === 0) return;

    setLoading(true);
    setNewsLoading(true);

    try {
      const department = profile?.department || history[0]?.description || 'research';

      const [feedRes, newsRes] = await Promise.all([
        fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              university: profile?.university,
              department: profile?.department,
              position: profile?.position,
            },
            searchHistory: history,
          }),
        }),
        fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department }),
        }).catch(() => null),
      ]);

      const feedData = feedRes.ok ? await feedRes.json() : { results: [] };
      const newsData = newsRes?.ok ? await newsRes.json() : { items: [] };
      const results: FeedGrant[] = feedData.results ?? [];
      const newsItems: NewsItem[] = newsData.items ?? [];
      const now = Date.now();

      setFeedResults(results);
      setNews(newsItems);
      setLastUpdated(now);

      const cache: FeedCache = { results, news: newsItems, timestamp: now };
      localStorage.setItem(FEED_KEY, JSON.stringify(cache));

      const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
      setHasNew(results.length > 0 && now > lastVisit);
    } catch (err) {
      console.error('[GrantFeed]', err);
    } finally {
      setLoading(false);
      setNewsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!mounted) return;
    void loadFeed();
    // Mark as visited after 3s
    const t = setTimeout(() => {
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
      setHasNew(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [loadFeed, mounted]);

  if (!mounted) return null;

  const history = getHistory();
  const hasProfile = profile?.department || profile?.university;

  // No profile + no history — show CTA
  if (!hasProfile && history.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-8 text-center flex flex-col items-center gap-3">
          <div className="text-3xl">📡</div>
          <p className="text-sm font-semibold text-slate-700">Get personalized grant recommendations</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Complete your profile or run a search to train your grant feed.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Complete your profile to get personalized grant recommendations →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Grant Feed ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              📡 Recommended For You
              {hasNew && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="New recommendations" />
              )}
            </h2>
            {lastUpdated && !loading && (
              <span className="text-[11px] text-slate-400">· Updated {minutesAgo(lastUpdated)}</span>
            )}
          </div>
          <button
            onClick={() => void loadFeed(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing…' : '🔄 Refresh Feed'}
          </button>
        </div>

        {/* Skeleton loading */}
        {loading && feedResults.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && feedResults.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
            No recommendations yet. Complete a search to train your feed.
          </div>
        )}

        {/* Results grid */}
        {feedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {feedResults.map((result, i) => (
              <FeedGrantCard
                key={i}
                result={result}
                onGenerateLetter={() => setLetterGrant(result)}
                onSearch={(q) => onSearchQuery?.(q)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Grant News ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">📰 Grant News &amp; Deadlines</h2>

        {/* News skeleton */}
        {newsLoading && news.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="h-4 w-8 rounded-full bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-100" />
                </div>
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-3 w-5/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* News empty */}
        {!newsLoading && news.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
            No recent news found for your field.
          </div>
        )}

        {/* News grid */}
        {news.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.map((item, i) => (
              <NewsCard
                key={i}
                item={item}
                onSearch={(q) => onSearchQuery?.(q)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Letter modal */}
      {letterGrant && (
        <LetterModal
          grant={{
            title: letterGrant.grant.title,
            agency: letterGrant.grant.agency,
            score: letterGrant.score,
            reason: letterGrant.reason,
            amount: letterGrant.grant.amount,
            deadline: letterGrant.grant.deadline,
            description: letterGrant.grant.description,
            url: letterGrant.grant.url,
          }}
          researchDescription={history[0]?.description ?? ''}
          profile={profile}
          onClose={() => setLetterGrant(null)}
        />
      )}
    </div>
  );
}
