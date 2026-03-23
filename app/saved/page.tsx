'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSavedGrants, unsaveGrant } from '@/lib/savedGrants';
import type { SavedGrant } from '@/lib/savedGrants';

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts));
}

function AgencyBadge({ agency }: { agency: string }) {
  const upper = agency.toUpperCase();
  if (upper.includes('NIH'))
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">NIH</span>;
  if (upper.includes('NSF'))
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">NSF</span>;
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{agency}</span>;
}

export default function SavedPage() {
  const { status } = useSession();
  const router = useRouter();
  const [grants, setGrants] = useState<SavedGrant[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?from=/saved');
      return;
    }
    if (status === 'authenticated') {
      setGrants(getSavedGrants());
    }
  }, [status, router]);

  const handleUnsave = (id: string) => {
    unsaveGrant(id);
    setGrants((prev) => prev.filter((g) => g.savedId !== id));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-8 lg:px-12 py-5">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h1 className="text-xl font-bold">Saved Grants</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-4 sm:px-8 py-8 flex flex-col gap-6">

        {grants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">No saved grants yet</p>
              <p className="mt-1 text-sm text-slate-400">Bookmark grants you&apos;re interested in and they&apos;ll appear here.</p>
            </div>
            <Link
              href="/dashboard"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Find Grants →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">
                {grants.length} saved grant{grants.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {grants.map((grant) => (
                <div
                  key={grant.savedId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <AgencyBadge agency={grant.agency} />
                        <span className="text-xs text-slate-400">Saved {formatDate(grant.savedAt)}</span>
                      </div>
                      {grant.url ? (
                        <a
                          href={grant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-slate-800 leading-snug hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {grant.title}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{grant.title}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleUnsave(grant.savedId)}
                      title="Remove from saved"
                      className="flex-shrink-0 text-indigo-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>

                  {grant.reason && (
                    <p className="text-xs text-slate-500 leading-relaxed border-l-2 border-blue-200 pl-3 italic line-clamp-2">
                      {grant.reason}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {grant.amount != null
                        ? <span className="font-medium text-slate-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' }).format(grant.amount)}</span>
                        : <span className="text-slate-400 italic">Amount not specified</span>
                      }
                    </span>
                    {grant.deadline && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(grant.deadline))}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Match score: <span className="font-semibold text-slate-700">{grant.score}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
