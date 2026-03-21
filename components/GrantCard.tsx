'use client';

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
  onGenerateLetter?: () => void;
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

export default function GrantCard({ grant, rank, onGenerateLetter }: GrantCardProps) {
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
    <article className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200">

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

      {/* Score bar */}
      <ScoreBar score={grant.score} />

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
          {grant.deadline && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Deadline: <span className="font-medium text-gray-700">{grant.deadline}</span></span>
            </span>
          )}
        </div>
      )}

      {/* Description snippet */}
      {grant.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {grant.description}
        </p>
      )}

      {/* Footer: Generate Letter button */}
      <div className="pt-1 border-t border-gray-100">
        <button
          onClick={onGenerateLetter}
          disabled={!onGenerateLetter}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Letter of Intent
        </button>
      </div>

    </article>
  );
}
