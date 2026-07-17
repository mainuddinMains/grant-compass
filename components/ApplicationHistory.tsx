'use client';

import { useState, useEffect } from 'react';
import type { StoredApplication, ApplicationStatus } from '@/lib/auth-db';

// ── Status pipeline ───────────────────────────────────────────────
// The linear steps plus the two terminal states.
const PIPELINE: ApplicationStatus[] = [
  'Draft',
  'Submitted to Grants.gov',
  'Under Review',
  'Awarded',
];

interface StatusMeta {
  color: string;        // badge background + text
  dot: string;          // dot fill color
  ring: string;         // ring color for active step
  label: string;
  icon: React.ReactNode;
}

function statusMeta(status: ApplicationStatus): StatusMeta {
  switch (status) {
    case 'Draft':
      return {
        color: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400',
        ring: 'ring-slate-300',
        label: 'Draft',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      };
    case 'Submitted to Grants.gov':
      return {
        color: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
        ring: 'ring-blue-300',
        label: 'Submitted',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        ),
      };
    case 'Under Review':
      return {
        color: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-400',
        ring: 'ring-amber-300',
        label: 'Under Review',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case 'Awarded':
      return {
        color: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-300',
        label: 'Awarded',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'Not Funded':
      return {
        color: 'bg-red-100 text-red-700',
        dot: 'bg-red-400',
        ring: 'ring-red-300',
        label: 'Not Funded',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
  }
}

// ── Progress stepper ──────────────────────────────────────────────

function ProgressStepper({ status }: { status: ApplicationStatus }) {
  const isTerminal = status === 'Awarded' || status === 'Not Funded';
  const currentIdx = isTerminal ? PIPELINE.length - 1 : PIPELINE.indexOf(status);

  // For "Not Funded", the last node uses red styling
  const terminalMeta = isTerminal ? statusMeta(status) : null;

  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {PIPELINE.map((step, i) => {
        const isLast = i === PIPELINE.length - 1;
        const isPast = i < currentIdx;
        const isActive = i === currentIdx;
        const isFuture = i > currentIdx;

        const meta =
          isActive && isTerminal && step === 'Awarded'
            ? terminalMeta!
            : isActive
            ? statusMeta(step)
            : null;

        // Dot color
        let dotCls: string;
        if (isActive && isTerminal && step === 'Awarded') {
          dotCls = terminalMeta!.dot;
        } else if (isPast || isActive) {
          dotCls = isActive ? (meta?.dot ?? 'bg-indigo-500') : 'bg-indigo-400';
        } else {
          dotCls = 'bg-slate-200';
        }

        // Connector color (the line to the right of this node)
        const connectorFilled = i < currentIdx;

        return (
          <div key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            {/* Node */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ring-2 transition-all ${
                  isActive
                    ? `${meta?.dot ?? 'bg-indigo-500'} ${meta?.ring ?? 'ring-indigo-200'} ring-offset-1`
                    : isPast
                    ? 'bg-indigo-400 ring-indigo-100 ring-offset-1'
                    : 'bg-slate-200 ring-slate-100'
                }`}
              >
                {isPast ? (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <span className="text-white">{meta?.icon}</span>
                ) : null}
              </div>
              <span
                className={`text-[9px] font-medium text-center leading-tight max-w-[52px] ${
                  isActive ? 'text-slate-700' : isFuture ? 'text-slate-400' : 'text-indigo-600'
                }`}
              >
                {step === 'Submitted to Grants.gov' ? 'Submitted' : step}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    connectorFilled ? 'bg-indigo-400 w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Agency badge ──────────────────────────────────────────────────

function AgencyBadge({ agency }: { agency: string }) {
  const u = agency.toUpperCase();
  if (u.includes('NIH'))
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">NIH</span>;
  if (u.includes('NSF'))
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">NSF</span>;
  if (u.includes('DOE'))
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">DOE</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{agency.slice(0, 8)}</span>;
}

// ── Date helpers ──────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts));
}

function formatAmount(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

// ── Single application card ───────────────────────────────────────

function ApplicationCard({
  app,
  onDelete,
  onStatusChange,
}: {
  app: StoredApplication;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const meta = statusMeta(app.status);
  const isMock = app.id.startsWith('mock_app_');

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/applications?id=${app.id}`, { method: 'DELETE' });
    onDelete(app.id);
  }

  async function handleStatusChange(newStatus: ApplicationStatus) {
    await fetch(`/api/applications?id=${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(app.id, newStatus);
    setEditing(false);
  }

  const ALL_STATUSES: ApplicationStatus[] = [
    'Draft', 'Submitted to Grants.gov', 'Under Review', 'Awarded', 'Not Funded',
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <AgencyBadge agency={app.agency} />
            <span className="text-xs text-slate-400">{app.agency}</span>
            {isMock && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-semibold text-violet-600 uppercase tracking-wide">
                Demo
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
            {app.grantTitle}
          </h3>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${meta.color}`}
        >
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Applied {formatDate(app.appliedAt)}
        </span>
        {app.fundingAmount != null && app.fundingAmount > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-slate-600">{formatAmount(app.fundingAmount)}</span>
          </span>
        )}
        {app.lastUpdated !== app.appliedAt && (
          <span>Updated {formatDate(app.lastUpdated)}</span>
        )}
      </div>

      {/* Progress stepper */}
      <ProgressStepper status={app.status} />

      {/* Actions footer */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {app.workspaceLink ? (
            <a
              href={app.workspaceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Workspace
            </a>
          ) : app.grantUrl ? (
            <a
              href={app.grantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Grant
            </a>
          ) : null}

          {/* Status editor */}
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => void handleStatusChange(s)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    s === app.status
                      ? statusMeta(s).color + ' ring-1 ring-current'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s === 'Submitted to Grants.gov' ? 'Submitted' : s}
                </button>
              ))}
              <button
                onClick={() => setEditing(false)}
                className="rounded-full px-2.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Status
            </button>
          )}
        </div>

        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="flex-shrink-0 text-slate-300 hover:text-red-400 disabled:opacity-40 transition-colors"
          title="Remove application"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Summary chips ─────────────────────────────────────────────────

function SummaryChip({ count, status }: { count: number; status: ApplicationStatus }) {
  const meta = statusMeta(status);
  if (count === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
      {meta.icon}
      {count} {status === 'Submitted to Grants.gov' ? 'Submitted' : status}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────

export default function ApplicationHistory() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/applications')
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => setError('Failed to load application history.'))
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  function handleStatusChange(id: string, status: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, lastUpdated: Date.now() } : a))
    );
  }

  // ── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 h-40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
          📨
        </div>
        <div>
          <p className="text-base font-semibold text-slate-700">No applications yet</p>
          <p className="mt-1 text-sm text-slate-400 max-w-xs leading-relaxed">
            Click &ldquo;Apply&rdquo; on any grant card to start tracking your applications here.
          </p>
        </div>
      </div>
    );
  }

  // ── Summary counts ──────────────────────────────────────────────
  const counts = applications.reduce<Partial<Record<ApplicationStatus, number>>>(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    {}
  );

  return (
    <div className="flex flex-col gap-5">

      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {(['Draft', 'Submitted to Grants.gov', 'Under Review', 'Awarded', 'Not Funded'] as ApplicationStatus[]).map(
            (s) => <SummaryChip key={s} count={counts[s] ?? 0} status={s} />
          )}
        </div>
        <p className="text-xs text-slate-400">
          {applications.length} application{applications.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      <p className="text-[11px] text-center text-slate-300">
        Demo entries are marked <span className="font-semibold">Demo</span> · Apply to a real grant to track live applications
      </p>
    </div>
  );
}
