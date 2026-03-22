'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ResearcherProfile } from '@/components/ProfileForm';
import type { ResearchAnalysis } from '@/lib/auth-db';

const POSITIONS: ResearcherProfile['position'][] = [
  'Masters Student', 'PhD Student', 'Postdoc', 'Professor', 'Researcher', 'Other',
];

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

// ── Circular score ring ────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const ringColor =
    clamped >= 71 ? '#16a34a' :
    clamped >= 41 ? '#d97706' :
    '#dc2626';
  const textColor =
    clamped >= 71 ? 'text-green-700' :
    clamped >= 41 ? 'text-amber-700' :
    'text-red-700';
  const label =
    clamped >= 71 ? 'Strong' :
    clamped >= 41 ? 'Developing' :
    'Early Stage';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none"
            stroke={ringColor}
            strokeWidth="2.5"
            strokeDasharray={`${clamped} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-extrabold leading-none ${textColor}`}>{clamped}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600">Fundability Score</p>
      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
        clamped >= 71 ? 'bg-green-100 text-green-700' :
        clamped >= 41 ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      }`}>{label}</span>
    </div>
  );
}

interface NavUserMenuProps {
  onProfileChange: (profile: ResearcherProfile | null) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function NavUserMenu({ onProfileChange, onSuggestionClick }: NavUserMenuProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ResearcherProfile | null>(null);
  const [urgentDeadlineCount, setUrgentDeadlineCount] = useState(0);
  const [form, setForm] = useState<ResearcherProfile>({
    fullName: '', university: '', department: '', position: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Research analysis state
  const [researchText, setResearchText] = useState('');
  const [analysis, setAnalysis] = useState<ResearchAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  // Load profile + analysis from server
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

        if (data.researchAnalysis) setAnalysis(data.researchAnalysis);
      })
      .catch(() => setForm((f) => ({ ...f, fullName: session.user.name ?? '' })));

    fetch('/api/deadlines')
      .then((r) => r.json())
      .then((data) => {
        const now = Date.now();
        const count = (data.deadlines ?? []).filter((d: { deadline: string | null }) => {
          if (!d.deadline) return false;
          const daysLeft = Math.ceil((new Date(d.deadline).getTime() - now) / 86400000);
          return daysLeft >= 0 && daysLeft <= 30;
        }).length;
        setUrgentDeadlineCount(count);
      })
      .catch(() => {});
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

  const handleAnalyze = async () => {
    if (!researchText.trim()) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const res = await fetch('/api/research-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract: researchText }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (!data.analysis) throw new Error('No analysis returned');
      setAnalysis(data.analysis);
      // Persist to profile
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchAnalysis: data.analysis }),
      }).catch(() => {});
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setPanelOpen(false);
    if (onSuggestionClick) {
      onSuggestionClick(s);
    } else {
      router.push(`/search?q=${encodeURIComponent(s)}`);
    }
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
  const userImage = session.user.image ?? null;
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
          <span className="relative flex-shrink-0">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="w-6 h-6 rounded-full items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: bg, display: userImage ? 'none' : 'flex' }}
            >
              {ini}
            </span>
            {urgentDeadlineCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {urgentDeadlineCount > 9 ? '9+' : urgentDeadlineCount}
              </span>
            )}
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
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="relative flex-shrink-0 w-9 h-9">
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImage}
                      alt={userName}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="w-9 h-9 rounded-full items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: bg, display: userImage ? 'none' : 'flex' }}
                  >
                    {ini}
                  </span>
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
              {analysis && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Fundability:</span>
                  <span className={`text-xs font-bold ${
                    analysis.fundabilityScore >= 71 ? 'text-green-600' :
                    analysis.fundabilityScore >= 41 ? 'text-amber-600' : 'text-red-600'
                  }`}>{analysis.fundabilityScore}/100</span>
                </div>
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
              <Link
                href="/deadlines"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span>🔔</span> My Deadlines
                </span>
                {urgentDeadlineCount > 0 && (
                  <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                    {urgentDeadlineCount}
                  </span>
                )}
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
          <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col">

            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="relative flex-shrink-0 w-9 h-9">
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImage}
                      alt={userName}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="w-9 h-9 rounded-full items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: bg, display: userImage ? 'none' : 'flex' }}
                  >
                    {ini}
                  </span>
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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

              {/* ── Profile fields ── */}
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

              {saveError && <p className="text-xs text-red-500">{saveError}</p>}

              {/* ── Research Strength Analysis ── */}
              <div className="border-t border-slate-100 pt-4 mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Research Strength Analysis
                  </p>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Get your fundability score, top strengths, and AI-optimized search suggestions.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Research Abstract or CV Summary
                  </label>
                  <textarea
                    value={researchText}
                    onChange={(e) => setResearchText(e.target.value)}
                    placeholder="Paste a paragraph describing your research background, publications, or current projects..."
                    style={{ height: '150px' }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition resize-none"
                  />
                </div>

                {analyzeError && (
                  <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {analyzeError}
                  </p>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !researchText.trim()}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyze My Research
                    </>
                  )}
                </button>
              </div>

              {/* ── Analysis results ── */}
              {analysis && (
                <div className="flex flex-col gap-5 pt-1">

                  {/* Score ring */}
                  <div className="flex justify-center py-2">
                    <ScoreRing score={analysis.fundabilityScore} />
                  </div>

                  {/* Top Strengths */}
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Your Top Strengths
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topStrengths.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-green-100 text-green-800 text-xs font-semibold px-3 py-1"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Grant Types */}
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Recommended Grant Types
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommendedGrantTypes.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Profile Gaps */}
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Areas to Strengthen
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.profileGaps.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Search Suggestions */}
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Optimized Search Suggestions
                    </p>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Click any suggestion to search grants instantly
                    </p>
                    <div className="flex flex-col gap-2">
                      {analysis.searchSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(s)}
                          className="w-full text-left rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 px-3.5 py-2.5 text-xs text-indigo-800 font-medium transition-colors"
                        >
                          <span className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {s}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-semibold shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Profile saved ✓
        </div>
      )}
    </>
  );
}
