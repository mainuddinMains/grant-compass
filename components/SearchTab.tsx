'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import type { ResearcherProfile } from '@/components/ProfileForm';
import { sampleGrants } from '@/lib/sampleGrants';
import { RESULTS_KEY, SEARCH_KEY } from '@/app/grants/[id]/page';
import type { Grant } from '@/lib/nih';
import type { GrantProps } from '@/components/GrantCard';
import type { MatchResult, SuccessPrediction } from '@/lib/types';

const HISTORY_KEY = 'grant_compass_history';
const COMPARE_KEY = 'grant_compass_compare';
const STAGGER = ['', 'animation-delay-75', 'animation-delay-150', 'animation-delay-225', 'animation-delay-300', 'animation-delay-375'];

interface SearchTabProps {
  initialQuery: string;
  preloadedResults: MatchResult[] | null;
  profile: ResearcherProfile | null;
}

export default function SearchTab({ initialQuery, preloadedResults, profile }: SearchTabProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [description, setDescription] = useState(initialQuery);
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
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  const [predictions, setPredictions] = useState<Record<number, SuccessPrediction>>({});
  const [predictingIndices, setPredictingIndices] = useState<Set<number>>(new Set());

  // On mount: load preloaded results or trigger a fresh search
  useEffect(() => {
    if (preloadedResults && preloadedResults.length > 0 && initialQuery) {
      setMatchResults(preloadedResults);
      setResearchDescription(initialQuery);
      setDescription(initialQuery);
      setHasSearched(true);
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(preloadedResults));
        localStorage.setItem(SEARCH_KEY, initialQuery);
      } catch { /* ignore */ }
    } else if (initialQuery) {
      setDescription(initialQuery);
      void handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (desc: string) => {
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
      } catch { /* fall through to sample data */ }

      if (grants.length === 0) {
        grants = sampleGrants;
        setUsedSampleData(true);
      }

      setIsMatching(true);
      setIsSearching(false);
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
      setPredictions({});
      setPredictingIndices(new Set());

      // Fire success predictions for top 3 grants (non-blocking)
      const top3 = finalResults
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.score > 40)
        .slice(0, 3);
      if (top3.length > 0) {
        setPredictingIndices(new Set(top3.map(({ i }) => i)));
        top3.forEach(({ r, i }) => {
          void (async () => {
            try {
              const predRes = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  grant: { title: r.grant.title, agency: r.grant.agency, description: r.grant.description },
                  researchDescription: desc,
                }),
              });
              if (predRes.ok) {
                const predData = await predRes.json();
                if (predData.prediction) setPredictions((prev) => ({ ...prev, [i]: predData.prediction }));
              }
            } catch { /* silently skip */ }
            setPredictingIndices((prev) => { const next = new Set(prev); next.delete(i); return next; });
          })();
        });
      }

      // Persist results for grant detail page
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(finalResults));
        localStorage.setItem(SEARCH_KEY, desc);
      } catch { /* ignore */ }

      // Save to localStorage history
      try {
        const topScore = finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.score)) : 0;
        const entry = { id: Date.now().toString(), description: desc, timestamp: Date.now(), grantCount: finalResults.length, topScore, results: finalResults };
        const stored = localStorage.getItem(HISTORY_KEY);
        const prev: { description: string }[] = stored ? JSON.parse(stored) : [];
        const deduped = prev.filter((e) => e.description !== desc);
        localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...deduped].slice(0, 5)));
      } catch { /* ignore */ }

      // Save to server history
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
      grant1: { title: g1.grant.title, agency: g1.grant.agency, score: g1.score, reason: g1.reason, amount: g1.grant.amount, deadline: g1.grant.deadline, description: g1.grant.description, url: g1.grant.url },
      grant2: { title: g2.grant.title, agency: g2.grant.agency, score: g2.score, reason: g2.reason, amount: g2.grant.amount, deadline: g2.grant.deadline, description: g2.grant.description, url: g2.grant.url },
      researchDescription,
    };
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareData)); } catch { /* ignore */ }
    router.push('/compare');
  };

  const isLoading = isSearching || isMatching;

  return (
    <div className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* Search card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-sm">
        <SearchBar
          value={description}
          onChange={setDescription}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Refine suggestions */}
        {(suggestions.length > 0 || isSuggesting) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-400 mb-2.5">✦ Refine your search</p>
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
                    onClick={() => { setDescription(s); void handleSearch(s); }}
                    disabled={isLoading}
                    className="text-left rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3.5 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading banners */}
      {isSearching && <StatusBanner message="Searching NIH Reporter and NSF APIs…" />}
      {isMatching  && <StatusBanner message="Claude is ranking grants by relevance…" />}

      {/* Sample data notice */}
      {usedSampleData && matchResults.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Live APIs returned no results — showing sample grant data for demonstration.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <svg className="w-16 h-16 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">Ready to search</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              Describe your research in plain English to find matching NIH and NSF grants.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {matchResults.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Matched Grants
              <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                {matchResults.length}
              </span>
            </h2>
            <span className="text-xs text-slate-400">Sorted by relevance</span>
          </div>

          {limitedMatches && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
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
              <div key={`${result.grantId}-${i}`} className={`animate-fade-in-up ${STAGGER[Math.min(i, STAGGER.length - 1)]}`}>
                <GrantCard
                  rank={i + 1}
                  index={i}
                  grant={grantProps}
                  onGenerateLetter={() => setActiveGrant(grantProps)}
                  compareSelected={compareIndices.includes(i)}
                  compareDisabled={compareIndices.length >= 2}
                  onCompareToggle={() => handleCompareToggle(i)}
                  guestMode={false}
                  prediction={predictions[i]}
                  predictionLoading={predictingIndices.has(i)}
                />
              </div>
            );
          })}
        </section>
      )}

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
          <button onClick={() => setCompareIndices([])} className="ml-1 text-slate-400 hover:text-white transition-colors" title="Clear">
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

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
      <svg className="animate-spin h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message}
    </div>
  );
}
