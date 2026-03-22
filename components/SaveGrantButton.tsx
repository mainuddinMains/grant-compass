'use client';

import { useState, useEffect } from 'react';
import { saveGrant, unsaveGrant, isGrantSaved } from '@/lib/savedGrants';
import type { GrantProps } from '@/components/GrantCard';

interface SaveGrantButtonProps {
  grant: GrantProps;
}

export default function SaveGrantButton({ grant }: SaveGrantButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isGrantSaved(grant));
  }, [grant.title, grant.agency]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      unsaveGrant(`${grant.agency}::${grant.title}`);
      setSaved(false);
    } else {
      saveGrant(grant);
      setSaved(true);
    }
  };

  return (
    <div className="relative group/save">
      <button
        onClick={toggle}
        title={saved ? 'Unsave grant' : 'Save grant'}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          saved
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <svg
          className="w-3.5 h-3.5"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {saved ? 'Saved' : 'Save'}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/save:block z-10 pointer-events-none">
        <div className="rounded-lg bg-slate-800 text-white text-xs px-3 py-1.5 whitespace-nowrap shadow-lg">
          {saved ? 'Remove from saved' : 'Save for later'}
        </div>
      </div>
    </div>
  );
}
