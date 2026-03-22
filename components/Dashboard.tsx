'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavUserMenu from '@/components/NavUserMenu';
import ThemeToggle from '@/components/ThemeToggle';
import type { ResearcherProfile } from '@/components/ProfileForm';
import { RESULTS_KEY, SEARCH_KEY } from '@/app/grants/[id]/page';

interface RecentSearch {
  id: string;
  searchDescription: string;
  timestamp: number;
  grantsFound: number;
  topMatchScore: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullResults: any[];
}

interface DashboardProps {
  userName: string;
  totalSearches: number;
  grantsFound: number;
  lettersGenerated: number;
  bestMatchScore: number;
  recentSearches: RecentSearch[];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700' :
    score >= 40 ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700' :
    'bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

const STATS = [
  {
    label: 'Total Searches',
    key: 'totalSearches' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    border: 'border-l-[#6366f1]',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    cardBg: 'bg-indigo-50/40 dark:bg-indigo-900/10',
  },
  {
    label: 'Grants Found',
    key: 'grantsFound' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    border: 'border-l-[#10b981]',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cardBg: 'bg-emerald-50/40 dark:bg-emerald-900/10',
  },
  {
    label: 'Letters Generated',
    key: 'lettersGenerated' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    border: 'border-l-[#f59e0b]',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    cardBg: 'bg-amber-50/40 dark:bg-amber-900/10',
  },
  {
    label: 'Best Match Score',
    key: 'bestMatchScore' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    border: 'border-l-[#8b5cf6]',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    cardBg: 'bg-violet-50/40 dark:bg-violet-900/10',
  },
] as const;

export default function Dashboard({
  userName,
  totalSearches,
  grantsFound,
  lettersGenerated,
  bestMatchScore,
  recentSearches,
}: DashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);

  const firstName = userName.split(' ')[0];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const handleQuickSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const loadResults = (search: RecentSearch) => {
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(search.fullResults));
      localStorage.setItem(SEARCH_KEY, search.searchDescription);
    } catch { /* ignore */ }
    router.push(`/search?q=${encodeURIComponent(search.searchDescription)}`);
  };

  const statValues: Record<typeof STATS[number]['key'], number | string> = {
    totalSearches,
    grantsFound,
    lettersGenerated,
    bestMatchScore: bestMatchScore > 0 ? bestMatchScore : '—',
  };

  // Upcoming deadlines
  const deadlines = [
    { title: 'NIH R01 — Standard Cycle', agency: 'NIH', date: new Date(now.getFullYear(), now.getMonth() + 1, 5) },
    { title: 'NSF CAREER Award', agency: 'NSF', date: new Date(now.getFullYear(), now.getMonth() + 1, 20) },
    { title: 'NIH R21 Exploratory', agency: 'NIH', date: new Date(now.getFullYear(), now.getMonth() + 2, 12) },
  ].map((d) => ({
    ...d,
    daysLeft: Math.ceil((d.date.getTime() - now.getTime()) / 86400000),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="bg-[#0f172a] text-white shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧭</span>
            <span className="text-xl font-bold tracking-tight">Grant Compass</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NavUserMenu onProfileChange={setProfile} />
            <Link
              href="/search"
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Search Grants →
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* ── Welcome header ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{dateStr}</p>
          </div>
          {profile && (
            <div className="flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-4 py-1.5 self-start sm:self-auto">
              <span className="text-sm" aria-hidden="true">👤</span>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 leading-relaxed">
                {[profile.university, profile.department, profile.position].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* ── Stats row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ label, key, icon, border, iconBg, iconColor, cardBg }) => (
            <div
              key={label}
              className={`rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${border} ${cardBg} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default`}
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
                {icon}
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white leading-none">{statValues[key]}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: Quick Search + Recent Searches ─────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Quick Search */}
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-violet-500 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm" aria-hidden="true">🔍</span>
                <h2 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest">New Search</h2>
              </div>
              <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your research in plain English…"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-600 focus:border-violet-300 transition"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="rounded-xl px-6 py-4 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-none"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Find Grants →
                </button>
              </form>
            </div>

            {/* Recent Searches */}
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Searches</h2>
                </div>
                <Link href="/history" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold transition-colors">
                  View all →
                </Link>
              </div>

              {recentSearches.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium">No searches yet.</p>
                  <p className="text-xs mt-1 leading-relaxed">Use Quick Search above to get started.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentSearches.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl px-3 py-3 flex items-start justify-between gap-3 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate leading-relaxed group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                          {s.searchDescription}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeAgo(s.timestamp)}
                          </span>
                          <span className="text-slate-200 dark:text-slate-600">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.grantsFound} grants</span>
                          {s.topMatchScore > 0 && (
                            <>
                              <span className="text-slate-200 dark:text-slate-600">·</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">top</span>
                              <ScorePill score={s.topMatchScore} />
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => loadResults(s)}
                        className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        Load Results
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Upcoming Deadlines ──────────────────────────────── */}
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming Deadlines</h2>
            </div>

            <div className="flex flex-col gap-3">
              {deadlines.map((d) => {
                const badgeBg =
                  d.daysLeft < 20 ? 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700' :
                  d.daysLeft < 40 ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-700' :
                  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700';
                const agencyColor = d.agency === 'NIH'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                return (
                  <div
                    key={d.title}
                    className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-700/50 shadow-sm p-4 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${agencyColor}`}>
                        {d.agency}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeBg}`}>
                        {d.daysLeft}d left
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{d.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>

            <Link
              href="/search"
              className="mt-auto w-full rounded-xl py-3 text-center text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Search Matching Grants →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
