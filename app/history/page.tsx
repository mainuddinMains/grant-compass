'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RESULTS_KEY, SEARCH_KEY } from '@/app/grants/[id]/page';

interface HistoryEntry {
  id: string;
  searchDescription: string;
  timestamp: number;
  grantsFound: number;
  topMatchScore: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullResults: any[];
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts));
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 76 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      Top: {score}
    </span>
  );
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searches, setSearches] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?from=/history');
      return;
    }
    if (status !== 'authenticated') return;

    // Load history and profile check in parallel
    Promise.all([
      fetch('/api/history').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
    ])
      .then(([historyData, profileData]) => {
        setSearches(historyData.searches ?? []);
        const complete = !!(profileData.university && profileData.department && profileData.position);
        setProfileComplete(complete);
      })
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleLoad = (entry: HistoryEntry) => {
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(entry.fullResults));
      localStorage.setItem(SEARCH_KEY, entry.searchDescription);
    } catch { /* ignore */ }
    router.push('/search');
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    setSearches((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all search history?')) return;
    await fetch('/api/history?all=true', { method: 'DELETE' });
    setSearches([]);
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
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
            <Link href="/search" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Search
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h1 className="text-xl font-bold">Search History</h1>
            </div>
            {session?.user?.name && (
              <span className="ml-auto text-xs text-slate-400">
                {session.user.name}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-4 sm:px-8 py-8 flex flex-col gap-6">

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Profile nudge */}
        {profileComplete === false && (
          <Link
            href="/search"
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 hover:bg-amber-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Complete your Researcher Profile</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Add your university and department so Grant Compass can personalize your Letters of Intent.
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold text-amber-700 group-hover:text-amber-900 transition-colors">
              Complete →
            </span>
          </Link>
        )}

        {searches.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
              🔍
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">No search history yet</p>
              <p className="mt-1 text-sm text-slate-400">Your searches will appear here after you find grants.</p>
            </div>
            <Link
              href="/search"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Search Grants →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">
                {searches.length} saved search{searches.length !== 1 ? 'es' : ''}
              </h2>
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {searches.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800 leading-snug flex-1">
                      {entry.searchDescription}
                    </p>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(entry.timestamp)}
                    </span>
                    <span>{entry.grantsFound} grant{entry.grantsFound !== 1 ? 's' : ''} found</span>
                    <ScoreChip score={entry.topMatchScore} />
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleLoad(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Load Results
                    </button>
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
