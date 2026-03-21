'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import type { NIHGrant } from '@/lib/nih';
import type { NSFAward } from '@/lib/nsf';

interface MatchResult {
  rank: number;
  grantIndex: number;
  matchScore: number;
  title: string;
  reasoning: string;
  keyAlignments: string[];
}

interface MatchResponse {
  matches: MatchResult[];
  coverLetter: string;
}

interface CombinedGrant {
  source: 'NIH' | 'NSF';
  title: string;
  agency: string;
  abstract: string;
  amount?: string | number;
  startDate?: string;
  endDate?: string;
  pi?: string;
  raw: NIHGrant | NSFAward;
}

function nihToGrant(g: NIHGrant): CombinedGrant {
  return {
    source: 'NIH',
    title: g.project_title,
    agency: `NIH – ${g.agency_ic_admin?.abbreviation ?? ''}`,
    abstract: g.abstract_text ?? '',
    amount: g.award_amount,
    startDate: g.project_start_date?.slice(0, 10),
    endDate: g.project_end_date?.slice(0, 10),
    pi: g.contact_pi_name,
    raw: g,
  };
}

function nsfToGrant(g: NSFAward): CombinedGrant {
  return {
    source: 'NSF',
    title: g.title,
    agency: `NSF – ${g.primaryProgram ?? ''}`,
    abstract: g.abstractText ?? '',
    amount: g.fundsObligatedAmt,
    startDate: g.date,
    endDate: g.expDate,
    pi: `${g.piFirstName ?? ''} ${g.piLastName ?? ''}`.trim(),
    raw: g,
  };
}

export default function Home() {
  const [grants, setGrants] = useState<CombinedGrant[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGrant, setActiveGrant] = useState<CombinedGrant | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSearch = async (query: string, profile: string) => {
    setIsSearching(true);
    setGrants([]);
    setMatches([]);
    setCoverLetter('');
    setErrors([]);

    try {
      const res = await fetch('/api/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      const combined: CombinedGrant[] = [
        ...(data.nih as NIHGrant[]).map(nihToGrant),
        ...(data.nsf as NSFAward[]).map(nsfToGrant),
      ];

      setGrants(combined);
      if (data.errors?.length) setErrors(data.errors);

      if (combined.length === 0) {
        setIsSearching(false);
        return;
      }

      // Pipe into the match API
      setIsMatching(true);
      setIsSearching(false);

      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researcherProfile: profile,
          grants: combined.map((g) => ({
            title: g.title,
            agency: g.agency,
            abstract: g.abstract,
          })),
        }),
      });

      const reader = matchRes.body?.getReader();
      const decoder = new TextDecoder();
      let raw = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
        }
      }

      try {
        const parsed: MatchResponse = JSON.parse(raw);
        setMatches(parsed.matches ?? []);
        setCoverLetter(parsed.coverLetter ?? '');
      } catch {
        setErrors((prev) => [...prev, 'Failed to parse match results from Claude.']);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Unexpected error']);
    } finally {
      setIsSearching(false);
      setIsMatching(false);
    }
  };

  const openLetter = (grant: CombinedGrant) => {
    setActiveGrant(grant);
    setModalOpen(true);
  };

  const matchedGrants = matches
    .map((m) => ({ match: m, grant: grants[m.grantIndex] }))
    .filter((x) => x.grant);

  const unmatchedGrants = grants.filter(
    (_, i) => !matches.some((m) => m.grantIndex === i)
  );

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
            Find NIH &amp; NSF grants matched to your research profile with AI.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Status */}
        {isSearching && (
          <p className="text-center text-sm text-gray-500 animate-pulse">
            Fetching grants from NIH and NSF…
          </p>
        )}
        {isMatching && (
          <p className="text-center text-sm text-gray-500 animate-pulse">
            Claude is analyzing matches…
          </p>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}

        {/* Top matches */}
        {matchedGrants.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Top Matches{' '}
              <span className="text-gray-400 font-normal">({matchedGrants.length})</span>
            </h2>
            {matchedGrants.map(({ match, grant }) => (
              <GrantCard
                key={`${grant.source}-${match.grantIndex}`}
                title={grant.title}
                agency={grant.agency}
                abstract={grant.abstract}
                amount={grant.amount}
                startDate={grant.startDate}
                endDate={grant.endDate}
                pi={grant.pi}
                matchScore={match.matchScore}
                reasoning={match.reasoning}
                keyAlignments={match.keyAlignments}
                rank={match.rank}
                onGenerateLetter={match.rank === 1 ? () => openLetter(grant) : undefined}
              />
            ))}
          </section>
        )}

        {/* All other results */}
        {unmatchedGrants.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              All Results{' '}
              <span className="text-gray-400 font-normal">({unmatchedGrants.length})</span>
            </h2>
            {unmatchedGrants.map((grant, i) => (
              <GrantCard
                key={`${grant.source}-unmatched-${i}`}
                title={grant.title}
                agency={grant.agency}
                abstract={grant.abstract}
                amount={grant.amount}
                startDate={grant.startDate}
                endDate={grant.endDate}
                pi={grant.pi}
              />
            ))}
          </section>
        )}
      </div>

      {/* Cover letter modal */}
      {modalOpen && activeGrant && (
        <LetterModal
          letter={coverLetter}
          grantTitle={activeGrant.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}
