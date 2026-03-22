'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LetterModal from '@/components/LetterModal';
import type { GrantProps } from '@/components/GrantCard';

const COMPARE_KEY = 'grant_compass_compare';

interface CompareGrant {
  title: string;
  agency: string;
  score: number;
  reason: string;
  amount: number | null;
  deadline: string | null;
  description: string;
  url?: string;
}

interface CompareData {
  grant1: CompareGrant;
  grant2: CompareGrant;
  researchDescription: string;
}

function AgencyBadge({ agency }: { agency: string }) {
  const upper = agency.toUpperCase();
  if (upper.includes('NIH'))
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">NIH</span>;
  if (upper.includes('NSF'))
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">NSF</span>;
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{agency}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color = clamped >= 76 ? 'bg-green-500' : clamped >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  const textColor = clamped >= 76 ? 'text-green-700' : clamped >= 50 ? 'text-yellow-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{clamped}</span>
    </div>
  );
}

function DeadlineCountdown({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-gray-400 text-sm">—</span>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(deadline); due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return <span className="text-gray-400 text-sm">Passed</span>;
  const color = days < 30 ? 'text-red-600' : days <= 60 ? 'text-orange-600' : 'text-green-600';
  return <span className={`text-sm font-medium ${color}`}>{deadline}</span>;
}

function RowLabel({ label }: { label: string }) {
  return (
    <div className="py-3 px-4 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {label}
    </div>
  );
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`py-3 px-4 border-b border-slate-100 text-sm ${highlight ? 'bg-green-50' : 'bg-white'}`}>
      {children}
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [data, setData] = useState<CompareData | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loadingRec, setLoadingRec] = useState(false);
  const [activeGrant, setActiveGrant] = useState<GrantProps | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (!stored) { router.push('/search'); return; }
      const parsed: CompareData = JSON.parse(stored);
      setData(parsed);
      // Fetch recommendation
      setLoadingRec(true);
      fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
        .then((r) => r.json())
        .then((d) => { setRecommendation(d.recommendation ?? ''); })
        .catch(() => {})
        .finally(() => setLoadingRec(false));
    } catch {
      router.push('/search');
    }
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  const { grant1, grant2, researchDescription } = data;

  // Which grant has higher amount and sooner deadline
  const higherAmount = (grant1.amount ?? 0) >= (grant2.amount ?? 0) ? 'g1' : 'g2';
  const soonerDeadline = (() => {
    if (!grant1.deadline && !grant2.deadline) return null;
    if (!grant1.deadline) return 'g2';
    if (!grant2.deadline) return 'g1';
    return new Date(grant1.deadline) <= new Date(grant2.deadline) ? 'g1' : 'g2';
  })();

  const toGrantProps = (g: CompareGrant, desc: string): GrantProps => ({
    title: g.title, agency: g.agency, score: g.score, reason: g.reason,
    amount: g.amount, deadline: g.deadline, description: g.description, url: g.url ?? '',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Results
            </button>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <h1 className="text-xl font-bold">Grant Comparison</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* AI Recommendation box */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h2 className="text-sm font-bold text-violet-800">Claude AI Recommendation</h2>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 px-2 py-0.5 text-xs text-violet-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Powered by Claude
            </span>
          </div>
          {loadingRec ? (
            <div className="flex items-center gap-2 text-sm text-violet-500">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Generating recommendation…
            </div>
          ) : recommendation ? (
            <p className="text-sm text-violet-900 leading-relaxed">{recommendation}</p>
          ) : (
            <p className="text-sm text-violet-400 italic">Unable to generate recommendation.</p>
          )}
        </div>

        {/* ── Desktop: 3-column table ─── */}
        <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Column headers */}
          <div className="grid grid-cols-[180px_1fr_1fr] border-b border-slate-200">
            <div className="bg-slate-50 px-4 py-4" />
            {[grant1, grant2].map((g, gi) => (
              <div key={gi} className={`px-4 py-4 ${gi === 0 ? 'border-l border-slate-100' : 'border-l border-slate-100'}`}>
                <AgencyBadge agency={g.agency} />
                <h3 className="mt-2 text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {g.url ? (
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{g.title}</a>
                  ) : g.title}
                </h3>
              </div>
            ))}
          </div>

          {/* Match Score */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Match Score" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi}>
                <ScoreBar score={g.score} />
              </Cell>
            ))}
          </div>

          {/* Funding Amount */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Funding Amount" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi} highlight={g.amount != null && ((gi === 0 && higherAmount === 'g1') || (gi === 1 && higherAmount === 'g2'))}>
                {g.amount != null ? (
                  <span className="font-semibold text-slate-800">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' }).format(g.amount)}
                  </span>
                ) : <span className="text-slate-400">—</span>}
              </Cell>
            ))}
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Deadline" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi} highlight={(gi === 0 && soonerDeadline === 'g1') || (gi === 1 && soonerDeadline === 'g2')}>
                <DeadlineCountdown deadline={g.deadline} />
              </Cell>
            ))}
          </div>

          {/* Days Remaining */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Days Remaining" />
            {[grant1, grant2].map((g, gi) => {
              if (!g.deadline) return <Cell key={gi}><span className="text-slate-400">—</span></Cell>;
              const today = new Date(); today.setHours(0,0,0,0);
              const due = new Date(g.deadline); due.setHours(0,0,0,0);
              const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
              const color = days < 0 ? 'text-slate-400' : days < 30 ? 'text-red-600' : days <= 60 ? 'text-orange-600' : 'text-green-700';
              return (
                <Cell key={gi}>
                  <span className={`font-semibold ${color}`}>
                    {days < 0 ? 'Passed' : `${days} day${days !== 1 ? 's' : ''}`}
                  </span>
                </Cell>
              );
            })}
          </div>

          {/* Match Reason */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Why it Matches" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi}>
                <p className="text-xs text-slate-600 italic leading-relaxed">{g.reason || '—'}</p>
              </Cell>
            ))}
          </div>

          {/* Description */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Description" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi}>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{g.description || '—'}</p>
              </Cell>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-[180px_1fr_1fr]">
            <RowLabel label="Actions" />
            {[grant1, grant2].map((g, gi) => (
              <Cell key={gi}>
                <div className="flex flex-wrap gap-2">
                  {g.url && (
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      Apply Now ↗
                    </a>
                  )}
                  <button
                    onClick={() => setActiveGrant(toGrantProps(g, researchDescription))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Generate Letter
                  </button>
                </div>
              </Cell>
            ))}
          </div>

        </div>

        {/* ── Mobile: stacked cards with VS divider ─── */}
        <div className="sm:hidden flex flex-col gap-4">
          {[grant1, grant2].map((g, gi) => (
            <div key={gi}>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <AgencyBadge agency={g.agency} />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {g.url ? (
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{g.title}</a>
                  ) : g.title}
                </h3>
                <ScoreBar score={g.score} />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Funding</p>
                    <p className="font-semibold text-slate-800">
                      {g.amount != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' }).format(g.amount)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Deadline</p>
                    <DeadlineCountdown deadline={g.deadline} />
                  </div>
                </div>

                {g.reason && (
                  <p className="text-xs text-slate-600 italic border-l-2 border-blue-200 pl-3 leading-relaxed">{g.reason}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {g.url && (
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      Apply Now ↗
                    </a>
                  )}
                  <button
                    onClick={() => setActiveGrant(toGrantProps(g, researchDescription))}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Generate Letter
                  </button>
                </div>
              </div>

              {gi === 0 && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-16 bg-slate-200" />
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">VS</span>
                    <div className="h-px w-16 bg-slate-200" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

      {/* Letter modal */}
      {activeGrant && (
        <LetterModal
          grant={activeGrant}
          researchDescription={researchDescription}
          profile={null}
          onClose={() => setActiveGrant(null)}
        />
      )}
    </div>
  );
}
