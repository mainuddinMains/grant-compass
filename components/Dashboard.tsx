'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavUserMenu from '@/components/NavUserMenu';
import ThemeToggle from '@/components/ThemeToggle';
import SearchTab from '@/components/SearchTab';
import type { ResearcherProfile } from '@/components/ProfileForm';

interface DashboardProps {
  userName: string;
}

export default function Dashboard({ userName: _userName }: DashboardProps) {
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 bg-[#0f172a] text-white shadow-[0_2px_20px_rgba(0,0,0,0.35)] z-20">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧭</span>
            <span className="text-xl font-bold tracking-tight">Grant Compass</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Link>
            <Link
              href="/search?demo=true"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Demo
            </Link>
            <ThemeToggle />
            <NavUserMenu onProfileChange={setProfile} />
          </div>
        </div>
      </nav>

      {/* ── Body: sidebar + main ───────────────────────────────── */}
      <SearchTab
        initialQuery=""
        preloadedResults={null}
        profile={profile}
      />
    </div>
  );
}
