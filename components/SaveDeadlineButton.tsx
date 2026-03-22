'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Props {
  grantTitle: string;
  agency: string;
  deadline: string | null;
  fundingAmount: number | null;
  grantUrl: string;
  /** If true, uses a larger pill style suited for the detail page sidebar */
  large?: boolean;
}

export default function SaveDeadlineButton({
  grantTitle, agency, deadline, fundingAmount, grantUrl, large,
}: Props) {
  const { status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !grantUrl) return;
    fetch('/api/deadlines')
      .then((r) => r.json())
      .then((data) => {
        const urls = (data.deadlines ?? []).map((d: { grantUrl: string }) => d.grantUrl);
        setSaved(urls.includes(grantUrl));
      })
      .catch(() => {});
  }, [status, grantUrl]);

  if (status !== 'authenticated') return null;

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (saved) {
        await fetch('/api/deadlines', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grantUrl }),
        });
        setSaved(false);
      } else {
        await fetch('/api/deadlines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grantTitle, agency, deadline, fundingAmount, grantUrl }),
        });
        setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (large) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          saved
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        {saved ? '✓ Deadline Saved' : '🔔 Save Deadline'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        saved
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {saved ? '✓ Deadline Saved' : '🔔 Save Deadline'}
    </button>
  );
}
