'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LetterModal from '@/components/LetterModal';
import SaveDeadlineButton from '@/components/SaveDeadlineButton';
import ChecklistCard from '@/components/ChecklistCard';
import { loadProfile } from '@/components/ProfileForm';
import type { ResearcherProfile } from '@/components/ProfileForm';
import type { Grant } from '@/lib/nih';
import type { SuccessPrediction } from '@/lib/types';

export const RESULTS_KEY = 'grant_compass_results';
export const SEARCH_KEY = 'grant_compass_search';

interface MatchResult {
  grantId: number;
  score: number;
  reason: string;
  grant: Grant;
}

/* ── Shared display components ─────────────────────────────── */

function AgencyBadge({ agency }: { agency: string }) {
  const upper = agency.toUpperCase();
  if (upper.includes('NIH') || upper.includes('HHS') || upper.includes('NCI') ||
      upper.includes('NHLBI') || upper.includes('NIAID') || upper.includes('NIMH') ||
      upper.includes('NIEHS') || upper.includes('NINDS') || upper.includes('NIA')) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
        NIH
      </span>
    );
  }
  if (upper.includes('NSF')) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
        NSF
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
      {agency}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  let barColor: string, labelColor: string, label: string;
  if (clamped >= 76) {
    barColor = 'bg-green-500'; labelColor = 'text-green-700'; label = 'Strong match';
  } else if (clamped >= 50) {
    barColor = 'bg-yellow-400'; labelColor = 'text-yellow-700'; label = 'Moderate match';
  } else {
    barColor = 'bg-red-400'; labelColor = 'text-red-700'; label = 'Weak match';
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${labelColor}`}>{label}</span>
        <span className={`text-2xl font-bold tabular-nums ${labelColor}`}>{clamped}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">out of 100</p>
    </div>
  );
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return null;

  let textColor: string, bgColor: string, label: string;
  if (days < 30) {
    textColor = 'text-red-700'; bgColor = 'bg-red-50 border-red-200';
    label = days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} remaining`;
  } else if (days <= 60) {
    textColor = 'text-orange-700'; bgColor = 'bg-orange-50 border-orange-200';
    label = `${days} days remaining`;
  } else {
    textColor = 'text-green-700'; bgColor = 'bg-green-50 border-green-200';
    label = `${days} days remaining`;
  }

  return (
    <div className={`rounded-xl border px-5 py-4 ${bgColor}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">Application Deadline</p>
      <p className={`text-xl font-bold ${textColor}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-1">
        {due.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

/** Render eligibility text: lines starting with •/–/- become list items */
function EligibilityText({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  const bullets = lines.filter((l) => /^[•\-–*]/.test(l.trim()));
  const hasBullets = bullets.length > 0;

  if (!hasBullets) {
    return <p className="text-sm text-slate-600 leading-relaxed">{text}</p>;
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isBullet = /^[•\-–*]/.test(trimmed);
        const content = isBullet ? trimmed.replace(/^[•\-–*]\s*/, '') : trimmed;
        if (!content) return null;
        return isBullet ? (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
            <span className="leading-relaxed">{content}</span>
          </li>
        ) : (
          <p key={i} className="text-sm text-slate-600 leading-relaxed font-medium mt-3">{content}</p>
        );
      })}
    </ul>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function GrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [researchDescription, setResearchDescription] = useState('');
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [eligibility, setEligibility] = useState('');
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [showLetter, setShowLetter] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [prediction, setPrediction] = useState<SuccessPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());

    try {
      const raw = localStorage.getItem(RESULTS_KEY);
      const results: MatchResult[] = raw ? JSON.parse(raw) : [];
      const found = results[id];
      if (!found) { setNotFound(true); return; }

      setResult(found);
      const desc = localStorage.getItem(SEARCH_KEY) ?? '';
      setResearchDescription(desc);

      // Fire success prediction if score > 40
      if (found.score > 40 && desc) {
        setPredictionLoading(true);
        fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant: { title: found.grant.title, agency: found.grant.agency, description: found.grant.description },
            researchDescription: desc,
          }),
        })
          .then((r) => r.json())
          .then((data) => { if (data.prediction) setPrediction(data.prediction); })
          .catch(() => { /* silently skip */ })
          .finally(() => setPredictionLoading(false));
      }

      fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: found.grant.title,
          description: found.grant.description,
          agency: found.grant.agency,
        }),
      })
        .then((r) => r.json())
        .then((data) => setEligibility(data.eligibility ?? ''))
        .catch(() => setEligibility('Could not load eligibility requirements.'))
        .finally(() => setEligibilityLoading(false));
    } catch {
      setNotFound(true);
    }
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-600">Grant not found. Results may have expired.</p>
        <Link href="/search" className="text-blue-600 hover:underline text-sm">
          ← Back to Search
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  const { grant, score, reason } = result;
  const formattedAmount =
    grant.amount != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
          notation: 'compact',
          compactDisplay: 'short',
        }).format(grant.amount)
      : null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-[#0f172a] text-white shadow-lg sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Results
            </button>
            <span className="text-slate-700">|</span>
            <Link href="/" className="flex items-center gap-2 text-white font-bold hover:text-slate-300 transition-colors">
              <span aria-hidden="true">🧭</span>
              <span className="hidden sm:inline">Grant Compass</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left column ──────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Title card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <AgencyBadge agency={grant.agency} />
                <span className="text-sm text-slate-400">{grant.agency}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {grant.title}
              </h1>
            </div>

            {/* Claude's match reason */}
            {reason && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Why Claude matched this grant
                  </p>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">{reason}</p>
              </div>
            )}

            {/* Full description */}
            {grant.description ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Description
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{grant.description}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Description
                </h2>
                <p className="text-sm text-slate-400 italic">
                  Full description not available — visit the grant listing for complete details.
                </p>
                {grant.url && (
                  <a
                    href={grant.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    View full listing
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Application Checklist */}
            <ChecklistCard
              grantUrl={grant.url ?? grant.title}
              grantTitle={grant.title}
              grantAgency={grant.agency}
              grantDescription={grant.description ?? ''}
            />

            {/* Eligibility */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Eligibility Requirements
              </h2>
              {eligibilityLoading ? (
                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                  <svg className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Claude is extracting eligibility requirements…
                </div>
              ) : (
                <EligibilityText text={eligibility} />
              )}
            </div>

          </div>

          {/* ── Right sidebar (sticky on desktop) ─────────── */}
          <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-20 flex flex-col gap-4">

            {/* Match score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Match Score
              </h3>
              <ScoreBar score={score} />
            </div>

            {/* AI Success Prediction */}
            {(predictionLoading || prediction) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                  🎯 AI Success Prediction
                </h3>
                {predictionLoading && !prediction ? (
                  <div className="flex items-center gap-2.5 text-sm text-slate-400">
                    <svg className="animate-spin h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Analyzing your chances…
                  </div>
                ) : prediction && (
                  <div className="space-y-4">
                    {/* Success score bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Success likelihood</span>
                        <span className={`text-xl font-bold tabular-nums ${prediction.successScore >= 65 ? 'text-emerald-600' : prediction.successScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {prediction.successScore}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${prediction.successScore >= 65 ? 'bg-emerald-500' : prediction.successScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${prediction.successScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Competition + Effort badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1">Competition</p>
                        <p className={`text-sm font-bold ${
                          prediction.competitionLevel === 'Low' ? 'text-emerald-600' :
                          prediction.competitionLevel === 'Medium' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>{prediction.competitionLevel}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1">Effort vs Reward</p>
                        <p className={`text-sm font-bold ${
                          prediction.effortVsReward === 'Excellent' ? 'text-emerald-600' :
                          prediction.effortVsReward === 'Good' ? 'text-blue-600' :
                          prediction.effortVsReward === 'Fair' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>{prediction.effortVsReward}</p>
                      </div>
                    </div>

                    {/* Effort score */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Application effort</span>
                        <span className="text-xs font-semibold text-slate-600">{prediction.effortScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-400 transition-all duration-700"
                          style={{ width: `${prediction.effortScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Winning factors */}
                    {prediction.winningFactors?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                          <span>✓</span> Winning Factors
                        </p>
                        <ul className="space-y-1">
                          {prediction.winningFactors.map((f, i) => (
                            <li key={i} className="text-xs text-slate-600 leading-snug flex items-start gap-1.5">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Red flags */}
                    {prediction.redFlags?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                          <span>⚠</span> Watch Out For
                        </p>
                        <ul className="space-y-1">
                          {prediction.redFlags.map((f, i) => (
                            <li key={i} className="text-xs text-slate-600 leading-snug flex items-start gap-1.5">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      AI estimate based on your research profile. Results may vary.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Deadline */}
            {grant.deadline && <DeadlineCountdown deadline={grant.deadline} />}

            {/* Funding amount */}
            {formattedAmount && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Funding Amount
                </h3>
                <p className="text-3xl font-bold text-slate-900">{formattedAmount}</p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              {grant.url && (
                <a
                  href={grant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3.5 text-sm font-bold text-white transition-colors shadow-sm"
                >
                  Apply Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              <button
                onClick={() => setShowLetter(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 px-5 py-3.5 text-sm font-semibold text-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Letter of Intent
              </button>

              {grant.url && (
                <SaveDeadlineButton
                  grantTitle={grant.title}
                  agency={grant.agency}
                  deadline={grant.deadline}
                  fundingAmount={grant.amount}
                  grantUrl={grant.url}
                  large
                />
              )}
            </div>

          </aside>

        </div>
      </main>

      {showLetter && (
        <LetterModal
          grant={{ ...grant, score, reason }}
          researchDescription={researchDescription}
          profile={profile}
          onClose={() => setShowLetter(false)}
        />
      )}
    </div>
  );
}
