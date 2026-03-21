'use client';

interface GrantCardProps {
  title: string;
  agency: string;
  abstract: string;
  amount?: string | number;
  startDate?: string;
  endDate?: string;
  pi?: string;
  url?: string;
  matchScore?: number;
  reasoning?: string;
  keyAlignments?: string[];
  onGenerateLetter?: () => void;
  isGenerating?: boolean;
  rank?: number;
}

export default function GrantCard({
  title,
  agency,
  abstract,
  amount,
  startDate,
  endDate,
  pi,
  url,
  matchScore,
  reasoning,
  keyAlignments,
  onGenerateLetter,
  isGenerating,
  rank,
}: GrantCardProps) {
  const formattedAmount =
    amount != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
          Number(amount)
        )
      : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {rank && (
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              #{rank}
            </span>
          )}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-blue-700 hover:underline leading-snug"
            >
              {title}
            </a>
          ) : (
            <h3 className="text-base font-semibold text-gray-900 leading-snug">{title}</h3>
          )}
        </div>
        {matchScore != null && (
          <span className="flex-shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            {matchScore}% match
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{agency}</span>
        {formattedAmount && <span>{formattedAmount}</span>}
        {pi && <span>PI: {pi}</span>}
        {startDate && endDate && (
          <span>
            {startDate} – {endDate}
          </span>
        )}
      </div>

      {abstract && (
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{abstract}</p>
      )}

      {reasoning && (
        <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
          <span className="font-medium">Why it matches: </span>
          {reasoning}
        </div>
      )}

      {keyAlignments && keyAlignments.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {keyAlignments.map((a, i) => (
            <li
              key={i}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
            >
              {a}
            </li>
          ))}
        </ul>
      )}

      {onGenerateLetter && (
        <button
          onClick={onGenerateLetter}
          disabled={isGenerating}
          className="self-start mt-1 rounded-lg border border-blue-600 px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      )}
    </div>
  );
}
