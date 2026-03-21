'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import type { Grant } from '@/lib/nih';
import type { GrantProps } from '@/components/GrantCard';

interface MatchResult {
  grantId: number;
  score: number;
  reason: string;
  grant: Grant;
}

// Pull up to 8 meaningful words from the description to use as the keyword query
function extractKeywords(description: string): string {
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'to', 'for', 'is', 'on', 'with', 'that', 'this', 'it', 'by', 'are', 'at', 'be', 'as', 'my', 'i', 'we', 'our']);
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 8)
    .join(' ');
}

export default function Home() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchDescription, setResearchDescription] = useState('');
  const [activeGrant, setActiveGrant] = useState<GrantProps | null>(null);

  const handleSearch = async (description: string) => {
    setResearchDescription(description);
    setIsSearching(true);
    setMatchResults([]);
    setError(null);

    try {
      // Step 1: fetch grants using keywords extracted from the description
      const keywords = extractKeywords(description);
      const grantsRes = await fetch(`/api/grants?q=${encodeURIComponent(keywords)}`);

      if (!grantsRes.ok) throw new Error(`Grants API error: ${grantsRes.status}`);

      const grantsData = await grantsRes.json();
      const grants: Grant[] = grantsData.grants ?? [];

      if (grants.length === 0) {
        setError('No grants found for your research area. Try rephrasing your description.');
        return;
      }

      // Step 2: rank grants against the full description via Claude
      setIsMatching(true);
      setIsSearching(false);

      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchDescription: description, grants }),
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

  const isLoading = isSearching || isMatching;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 flex flex-col gap-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Grant Compass
          </h1>
          <p className="mt-2 text-gray-500">
            Describe your research and we&apos;ll find the best NIH &amp; NSF grants for you.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Status banners */}
        {isSearching && (
          <StatusBanner message="Fetching grants from NIH and NSF…" />
        )}
        {isMatching && (
          <StatusBanner message="Claude is ranking grants by relevance…" />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {matchResults.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Matched Grants{' '}
              <span className="font-normal text-gray-400">({matchResults.length})</span>
            </h2>

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
                <GrantCard
                  key={`${result.grantId}-${i}`}
                  rank={i + 1}
                  grant={grantProps}
                  onGenerateLetter={() => setActiveGrant(grantProps)}
                />
              );
            })}
          </section>
        )}

      </div>

      {activeGrant && (
        <LetterModal
          grant={activeGrant}
          researchDescription={researchDescription}
          onClose={() => setActiveGrant(null)}
        />
      )}
    </main>
  );
}

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
      <svg
        className="animate-spin h-4 w-4 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message}
    </div>
  );
}
