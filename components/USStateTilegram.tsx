'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

// ── Types ──────────────────────────────────────────────────────────

export interface USStateTilegramProps {
  /** Metric value per state code — drives the color gradient */
  metricData?: Record<string, number>;
  /** Controlled: which state codes are selected. Omit for uncontrolled mode. */
  selectedStates?: string[];
  /** Called on every tile click with the 2-letter state code */
  onStateClick?: (stateCode: string) => void;
  /** Label shown in the legend */
  metricLabel?: string;
  /** Formatter for tooltip metric value */
  metricFormatter?: (value: number) => string;
  /** Override the upper bound for the color scale */
  metricMax?: number;
  className?: string;
}

// ── Grid layout ────────────────────────────────────────────────────
// Each entry: [stateCode, col, row] — 12 cols (0–11), 7 rows (0–6)
// Row 6 (AK, HI) is rendered with extra vertical offset to indicate non-contiguous.

const GRID: readonly [string, number, number][] = [
  // Row 0 — Northern tier
  ['WA',  0, 0], ['MT',  1, 0], ['ND',  2, 0], ['MN',  3, 0],
  ['WI',  5, 0], ['MI',  6, 0],
  ['VT',  9, 0], ['ME', 10, 0], ['NH', 11, 0],
  // Row 1
  ['OR',  0, 1], ['ID',  1, 1], ['WY',  2, 1], ['SD',  3, 1], ['IA',  4, 1],
  ['IL',  5, 1], ['IN',  6, 1], ['OH',  7, 1], ['PA',  8, 1],
  ['NY',  9, 1], ['MA', 10, 1], ['CT', 11, 1],
  // Row 2
  ['CA',  0, 2], ['NV',  1, 2], ['UT',  2, 2], ['CO',  3, 2], ['NE',  4, 2],
  ['MO',  5, 2], ['KY',  6, 2], ['WV',  7, 2], ['VA',  8, 2],
  ['MD',  9, 2], ['DE', 10, 2], ['NJ', 11, 2],
  // Row 3
  ['AZ',  1, 3], ['NM',  2, 3], ['KS',  3, 3], ['AR',  4, 3], ['TN',  5, 3],
  ['NC',  6, 3], ['SC',  7, 3], ['DC',  8, 3], ['RI', 11, 3],
  // Row 4
  ['OK',  3, 4], ['LA',  4, 4], ['MS',  5, 4], ['AL',  6, 4], ['GA',  7, 4],
  // Row 5
  ['TX',  3, 5], ['FL',  7, 5],
  // Row 6 — Non-contiguous insets (AK, HI)
  ['AK',  0, 6], ['HI',  1, 6],
] as const;

const STATE_NAMES: Readonly<Record<string, string>> = {
  AK: 'Alaska',        AL: 'Alabama',       AR: 'Arkansas',      AZ: 'Arizona',
  CA: 'California',    CO: 'Colorado',      CT: 'Connecticut',   DC: 'Washington D.C.',
  DE: 'Delaware',      FL: 'Florida',       GA: 'Georgia',       HI: 'Hawaii',
  IA: 'Iowa',          ID: 'Idaho',         IL: 'Illinois',      IN: 'Indiana',
  KS: 'Kansas',        KY: 'Kentucky',      LA: 'Louisiana',     MA: 'Massachusetts',
  MD: 'Maryland',      ME: 'Maine',         MI: 'Michigan',      MN: 'Minnesota',
  MO: 'Missouri',      MS: 'Mississippi',   MT: 'Montana',       NC: 'North Carolina',
  ND: 'North Dakota',  NE: 'Nebraska',      NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico',    NV: 'Nevada',        NY: 'New York',      OH: 'Ohio',
  OK: 'Oklahoma',      OR: 'Oregon',        PA: 'Pennsylvania',  RI: 'Rhode Island',
  SC: 'South Carolina',SD: 'South Dakota',  TN: 'Tennessee',     TX: 'Texas',
  UT: 'Utah',          VA: 'Virginia',      VT: 'Vermont',       WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin',     WY: 'Wyoming',
};

// ── Layout constants ───────────────────────────────────────────────

const TILE  = 40;  // tile edge length in SVG units
const GAP   =  3;  // gap between tiles
const STEP  = TILE + GAP;
const PAD   = 10;  // outer padding
const AK_HI_EXTRA = 14; // extra vertical gap before the AK/HI inset row

const COLS = 12;
const ROWS = 7;

const SVG_W = COLS * STEP - GAP + PAD * 2;
const SVG_H = (ROWS - 1) * STEP - GAP + PAD * 2 + AK_HI_EXTRA + STEP;

function tileX(col: number): number {
  return PAD + col * STEP;
}
function tileY(row: number): number {
  return PAD + row * STEP + (row >= 6 ? AK_HI_EXTRA : 0);
}

// ── Color helpers ──────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function computeFill(
  value: number | undefined,
  max: number,
  selected: boolean,
  hovered: boolean,
  isDark: boolean,
): string {
  if (selected) return isDark ? '#818cf8' : '#4f46e5';

  if (value === undefined) {
    if (hovered) return isDark ? '#334155' : '#cbd5e1';
    return isDark ? '#1e293b' : '#e2e8f0';
  }

  const t = Math.min(value / max, 1);

  if (isDark) {
    // indigo-900 [49,46,129] → indigo-400 [129,140,248]
    const r = lerp(49, 129, t);
    const g = lerp(46, 140, t);
    const b = lerp(129, 248, t);
    if (hovered) return `rgb(${lerp(r, 255, 0.18)},${lerp(g, 255, 0.18)},${lerp(b, 255, 0.12)})`;
    return `rgb(${r},${g},${b})`;
  }
  // indigo-100 [224,231,255] → indigo-600 [79,70,229]
  const r = lerp(224, 79, t);
  const g = lerp(231, 70, t);
  const b = lerp(255, 229, t);
  if (hovered) return `rgb(${lerp(r, 20, 0.12)},${lerp(g, 10, 0.1)},${lerp(b, 200, 0.06)})`;
  return `rgb(${r},${g},${b})`;
}

function computeTextColor(
  value: number | undefined,
  max: number,
  selected: boolean,
  isDark: boolean,
): string {
  if (selected) return '#ffffff';
  if (value === undefined) return isDark ? '#475569' : '#94a3b8';
  const t = Math.min(value / max, 1);
  if (isDark) return t > 0.35 ? '#ffffff' : '#c7d2fe';
  return t > 0.55 ? '#ffffff' : '#3730a3';
}

// ── Component ──────────────────────────────────────────────────────

export default function USStateTilegram({
  metricData,
  selectedStates,
  onStateClick,
  metricLabel = 'Value',
  metricFormatter = (v) => v.toFixed(1),
  metricMax,
  className = '',
}: USStateTilegramProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted]             = useState(false);
  const [hoveredCode, setHoveredCode]     = useState<string | null>(null);
  const [tooltip, setTooltip]             = useState<{ x: number; y: number; code: string } | null>(null);
  const [internalSel, setInternalSel]     = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);

  const isDark    = mounted && resolvedTheme === 'dark';
  const isControlled = selectedStates !== undefined;
  const activeSelected = isControlled ? selectedStates : internalSel;

  const maxValue = metricMax ?? (
    metricData && Object.keys(metricData).length > 0
      ? Math.max(1, ...Object.values(metricData))
      : 1
  );

  const handleClick = useCallback((code: string) => {
    onStateClick?.(code);
    if (!isControlled) {
      setInternalSel((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
      );
    }
  }, [isControlled, onStateClick]);

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalSel([]);
  }, [isControlled]);

  // Skeleton while theme resolves
  if (!mounted) {
    return (
      <div
        className={`rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse h-64 ${className}`}
      />
    );
  }

  const separatorY = tileY(6) - AK_HI_EXTRA / 2;
  const separatorColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div className={`flex flex-col gap-3 w-full select-none ${className}`}>
      {/* ── Tile grid ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden p-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto"
          role="img"
          aria-label="US State Tilegram"
        >
          {/* Dashed separator before AK/HI row */}
          <line
            x1={PAD}
            y1={separatorY}
            x2={SVG_W - PAD}
            y2={separatorY}
            stroke={separatorColor}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={PAD + 2 * STEP + GAP}
            y={separatorY - 3}
            fontSize={7}
            fill={isDark ? '#334155' : '#cbd5e1'}
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
          >
            AK · HI (non-contiguous)
          </text>

          {GRID.map(([code, col, row]) => {
            const x         = tileX(col);
            const y         = tileY(row);
            const value     = metricData?.[code];
            const isSelected = activeSelected.includes(code);
            const isHovered  = hoveredCode === code;

            const fill      = computeFill(value, maxValue, isSelected, isHovered, isDark);
            const textColor = computeTextColor(value, maxValue, isSelected, isDark);
            const strokeCol = isSelected
              ? (isDark ? '#a5b4fc' : '#3730a3')
              : (isDark ? '#0f172a' : '#f8fafc');

            return (
              <g
                key={code}
                onClick={() => handleClick(code)}
                onMouseEnter={(e) => {
                  setHoveredCode(code);
                  setTooltip({ x: e.clientX, y: e.clientY, code });
                }}
                onMouseMove={(e) => {
                  setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                }}
                onMouseLeave={() => {
                  setHoveredCode(null);
                  setTooltip(null);
                }}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`${STATE_NAMES[code] ?? code}${value !== undefined ? `: ${metricFormatter(value)}` : ''}`}
                aria-pressed={isSelected}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(code); }}
              >
                <rect
                  x={x}
                  y={y}
                  width={TILE}
                  height={TILE}
                  rx={6}
                  fill={fill}
                  stroke={strokeCol}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ transition: 'fill 0.12s ease' }}
                />
                <text
                  x={x + TILE / 2}
                  y={y + TILE / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={isSelected ? 700 : 600}
                  fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                  fill={textColor}
                  style={{ pointerEvents: 'none', transition: 'fill 0.12s ease' }}
                >
                  {code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Legend + clear ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 min-h-[24px]">
        {metricData ? (
          <div className="flex flex-col gap-0.5">
            <div
              className="w-28 h-2 rounded-full"
              style={{
                background: isDark
                  ? 'linear-gradient(to right, #312e81, #4338ca, #818cf8)'
                  : 'linear-gradient(to right, #e0e7ff, #a5b4fc, #4f46e5)',
              }}
            />
            <div className="flex justify-between w-28">
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Low</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">{metricLabel}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">High</span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {!isControlled && activeSelected.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear ({activeSelected.length})
          </button>
        )}
      </div>

      {/* ── Tooltip ───────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 text-xs shadow-xl whitespace-nowrap"
          style={{ left: tooltip.x + 14, top: tooltip.y - 52 }}
        >
          <span className="font-semibold">{STATE_NAMES[tooltip.code] ?? tooltip.code}</span>
          {metricData?.[tooltip.code] !== undefined ? (
            <span className="ml-2 text-indigo-300 font-bold tabular-nums">
              {metricFormatter(metricData[tooltip.code])}
            </span>
          ) : (
            <span className="ml-1.5 text-slate-400 dark:text-slate-400">No data</span>
          )}
        </div>
      )}
    </div>
  );
}
