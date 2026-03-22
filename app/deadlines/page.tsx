'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LetterModal from '@/components/LetterModal';
import type { SavedDeadline } from '@/lib/auth-db';
import type { GrantProps } from '@/components/GrantCard';

function AgencyBadge({ agency }: { agency: string }) {
  const upper = agency.toUpperCase();
  if (upper.includes('NIH') || upper.includes('NCI') || upper.includes('NHLBI') ||
      upper.includes('NIAID') || upper.includes('NIMH') || upper.includes('NIEHS')) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        NIH
      </span>
    );
  }
  if (upper.includes('NSF')) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        NSF
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      {agency}
    </span>
  );
}

function DaysCountdown({ deadline }: { deadline: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        Expired
      </span>
    );
  }

  const color =
    days < 14 ? 'bg-red-100 text-red-700' :
    days < 30 ? 'bg-orange-100 text-orange-700' :
    days < 60 ? 'bg-amber-100 text-amber-700' :
    'bg-green-100 text-green-700';

  const label = days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  );
}

export default function DeadlinesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [deadlines, setDeadlines] = useState<SavedDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [letterGrant, setLetterGrant] = useState<GrantProps | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/deadlines')
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.deadlines as SavedDeadline[]).sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        setDeadlines(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  const remove = async (grantUrl: string) => {
    setRemoving(grantUrl);
    await fetch('/api/deadlines', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grantUrl }),
    });
    setDeadlines((prev) => prev.filter((d) => d.grantUrl !== grantUrl));
    setRemoving(null);
  };

  const formattedAmount = (amount: number | null) =>
    amount != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
          notation: 'compact',
          compactDisplay: 'short',
        }).format(amount)
      : null;

  const firstName = session?.user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🧭</span>
            <span className="text-lg font-bold tracking-tight">Grant Compass</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* ── Page title ────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Deadlines</h1>
          <p className="mt-1 text-sm text-slate-500">
            {firstName ? `Saved grants for ${firstName} — ` : ''}
            sorted by soonest deadline
          </p>
        </div>

        {/* ── Loading ───────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────── */}
        {!loading && deadlines.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">
              🔔
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">No saved deadlines yet</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Find grants and save their deadlines to track them here.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Search Grants →
            </Link>
          </div>
        )}

        {/* ── Deadline list ─────────────────────────────────── */}
        {!loading && deadlines.length > 0 && (
          <div className="flex flex-col gap-4">
            {deadlines.map((d) => {
              const amt = formattedAmount(d.fundingAmount);
              const deadlineDate = d.deadline
                ? new Date(d.deadline).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : null;

              const grantForLetter: GrantProps = {
                title: d.grantTitle,
                agency: d.agency,
                score: 0,
                reason: '',
                amount: d.fundingAmount,
                deadline: d.deadline,
                description: '',
                url: d.grantUrl,
              };

              return (
                <div
                  key={d.grantUrl}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AgencyBadge agency={d.agency} />
                      {d.deadline && <DaysCountdown deadline={d.deadline} />}
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 leading-snug">
                      {d.grantTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {deadlineDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {deadlineDate}
                        </span>
                      )}
                      {amt && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {amt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap sm:flex-col items-center sm:items-stretch gap-2 sm:w-36 flex-shrink-0">
                    {d.grantUrl && (
                      <a
                        href={d.grantUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
                      >
                        View Grant
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => setLetterGrant(grantForLetter)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Letter
                    </button>
                    <button
                      onClick={() => remove(d.grantUrl)}
                      disabled={removing === d.grantUrl}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors disabled:opacity-50"
                    >
                      {removing === d.grantUrl ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {letterGrant && (
        <LetterModal
          grant={letterGrant}
          researchDescription=""
          profile={null}
          onClose={() => setLetterGrant(null)}
        />
      )}
    </div>
  );
}
