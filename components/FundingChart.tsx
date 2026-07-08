'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FUNDING_DATA = [
  { year: '2021', 'Data Science & AI': 1.8, 'Oncology': 5.8, 'Neuroscience': 2.4, 'Climate Science': 1.6 },
  { year: '2022', 'Data Science & AI': 2.2, 'Oncology': 6.1, 'Neuroscience': 2.6, 'Climate Science': 1.8 },
  { year: '2023', 'Data Science & AI': 2.9, 'Oncology': 6.4, 'Neuroscience': 2.9, 'Climate Science': 2.2 },
  { year: '2024', 'Data Science & AI': 3.6, 'Oncology': 6.7, 'Neuroscience': 3.1, 'Climate Science': 2.6 },
  { year: '2025', 'Data Science & AI': 4.2, 'Oncology': 7.1, 'Neuroscience': 3.4, 'Climate Science': 3.0 },
  { year: '2026', 'Data Science & AI': 4.8, 'Oncology': 7.5, 'Neuroscience': 3.7, 'Climate Science': 3.3 },
];

const CATEGORIES = [
  { key: 'Oncology',          color: '#ef4444', gradientId: 'grad-oncology' },
  { key: 'Neuroscience',      color: '#8b5cf6', gradientId: 'grad-neuro' },
  { key: 'Climate Science',   color: '#10b981', gradientId: 'grad-climate' },
  { key: 'Data Science & AI', color: '#6366f1', gradientId: 'grad-datasci' },
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl px-4 py-3 min-w-[200px]">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {label} · NIH & NSF Combined
      </p>
      {sorted.map(({ name, value, color }) => (
        <div key={name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-600 dark:text-slate-300">{name}</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
            ${value.toFixed(1)}B
          </span>
        </div>
      ))}
    </div>
  );
}

interface LegendPayloadItem {
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-4">
      {payload.map(({ value, color }) => (
        <div key={value} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function FundingChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  const gridColor   = isDark ? '#334155' : '#e2e8f0';
  const tickColor   = isDark ? '#64748b' : '#94a3b8';

  return (
    <section className="bg-white dark:bg-[#0f172a] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            Research funding landscape
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Where the funding is going
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Combined annual NIH &amp; NSF awards across key research domains, 2021–2026. Data Science &amp; AI
            is the fastest-growing category — and Grant Compass is built to help you capture it.
          </p>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-4 sm:p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={FUNDING_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {CATEGORIES.map(({ gradientId, color }) => (
                  <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

              <XAxis
                dataKey="year"
                tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />

              <YAxis
                tickFormatter={(v: number) => `$${v}B`}
                tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={[0, 9]}
                ticks={[0, 2, 4, 6, 8]}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />

              <Legend content={<CustomLegend />} />

              {CATEGORIES.map(({ key, color, gradientId }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Caption */}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
          Figures represent estimated combined NIH &amp; NSF annual awards. Values in billions USD.
        </p>
      </div>
    </section>
  );
}
