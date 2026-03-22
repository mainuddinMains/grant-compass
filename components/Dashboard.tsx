'use client';

import { useState } from 'react';
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="bg-[#0f172a] text-white shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧭</span>
            <span className="text-xl font-bold tracking-tight">Grant Compass</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NavUserMenu onProfileChange={setProfile} />
          </div>
        </div>
      </nav>

      {/* ── Search ─────────────────────────────────────────────── */}
      <SearchTab
        initialQuery=""
        preloadedResults={null}
        profile={profile}
      />
    </div>
  );
}
