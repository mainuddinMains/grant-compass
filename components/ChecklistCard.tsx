'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { ChecklistItem, ChecklistState } from '@/lib/auth-db';

const LS_PREFIX = 'grant_compass_checklist_';

const CATEGORY_ORDER = ['Documents', 'Research', 'Writing', 'Submission'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Documents: { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200', dot: 'bg-blue-400' },
  Research:  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  Writing:   { bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  Submission: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
};

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
}

interface Props {
  grantUrl: string;
  grantTitle: string;
  grantAgency: string;
  grantDescription: string;
}

export default function ChecklistCard({ grantUrl, grantTitle, grantAgency, grantDescription }: Props) {
  const { status } = useSession();
  const isSignedIn = status === 'authenticated';

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lsKey = LS_PREFIX + encodeURIComponent(grantUrl);

  // ── Persist helpers ──────────────────────────────────────────
  const saveState = useCallback((nextItems: ChecklistItem[], nextChecked: Record<string, boolean>) => {
    const state: ChecklistState = { items: nextItems, checked: nextChecked };
    if (isSignedIn && grantUrl) {
      fetch('/api/checklist/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantUrl, state }),
      }).catch(() => {});
    }
    try { localStorage.setItem(lsKey, JSON.stringify(state)); } catch { /* ignore */ }
  }, [isSignedIn, grantUrl, lsKey]);

  const clearState = useCallback(() => {
    if (isSignedIn && grantUrl) {
      fetch('/api/checklist/progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantUrl }),
      }).catch(() => {});
    }
    try { localStorage.removeItem(lsKey); } catch { /* ignore */ }
  }, [isSignedIn, grantUrl, lsKey]);

  // ── Load saved state on mount ────────────────────────────────
  useEffect(() => {
    async function load() {
      // Prefer server state for signed-in users
      if (isSignedIn && grantUrl) {
        try {
          const res = await fetch(`/api/checklist/progress?grantUrl=${encodeURIComponent(grantUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.state?.items?.length) {
              setItems(data.state.items);
              setChecked(data.state.checked ?? {});
              setGenerated(true);
              return;
            }
          }
        } catch { /* fall through to localStorage */ }
      }
      // Fall back to localStorage
      try {
        const raw = localStorage.getItem(lsKey);
        if (raw) {
          const state: ChecklistState = JSON.parse(raw);
          if (state.items?.length) {
            setItems(state.items);
            setChecked(state.checked ?? {});
            setGenerated(true);
          }
        }
      } catch { /* ignore */ }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, grantUrl]);

  // ── Generate checklist ───────────────────────────────────────
  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: grantTitle, description: grantDescription, agency: grantAgency }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (!data.items?.length) throw new Error('No items returned');
      const initialChecked: Record<string, boolean> = {};
      (data.items as ChecklistItem[]).forEach((item) => { initialChecked[item.id] = false; });
      setItems(data.items);
      setChecked(initialChecked);
      setGenerated(true);
      saveState(data.items, initialChecked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checklist.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Toggle a checkbox ────────────────────────────────────────
  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveState(items, next);
      return next;
    });
  };

  // ── Reset ────────────────────────────────────────────────────
  const reset = () => {
    if (!window.confirm('Uncheck all items and clear progress?')) return;
    const cleared: Record<string, boolean> = {};
    items.forEach((item) => { cleared[item.id] = false; });
    setChecked(cleared);
    saveState(items, cleared);
  };

  const regenerate = () => {
    if (!window.confirm('This will replace your current checklist and clear all progress. Continue?')) return;
    clearState();
    setItems([]);
    setChecked({});
    setGenerated(false);
    generate();
  };

  // ── Derived stats ────────────────────────────────────────────
  const totalItems = items.length;
  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
  const totalHours = items.reduce((sum, i) => sum + (i.estimatedHours ?? 0), 0);
  const doneHours = items
    .filter((i) => checked[i.id])
    .reduce((sum, i) => sum + (i.estimatedHours ?? 0), 0);

  // Group items by category in defined order
  const grouped = CATEGORY_ORDER.reduce<Record<string, ChecklistItem[]>>((acc, cat) => {
    const inCat = items.filter((i) => i.category === cat);
    if (inCat.length) acc[cat] = inCat;
    return acc;
  }, {});
  // Any categories not in CATEGORY_ORDER (defensive)
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = items.filter((x) => x.category === i.category);
  });

  // ── Not yet generated ────────────────────────────────────────
  if (!generated && !generating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Application Checklist
          </h2>
          <span className="text-xs text-slate-400 italic">AI-generated</span>
        </div>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          Get a step-by-step checklist tailored to this grant — covering documents, writing, research, and submission tasks.
        </p>
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>
        )}
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Generate Checklist
        </button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg className="animate-spin h-4 w-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Claude is generating your checklist…
        </div>
      </div>
    );
  }

  // ── Checklist ────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Application Checklist
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 italic">AI-generated · {totalItems} tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset all checkboxes"
            >
              Reset
            </button>
            <button
              onClick={regenerate}
              className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              title="Regenerate checklist"
            >
              Regenerate
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-indigo-600 w-10 text-right">
            {pct}%
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {doneCount} of {totalItems} tasks complete · {doneHours}h of {totalHours}h done
        </p>
      </div>

      {/* Items grouped by category */}
      <div className="divide-y divide-slate-100">
        {Object.entries(grouped).map(([cat, catItems]) => {
          const style = categoryStyle(cat);
          const catDone = catItems.filter((i) => checked[i.id]).length;
          return (
            <div key={cat} className="px-6 py-4">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${style.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${style.text}`}>{cat}</span>
                <span className="text-xs text-slate-400 ml-auto">{catDone}/{catItems.length}</span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-3">
                {catItems.map((item) => {
                  const done = !!checked[item.id];
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        done
                          ? `${style.bg} ${style.border}`
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Checkbox */}
                      <span className="flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggle(item.id)}
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                            done ? `${style.dot} border-transparent` : 'border-slate-300 bg-white'
                          }`}
                        >
                          {done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.task}
                        </p>
                        <p className={`text-xs mt-0.5 leading-relaxed ${done ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      </div>

                      {/* Hours badge */}
                      <span className={`flex-shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${
                        done ? 'bg-white/60 text-slate-400' : `${style.bg} ${style.text}`
                      }`}>
                        {item.estimatedHours}h
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: total hours */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Estimated total time:{' '}
          <span className="font-bold text-slate-700">{totalHours} hours</span>
        </p>
        {pct === 100 && (
          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
            ✓ All done!
          </span>
        )}
      </div>
    </div>
  );
}
