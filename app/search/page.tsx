'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import NavUserMenu from '@/components/NavUserMenu';
import type { ResearcherProfile } from '@/components/ProfileForm';
import { sampleGrants } from '@/lib/sampleGrants';
import { RESULTS_KEY, SEARCH_KEY } from '@/app/grants/[id]/page';
import type { Grant } from '@/lib/nih';
import type { GrantProps } from '@/components/GrantCard';

const HISTORY_KEY = 'grant_compass_history';
const COMPARE_KEY = 'grant_compass_compare';
const MAX_HISTORY = 5;

interface SearchHistoryEntry {
  id: string;
  description: string;
  timestamp: number;
  grantCount: number;
  topScore: number;
  results: MatchResult[];
}

const DEMO_DESCRIPTION =
  'I study the effects of microplastics on neurological development in adolescents, ' +
  'focusing on how early exposure correlates with cognitive decline markers.';

const STAGGER = ['', 'animation-delay-75', 'animation-delay-150', 'animation-delay-225', 'animation-delay-300', 'animation-delay-375'];

interface MatchResult {
  grantId: number;
  score: number;
  reason: string;
  grant: Grant;
}


function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchDescription, setResearchDescription] = useState('');
  const [activeGrant, setActiveGrant] = useState<GrantProps | null>(null);
  const [usedSampleData, setUsedSampleData] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [limitedMatches, setLimitedMatches] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const { data: session, status } = useSession();
  const isGuest = status === 'unauthenticated';

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSearch = async (desc: string, demo = false) => {
    setIsDemo(demo);
    setResearchDescription(desc);
    setIsSearching(true);
    setMatchResults([]);
    setError(null);
    setUsedSampleData(false);
    setHasSearched(true);
    setLimitedMatches(false);
    setSuggestions([]);

    try {
      let grants: Grant[] = [];

      try {
        const grantsRes = await fetch(`/api/grants?q=${encodeURIComponent(desc)}`);
        if (grantsRes.ok) {
          const grantsData = await grantsRes.json();
          grants = grantsData.grants ?? [];
        }
      } catch {
        // network error — fall through to sample data
      }

      if (grants.length === 0) {
        grants = sampleGrants;
        setUsedSampleData(true);
      }

      setIsMatching(true);
      setIsSearching(false);

      // Run match and suggest in parallel
      setIsSuggesting(true);
      const [matchRes, suggestRes] = await Promise.all([
        fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchDescription: desc, grants }),
        }),
        fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchDescription: desc }),
        }).catch(() => null),
      ]);

      if (!matchRes.ok) {
        const errBody = await matchRes.json().catch(() => ({}));
        throw new Error(errBody.detail ?? errBody.error ?? `Match API error: ${matchRes.status}`);
      }

      const matchData = await matchRes.json();
      const all: MatchResult[] = matchData.results ?? [];
      const aboveThreshold = all.filter((r) => r.score > 30);
      const isLimited = aboveThreshold.length < 3;
      const finalResults = isLimited ? all.slice(0, 3) : aboveThreshold;
      setLimitedMatches(isLimited);
      setMatchResults(finalResults);

      // Persist results and description for the detail page
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(finalResults));
        localStorage.setItem(SEARCH_KEY, desc);
      } catch {
        // localStorage unavailable — detail page will show "not found"
      }

      // Save to search history
      try {
        const topScore = finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.score)) : 0;
        const entry: SearchHistoryEntry = {
          id: Date.now().toString(),
          description: desc,
          timestamp: Date.now(),
          grantCount: finalResults.length,
          topScore,
          results: finalResults,
        };
        const stored = localStorage.getItem(HISTORY_KEY);
        const prev: SearchHistoryEntry[] = stored ? JSON.parse(stored) : [];
        // Remove duplicate description (keep latest)
        const deduped = prev.filter((e) => e.description !== desc);
        const next = [entry, ...deduped].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        setHistory(next);
      } catch { /* ignore */ }

      // If logged in, also save to server-side history
      if (session?.user?.id) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchDescription: desc,
            grantsFound: finalResults.length,
            topMatchScore: finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.score)) : 0,
            fullResults: finalResults,
          }),
        }).catch(() => {});
      }

      if (suggestRes?.ok) {
        const suggestData = await suggestRes.json();
        setSuggestions(suggestData.suggestions ?? []);
      }
      setIsSuggesting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSearching(false);
      setIsMatching(false);
      setIsSuggesting(false);
    }
  };

  const handleRestoreHistory = (entry: SearchHistoryEntry) => {
    setDescription(entry.description);
    setResearchDescription(entry.description);
    setMatchResults(entry.results);
    setHasSearched(true);
    setError(null);
    setLimitedMatches(false);
    setSuggestions([]);
    setCompareIndices([]);
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(entry.results));
      localStorage.setItem(SEARCH_KEY, entry.description);
    } catch { /* ignore */ }
  };

  const handleDeleteHistory = (id: string) => {
    const next = history.filter((e) => e.id !== id);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  };

  const handleCompareToggle = (index: number) => {
    setCompareIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };

  const handleCompare = () => {
    if (compareIndices.length !== 2) return;
    const [a, b] = compareIndices;
    const g1 = matchResults[a];
    const g2 = matchResults[b];
    const compareData = {
      grant1: {
        title: g1.grant.title,
        agency: g1.grant.agency,
        score: g1.score,
        reason: g1.reason,
        amount: g1.grant.amount,
        deadline: g1.grant.deadline,
        description: g1.grant.description,
        url: g1.grant.url,
      },
      grant2: {
        title: g2.grant.title,
        agency: g2.grant.agency,
        score: g2.score,
        reason: g2.reason,
        amount: g2.grant.amount,
        deadline: g2.grant.deadline,
        description: g2.grant.description,
        url: g2.grant.url,
      },
      researchDescription,
    };
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareData)); } catch { /* ignore */ }
    router.push('/compare');
  };

  const handleDemo = () => {
    setDescription(DEMO_DESCRIPTION);
    handleSearch(DEMO_DESCRIPTION, true);
    // clear the query param so the URL stays clean
    router.replace('/search');
  };

  // Auto-trigger demo when ?demo=true is in the URL
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      handleDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = isSearching || isMatching;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Dark navy header ─────────────────────────────────── */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                ← Home
              </Link>
              <span className="text-slate-700">|</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">🧭</span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Grant Compass
                  </h1>
                </div>
                <p className="mt-1 text-sm sm:text-base text-slate-400">
                  Find the perfect grant for your research in seconds
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <NavUserMenu onProfileChange={setProfile} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

          {/* Search card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400">
                {isGuest ? 'Try the demo, or sign in to search' : 'Describe your research or try the demo'}
              </p>
              <button
                onClick={handleDemo}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Try Demo
              </button>
            </div>

            {/* Guest + not in demo: locked overlay */}
            {isGuest && !isDemo ? (
              <div className="relative">
                {/* Blurred faux search bar */}
                <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
                  <div className="flex flex-col gap-4">
                    <div className="w-full rounded-lg border border-gray-300 bg-gray-50 h-32" />
                    <div className="flex justify-end">
                      <div className="rounded-lg bg-blue-600 h-9 w-28 opacity-60" />
                    </div>
                  </div>
                </div>
                {/* Lock card overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-lg px-6 py-5 text-center flex flex-col items-center gap-3 max-w-xs w-full">
                    <span className="text-3xl" aria-hidden="true">🔒</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Sign in to start finding grants</p>
                      <p className="mt-1 text-xs text-slate-500">Match your research to NIH and NSF funding</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/login"
                        className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <SearchBar
                  value={description}
                  onChange={setDescription}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  readOnly={isGuest && isDemo}
                  hideSubmit={isGuest}
                />

                {/* Refine suggestions — signed-in only */}
                {!isGuest && (suggestions.length > 0 || isSuggesting) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-400 mb-2.5">
                      ✦ Refine your search
                    </p>
                    {isSuggesting && suggestions.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Generating suggestions…
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setDescription(s);
                              handleSearch(s);
                            }}
                            disabled={isLoading}
                            className="text-left rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-xs text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors leading-relaxed"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Searches */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Searches</p>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => handleRestoreHistory(entry)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="text-xs text-slate-700 font-medium truncate max-w-xs">
                        {entry.description.length > 60
                          ? entry.description.slice(0, 60) + '…'
                          : entry.description}
                      </span>
                      <span className="flex-shrink-0 flex items-center gap-2 text-xs text-slate-400">
                        <span>{entry.grantCount} grant{entry.grantCount !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{relativeTime(entry.timestamp)}</span>
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(entry.id)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status banners */}
          {isSearching && <StatusBanner message="Searching NIH Reporter and NSF APIs…" />}
          {isMatching  && <StatusBanner message="Claude is ranking grants by relevance…" />}

          {/* Sample data notice */}
          {usedSampleData && matchResults.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Live APIs returned no results — showing sample grant data for demonstration.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!hasSearched && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <EmptyIllustration />
              <div>
                <p className="text-base font-medium text-slate-700">No search yet</p>
                <p className="mt-1 text-sm text-slate-400 max-w-xs">
                  Describe your research above and we&apos;ll match you with the most relevant NIH and NSF grants.
                </p>
              </div>
              <button
                onClick={handleDemo}
                className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See a live demo
              </button>
            </div>
          )}

          {/* Results */}
          {matchResults.length > 0 && (
            <section className="flex flex-col gap-4">

              {/* Demo banner for guests */}
              {isGuest && isDemo && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-base flex-shrink-0">👁️</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-indigo-900">You are viewing a demo.</p>
                      <p className="text-xs text-indigo-700 mt-0.5">Sign in to search with your own research description.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href="/login"
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">
                  Matched Grants
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {matchResults.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-400">Sorted by relevance</span>
              </div>

              {limitedMatches && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Limited matches found — try refining your description with more specific scientific terms.
                </div>
              )}

              {matchResults.map((result, i) => {
                const grantProps: GrantProps = {
                  title: result.grant.title,
                  agency: result.grant.agency,
                  score: result.score,
                  reason: result.reason,
                  amount: result.grant.amount,
                  deadline: result.grant.deadline,
                  description: result.grant.description,
                  url: result.grant.url,
                };
                return (
                  <div
                    key={`${result.grantId}-${i}`}
                    className={`animate-fade-in-up ${STAGGER[Math.min(i, STAGGER.length - 1)]}`}
                  >
                    <GrantCard
                      rank={i + 1}
                      index={i}
                      grant={grantProps}
                      onGenerateLetter={() => setActiveGrant(grantProps)}
                      compareSelected={compareIndices.includes(i)}
                      compareDisabled={compareIndices.length >= 2}
                      onCompareToggle={() => handleCompareToggle(i)}
                      guestMode={isGuest && isDemo}
                    />
                  </div>
                );
              })}
            </section>
          )}

        </div>
      </main>


      {/* Floating compare bar */}
      {compareIndices.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-[#0f172a] text-white shadow-2xl px-5 py-3 border border-slate-700 animate-fade-in-up">
          <div className="flex items-center gap-2">
            {compareIndices.map((idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {matchResults[idx]?.grant.title.slice(0, 24)}…
              </span>
            ))}
          </div>
          {compareIndices.length === 1 ? (
            <span className="text-xs text-slate-400">Select 1 more to compare</span>
          ) : (
            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold transition-colors"
            >
              Compare 2 grants
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setCompareIndices([])}
            className="ml-1 text-slate-400 hover:text-white transition-colors"
            title="Clear comparison"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Letter modal */}
      {activeGrant && (
        <LetterModal
          grant={activeGrant}
          researchDescription={researchDescription}
          profile={profile}
          onClose={() => setActiveGrant(null)}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500">
      <svg className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message}
    </div>
  );
}

function EmptyIllustration() {
  return (
    <svg
      width="160"
      height="140"
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="28" y="30" width="64" height="84" rx="6" fill="#e2e8f0" />
      <rect x="32" y="34" width="64" height="84" rx="6" fill="#f1f5f9" />
      <rect x="36" y="38" width="64" height="84" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="46" y="54" width="44" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="46" y="63" width="36" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="46" y="72" width="40" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="46" y="81" width="28" height="3" rx="1.5" fill="#e2e8f0" />
      <circle cx="104" cy="88" r="26" fill="#0f172a" />
      <circle cx="104" cy="88" r="22" fill="white" stroke="#0f172a" strokeWidth="2" />
      <circle cx="104" cy="88" r="14" fill="none" stroke="#94a3b8" strokeWidth="3" />
      <line x1="114" y1="98" x2="124" y2="108" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="98" cy="82" r="2.5" fill="#6366f1" />
      <circle cx="110" cy="85" r="1.5" fill="#8b5cf6" />
      <circle cx="103" cy="78" r="1.5" fill="#a5b4fc" />
    </svg>
  );
}
