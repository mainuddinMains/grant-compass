'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import type { ResearcherProfile } from '@/components/ProfileForm';

const POSITIONS: ResearcherProfile['position'][] = [
  'Masters Student', 'PhD Student', 'Postdoc', 'Professor', 'Researcher', 'Other',
];

// Deterministic avatar background color based on name
const AVATAR_PALETTE = [
  '#7c3aed', '#4f46e5', '#2563eb', '#0891b2',
  '#059669', '#d97706', '#e11d48', '#9333ea',
];

function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NavUserMenuProps {
  onProfileChange: (profile: ResearcherProfile | null) => void;
}

export default function NavUserMenu({ onProfileChange }: NavUserMenuProps) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ResearcherProfile | null>(null);
  const [form, setForm] = useState<ResearcherProfile>({
    fullName: '', university: '', department: '', position: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load profile from server
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        const p: ResearcherProfile = {
          fullName: data.fullName ?? session.user.name ?? '',
          university: data.university ?? '',
          department: data.department ?? '',
          position: (data.position as ResearcherProfile['position']) ?? '',
        };
        setForm(p);
        const complete = !!(p.university && p.department && p.position);
        if (complete) { setProfileSummary(p); onProfileChange(p); }
        else onProfileChange(null);
      })
      .catch(() => setForm((f) => ({ ...f, fullName: session.user.name ?? '' })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropdownOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const handleSave = async () => {
    if (!form.university.trim() || !form.department.trim() || !form.position) return;
    setSaving(true);
    setSaveError('');
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ university: form.university, department: form.department, position: form.position }),
    });
    setSaving(false);
    if (!res.ok) { setSaveError('Failed to save. Please try again.'); return; }
    setProfileSummary({ ...form });
    onProfileChange({ ...form });
    setPanelOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  // Guest / loading
  if (status !== 'authenticated') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
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

  const userName = session.user.name ?? 'User';
  const firstName = userName.split(' ')[0];
  const bg = avatarBg(userName);
  const ini = initials(userName);
  const profileComplete = !!(profileSummary?.university && profileSummary?.department && profileSummary?.position);

  return (
    <>
      {/* ── Avatar + dropdown trigger ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 hover:bg-slate-700 px-2 pr-3 py-1.5 transition-colors"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: bg }}
          >
            {ini}
          </span>
          <span className="hidden sm:inline text-xs font-medium text-slate-200">{firstName}</span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* ── Dropdown menu ── */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden z-50">
            {/* User header */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  {ini}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>
              {profileComplete && (
                <p className="mt-2 text-xs text-indigo-600 font-medium truncate">
                  {[profileSummary?.university, profileSummary?.department, profileSummary?.position]
                    .filter(Boolean).join(' • ')}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100" />

            <div className="py-1">
              <button
                onClick={() => { setDropdownOpen(false); setPanelOpen(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <span>👤</span> My Profile
              </button>
              <Link
                href="/history"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>📋</span> Search History
              </Link>
            </div>

            <div className="border-t border-slate-100" />

            <div className="py-1">
              <button
                onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Profile slide-out panel ── */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
            onClick={() => setPanelOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full sm:max-w-sm bg-white shadow-2xl z-50 flex flex-col">
            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  {ini}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">My Profile</h2>
                  <p className="text-xs text-slate-500">Personalizes your Letter of Intent</p>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form fields */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  readOnly
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  title="Name is set from your account"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">University / Institution</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  placeholder="Stanford University"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="Dept. of Environmental Health"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Position</label>
                <div className="relative">
                  <select
                    value={form.position}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      position: e.target.value as ResearcherProfile['position'],
                    }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition appearance-none pr-8"
                  >
                    <option value="">Select position…</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.university.trim() || !form.department.trim() || !form.position}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Success toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-semibold shadow-lg animate-fade-in-up">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Profile saved ✓
        </div>
      )}
    </>
  );
}
