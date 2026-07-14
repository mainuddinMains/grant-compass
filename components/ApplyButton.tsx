'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export interface ApplyButtonProps {
  grantTitle: string;
  grantUrl: string;
  agency?: string;
  opportunityId?: string;
  /** 'sm' = compact card button (default), 'lg' = full-width CTA */
  size?: 'sm' | 'lg';
}

type State = 'idle' | 'loading' | 'success' | 'error' | 'no_auth' | 'not_supported';

interface ApplyResult {
  workspaceId?: string;
  workspaceLink?: string;
  fallbackUrl?: string;
  errorMessage?: string;
}

export default function ApplyButton({
  grantTitle,
  grantUrl,
  agency,
  opportunityId,
  size = 'sm',
}: ApplyButtonProps) {
  const { data: session } = useSession();
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<ApplyResult>({});

  const lg = size === 'lg';

  // ── Base class shared by all states ──────────────────────────
  const base = lg
    ? 'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm'
    : 'inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200';

  // ── Handler ───────────────────────────────────────────────────
  async function handleApply(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      setState('no_auth');
      return;
    }

    setState('loading');
    setResult({});

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantTitle, grantUrl, agency, opportunityId }),
      });

      const data: {
        workspace?: { workspaceId: string; workspaceLink: string; opportunityId?: string };
        error?: string;
        fallbackUrl?: string;
        notGrantsGov?: boolean;
      } = await res.json();

      if (res.status === 422 && data.notGrantsGov) {
        // Not a Grants.gov opportunity — open the external URL instead
        setState('not_supported');
        setResult({ fallbackUrl: data.fallbackUrl ?? grantUrl });
        return;
      }

      if (!res.ok || data.error) {
        setState('error');
        setResult({
          errorMessage: data.error ?? `Error ${res.status}`,
          fallbackUrl: data.fallbackUrl ?? grantUrl,
        });
        return;
      }

      setState('success');
      setResult({
        workspaceId: data.workspace?.workspaceId,
        workspaceLink: data.workspace?.workspaceLink ?? grantUrl,
      });

      // Persist to application tracking (fire-and-forget)
      fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantTitle,
          grantUrl,
          agency,
          opportunityId: opportunityId ?? data.workspace?.opportunityId,
          workspaceId: data.workspace?.workspaceId,
          workspaceLink: data.workspace?.workspaceLink,
          status: 'Submitted to Grants.gov',
        }),
      }).catch(() => { /* non-critical */ });
    } catch {
      setState('error');
      setResult({
        errorMessage: 'Network error — check your connection.',
        fallbackUrl: grantUrl,
      });
    }
  }

  function reset(e: React.MouseEvent) {
    e.stopPropagation();
    setState('idle');
    setResult({});
  }

  // ── Render ─────────────────────────────────────────────────────

  if (state === 'success' && result.workspaceLink) {
    return (
      <div className={`flex flex-col gap-1.5 ${lg ? 'w-full' : ''}`}>
        <a
          href={result.workspaceLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${base} bg-emerald-600 hover:bg-emerald-500 text-white`}
        >
          <svg
            className={lg ? 'w-4 h-4' : 'w-3.5 h-3.5'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {lg ? 'Workspace Created — Open in Grants.gov' : 'Open Workspace'}
        </a>
        {result.workspaceId && (
          <p className={`text-[10px] text-slate-400 ${lg ? 'text-center' : ''}`}>
            Workspace ID: {result.workspaceId}
          </p>
        )}
        <button
          onClick={reset}
          className={`text-[10px] text-slate-400 hover:text-slate-600 transition-colors ${lg ? 'text-center' : 'self-start'}`}
        >
          Reset
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={`flex flex-col gap-1.5 ${lg ? 'w-full' : ''}`}>
        <div className={`${base} bg-red-50 border border-red-200 text-red-700 cursor-default`}>
          <svg
            className={lg ? 'w-4 h-4' : 'w-3.5 h-3.5'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {lg ? 'Submission Failed' : 'Error'}
        </div>
        {result.errorMessage && (
          <p className="text-[11px] text-red-600 leading-snug max-w-xs">{result.errorMessage}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Try again
          </button>
          {result.fallbackUrl && (
            <a
              href={result.fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
            >
              Apply manually →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (state === 'not_supported') {
    // Not a Grants.gov URL — redirect to the original link directly
    if (result.fallbackUrl) {
      window.open(result.fallbackUrl, '_blank', 'noopener,noreferrer');
    }
    return (
      <div className={`flex flex-col gap-1 ${lg ? 'w-full' : ''}`}>
        <div className={`${base} bg-amber-50 border border-amber-200 text-amber-700 cursor-default`}>
          External site opened
        </div>
        <button onClick={reset} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors self-start">
          Dismiss
        </button>
      </div>
    );
  }

  if (state === 'no_auth') {
    return (
      <div className={`flex flex-col gap-1 ${lg ? 'w-full' : ''}`}>
        <div className={`${base} bg-amber-50 border border-amber-200 text-amber-700 cursor-default`}>
          <svg className={lg ? 'w-4 h-4' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {lg ? 'Sign in to Apply' : 'Sign in required'}
        </div>
        <button onClick={reset} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors self-start">
          Dismiss
        </button>
      </div>
    );
  }

  // ── Idle / Loading ────────────────────────────────────────────
  return (
    <button
      onClick={handleApply}
      disabled={state === 'loading'}
      className={`${base} ${
        lg
          ? 'bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white'
          : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 disabled:opacity-60 disabled:cursor-not-allowed'
      }`}
    >
      {state === 'loading' ? (
        <>
          <svg
            className={`animate-spin ${lg ? 'w-4 h-4' : 'w-3.5 h-3.5'}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {lg ? 'Creating Workspace…' : 'Applying…'}
        </>
      ) : (
        <>
          <svg
            className={lg ? 'w-4 h-4' : 'w-3.5 h-3.5'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {lg ? 'Apply via Grants.gov' : 'Apply'}
        </>
      )}
    </button>
  );
}
