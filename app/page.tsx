'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import { sampleGrants } from '@/lib/sampleGrants';
import type { Grant } from '@/lib/nih';
import type { GrantProps } from '@/components/GrantCard';

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

function extractKeywords(description: string): string {
  const stopWords = new Set([
    'a','an','the','and','or','of','in','to','for','is','on',
    'with','that','this','it','by','are','at','be','as','my','i','we','our',
  ]);
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 8)
    .join(' ');
}

export default function Home() {
  const [description, setDescription] = useState('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchDescription, setResearchDescription] = useState('');
  const [activeGrant, setActiveGrant] = useState<GrantProps | null>(null);
  const [usedSampleData, setUsedSampleData] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (desc: string) => {
    setResearchDescription(desc);
    setIsSearching(true);
    setMatchResults([]);
    setError(null);
    setUsedSampleData(false);
    setHasSearched(true);

    try {
      let grants: Grant[] = [];

      try {
        const keywords = extractKeywords(desc);
        const grantsRes = await fetch(`/api/grants?q=${encodeURIComponent(keywords)}`);
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

      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchDescription: desc, grants }),
      });

      if (!matchRes.ok) throw new Error(`Match API error: ${matchRes.status}`);

      const matchData = await matchRes.json();
      setMatchResults(matchData.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSearching(false);
      setIsMatching(false);
    }
  };

  const handleDemo = () => {
    setDescription(DEMO_DESCRIPTION);
    handleSearch(DEMO_DESCRIPTION);
  };

  const isLoading = isSearching || isMatching;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Dark navy header ─────────────────────────────────── */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

            {/* Demo badge */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Powered by Claude AI
              </span>
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
                Describe your research or try the demo
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
            <SearchBar
              value={description}
              onChange={setDescription}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

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
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">
                  Matched Grants
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {matchResults.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-400">Sorted by relevance</span>
              </div>

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
                      grant={grantProps}
                      onGenerateLetter={() => setActiveGrant(grantProps)}
                    />
                  </div>
                );
              })}
            </section>
          )}

        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Powered by{' '}
            <span className="font-medium text-slate-500">NIH Reporter</span>
            {', '}
            <span className="font-medium text-slate-500">NSF API</span>
            {', and '}
            <span className="font-medium text-slate-500">Claude AI</span>
          </span>
          <span>Built at TrueHacks 2025</span>
        </div>
      </footer>

      {/* Letter modal */}
      {activeGrant && (
        <LetterModal
          grant={activeGrant}
          researchDescription={researchDescription}
          onClose={() => setActiveGrant(null)}
        />
      )}
    </div>
  );
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
      {/* Background documents */}
      <rect x="28" y="30" width="64" height="84" rx="6" fill="#e2e8f0" />
      <rect x="32" y="34" width="64" height="84" rx="6" fill="#f1f5f9" />
      <rect x="36" y="38" width="64" height="84" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />

      {/* Document lines */}
      <rect x="46" y="54" width="44" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="46" y="63" width="36" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="46" y="72" width="40" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="46" y="81" width="28" height="3" rx="1.5" fill="#e2e8f0" />

      {/* Magnifying glass */}
      <circle cx="104" cy="88" r="26" fill="#0f172a" />
      <circle cx="104" cy="88" r="22" fill="white" stroke="#0f172a" strokeWidth="2" />
      <circle cx="104" cy="88" r="14" fill="none" stroke="#94a3b8" strokeWidth="3" />
      <line x1="114" y1="98" x2="124" y2="108" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

      {/* Sparkle on glass */}
      <circle cx="98" cy="82" r="2.5" fill="#6366f1" />
      <circle cx="110" cy="85" r="1.5" fill="#8b5cf6" />
      <circle cx="103" cy="78" r="1.5" fill="#a5b4fc" />
    </svg>
  );
}
