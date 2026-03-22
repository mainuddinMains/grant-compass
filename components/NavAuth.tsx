'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface NavAuthProps {
  user?: { name?: string | null } | null;
}

export default function NavAuth({ user }: NavAuthProps) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 hidden sm:inline">
          Hi, {user.name?.split(' ')[0]}
        </span>
        <Link
          href="/history"
          className="rounded-full border border-slate-600 hover:border-slate-400 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          History
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="rounded-full border border-slate-600 hover:border-slate-400 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full border border-slate-600 hover:border-slate-400 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        Sign Up
      </Link>
    </div>
  );
}
