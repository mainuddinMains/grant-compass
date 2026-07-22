'use client';

import { COUNTRY_FUNDING_DATA, type FundingSector } from '@/lib/countryFundingData';

interface Props {
  countryLabel: string;
  flag: string;
  activeSector: { field: string; label: string } | null;
  onSectorClick: (query: string, field: string, label: string) => void;
  onClearSector: () => void;
}

function fmt(billions: number): string {
  return billions >= 1 ? `$${billions.toFixed(1)}B` : `$${(billions * 1000).toFixed(0)}M`;
}

function SectorBar({
  sector,
  maxPct,
  isActive,
  isDimmed,
  onClick,
}: {
  sector: FundingSector;
  maxPct: number;
  isActive: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  const barWidth = Math.round((sector.percentage / maxPct) * 100);
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-xl px-2.5 py-2 -mx-2.5 transition-all duration-150 ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-700'
          : isDimmed
          ? 'opacity-35'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Label */}
        <span
          className={`w-24 sm:w-28 flex-shrink-0 text-xs font-semibold truncate ${
            isActive
              ? 'text-indigo-700 dark:text-indigo-300'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {sector.label}
        </span>

        {/* Bar track */}
        <div className="flex-1 h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%`, backgroundColor: sector.color }}
          />
        </div>

        {/* Percentage */}
        <span
          className={`w-9 text-right text-xs font-bold tabular-nums flex-shrink-0 ${
            isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {sector.percentage}%
        </span>

        {/* Amount — hidden on very small widths */}
        <span className="hidden sm:block w-16 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500 flex-shrink-0">
          {fmt(sector.amountBillions)}
        </span>
      </div>
    </button>
  );
}

export default function CountryFundingDiagram({
  countryLabel,
  flag,
  activeSector,
  onSectorClick,
  onClearSector,
}: Props) {
  const data = COUNTRY_FUNDING_DATA[countryLabel];
  if (!data) return null;

  const maxPct = Math.max(...data.sectors.map((s) => s.percentage));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden shadow-sm animate-fade-in-up">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl leading-none">{flag}</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Global Intelligence
            </p>
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {countryLabel} — Research Funding Overview
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{data.tagline}</p>
        </div>

        {/* Budget callout */}
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Total Budget</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-200 tabular-nums leading-tight">
            ${data.totalBudgetBillions}B
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">USD equivalent</p>
        </div>
      </div>

      {/* ── Top Agencies ─────────────────────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Top agencies:</span>
        {data.topAgencies.map((agency) => (
          <span
            key={agency}
            className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
          >
            {agency}
          </span>
        ))}
      </div>

      {/* ── Bar chart ────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Spending by Research Sector
          </p>
          <div className="flex items-center gap-3">
            {activeSector ? (
              <button
                onClick={onClearSector}
                className="text-xs font-medium text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                ✕ Clear sector filter
              </button>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Click a bar to drill down</p>
            )}
          </div>
        </div>

        {data.sectors.map((sector) => (
          <SectorBar
            key={sector.field}
            sector={sector}
            maxPct={maxPct}
            isActive={activeSector?.field === sector.field}
            isDimmed={activeSector !== null && activeSector.field !== sector.field}
            onClick={() => onSectorClick(sector.query, sector.field, sector.label)}
          />
        ))}

        {activeSector && (
          <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
            Showing grants for{' '}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{activeSector.label}</span>
            {' '}× {countryLabel}
          </p>
        )}
      </div>

      <p className="px-5 pb-3 text-[10px] text-slate-300 dark:text-slate-600">
        Estimated figures based on publicly reported national research budgets · Data for illustrative purposes
      </p>
    </div>
  );
}
