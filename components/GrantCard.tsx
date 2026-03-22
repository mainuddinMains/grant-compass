'use client';

import { useRouter } from 'next/navigation';
import SaveDeadlineButton from '@/components/SaveDeadlineButton';
import type { SuccessPrediction } from '@/lib/types';

export interface GrantProps {
  title: string;
  agency: string;
  score: number;
  reason: string;
  amount: number | null;
  deadline: string | null;
  description: string;
  url: string;
}

interface GrantCardProps {
  grant: GrantProps;
  rank?: number;
  index?: number;
  onGenerateLetter?: () => void;
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onCompareToggle?: () => void;
  guestMode?: boolean;
  prediction?: SuccessPrediction;
  predictionLoading?: boolean;
}

function AgencyBadge({ agency }: { agency: string }) {
  const upper = agency.toUpperCase();
  if (upper.includes('NIH')) {
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

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));

  let barColor: string;
  let labelColor: string;
  let label: string;

  if (clamped >= 76) {
    barColor = 'bg-green-500';
    labelColor = 'text-green-700';
    label = 'Strong match';
  } else if (clamped >= 50) {
    barColor = 'bg-yellow-400';
    labelColor = 'text-yellow-700';
    label = 'Moderate match';
  } else {
    barColor = 'bg-red-400';
    labelColor = 'text-red-700';
    label = 'Weak match';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${labelColor}`}>
        {clamped}
      </span>
      <span className={`text-xs ${labelColor} hidden sm:inline`}>{label}</span>
    </div>
  );
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  let textColor: string;
  let bgColor: string;
  let label: string;

  if (days < 0) {
    return null; // already filtered server-side, but just in case
  } else if (days < 30) {
    textColor = 'text-red-700';
    bgColor = 'bg-red-50';
    label = days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`;
  } else if (days <= 60) {
    textColor = 'text-orange-700';
    bgColor = 'bg-orange-50';
    label = `${days} days left`;
  } else {
    textColor = 'text-green-700';
    bgColor = 'bg-green-50';
    label = `${days} days left`;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${bgColor} ${textColor}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  );
}

function SuccessBadge({ prediction, loading }: { prediction?: SuccessPrediction; loading?: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Predicting…
      </span>
    );
  }
  if (!prediction) return null;

  const s = Math.min(100, Math.max(0, prediction.successScore));
  let badgeColor: string;
  if (s >= 65) badgeColor = 'bg-emerald-100 text-emerald-700';
  else if (s >= 40) badgeColor = 'bg-amber-100 text-amber-700';
  else badgeColor = 'bg-red-100 text-red-700';

  return (
    <div className="relative group/pred">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-default ${badgeColor}`}>
        🎯 {s}% success
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/pred:block z-20 pointer-events-none w-56">
        <div className="rounded-xl bg-slate-800 text-white text-xs p-3 shadow-xl space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Competition</span>
            <span className="font-semibold">{prediction.competitionLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Effort vs Reward</span>
            <span className="font-semibold">{prediction.effortVsReward}</span>
          </div>
          {prediction.winningFactors?.[0] && (
            <p className="text-emerald-300 text-[11px] leading-snug pt-0.5">
              ✓ {prediction.winningFactors[0]}
            </p>
          )}
          {prediction.redFlags?.[0] && (
            <p className="text-red-300 text-[11px] leading-snug">
              ⚠ {prediction.redFlags[0]}
            </p>
          )}
          <p className="text-slate-500 text-[10px] pt-0.5 border-t border-slate-700">AI prediction · click grant for full analysis</p>
        </div>
      </div>
    </div>
  );
}

export default function GrantCard({ grant, rank, index, onGenerateLetter, compareSelected, compareDisabled, onCompareToggle, guestMode, prediction, predictionLoading }: GrantCardProps) {
  const router = useRouter();
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

  const handleCardClick = () => {
    if (index != null) router.push(`/grants/${index}`);
  };

  return (
    <article
      className={`group rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 ${index != null ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >

      {/* Header: rank + title + agency badge */}
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <AgencyBadge agency={grant.agency} />
            {grant.agency.includes('–') && (
              <span className="text-xs text-gray-400">{grant.agency.split('–').slice(1).join('–').trim()}</span>
            )}
          </div>
          {grant.url ? (
            <a
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-base font-bold text-gray-900 leading-snug hover:text-blue-600 transition-colors line-clamp-2"
            >
              {grant.title}
            </a>
          ) : (
            <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
              {grant.title}
            </h3>
          )}
        </div>
      </div>

      {/* Score bar + success prediction badge */}
      <div className="flex flex-col gap-2">
        <ScoreBar score={grant.score} />
        {(predictionLoading || prediction) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AI Prediction:</span>
            <SuccessBadge prediction={prediction} loading={predictionLoading} />
          </div>
        )}
      </div>

      {/* Claude's reason */}
      {grant.reason && (
        <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-blue-200 pl-3 italic">
          {grant.reason}
        </p>
      )}

      {/* Meta row: amount + deadline */}
      {(formattedAmount || grant.deadline) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          {formattedAmount && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">{formattedAmount}</span>
            </span>
          )}
          {grant.deadline && <DeadlineCountdown deadline={grant.deadline} />}
        </div>
      )}

      {/* Description snippet */}
      {grant.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {grant.description}
        </p>
      )}

      {/* Footer: Generate Letter + Save Deadline + Compare */}
      <div className="pt-1 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
        <div className="relative group/letter">
          <button
            onClick={(e) => { e.stopPropagation(); if (!guestMode) onGenerateLetter?.(); }}
            disabled={!onGenerateLetter || guestMode}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Letter of Intent
          </button>
          {guestMode && (
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/letter:block z-10 pointer-events-none">
              <div className="rounded-lg bg-slate-800 text-white text-xs px-3 py-1.5 whitespace-nowrap shadow-lg">
                Sign in to generate your personalized letter
              </div>
            </div>
          )}
        </div>

        {!guestMode && grant.url && (
          <SaveDeadlineButton
            grantTitle={grant.title}
            agency={grant.agency}
            deadline={grant.deadline}
            fundingAmount={grant.amount}
            grantUrl={grant.url}
          />
        )}
        </div>

        {onCompareToggle != null && (
          <button
            onClick={(e) => { e.stopPropagation(); onCompareToggle(); }}
            disabled={compareDisabled && !compareSelected}
            title={compareDisabled && !compareSelected ? 'Max 2 grants can be compared' : compareSelected ? 'Remove from comparison' : 'Add to comparison'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              compareSelected
                ? 'bg-violet-600 border-violet-600 text-white hover:bg-violet-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            {compareSelected ? 'Selected' : 'Compare'}
          </button>
        )}
      </div>

    </article>
  );
}
