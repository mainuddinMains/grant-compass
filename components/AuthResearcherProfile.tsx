'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { ResearcherProfile } from '@/components/ProfileForm';

const POSITIONS = ['Masters Student', 'PhD Student', 'Postdoc', 'Professor', 'Other'] as const;

interface AuthResearcherProfileProps {
  onProfileChange: (profile: ResearcherProfile | null) => void;
}

export default function AuthResearcherProfile({ onProfileChange }: AuthResearcherProfileProps) {
  const { data: session } = useSession();
  const [form, setForm] = useState<ResearcherProfile>({
    fullName: '',
    university: '',
    department: '',
    position: '',
  });
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load profile from server on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        const p: ResearcherProfile = {
          fullName: data.fullName ?? session?.user?.name ?? '',
          university: data.university ?? '',
          department: data.department ?? '',
          position: (data.position as ResearcherProfile['position']) ?? '',
        };
        setForm(p);
        const complete = !!(p.university && p.department && p.position);
        setProfileComplete(complete);
        setCollapsed(complete);
        onProfileChange(complete ? p : null);
        setLoaded(true);
      })
      .catch(() => {
        setForm((f) => ({ ...f, fullName: session?.user?.name ?? '' }));
        setLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const set = (field: keyof ResearcherProfile, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.university.trim() || !form.department.trim() || !form.position) return;
    setSaving(true);
    setSaveError('');

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university: form.university,
        department: form.department,
        position: form.position,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      setSaveError('Failed to save. Please try again.');
      return;
    }

    setProfileComplete(true);
    setCollapsed(true);
    onProfileChange(form);
  };

  if (!loaded) return null;

  // Collapsed view
  if (collapsed && profileComplete) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-200 transition-colors"
        onClick={() => setCollapsed(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setCollapsed(false)}
        aria-label="Expand researcher profile"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {form.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              👤 {form.fullName}{form.position ? ` · ${form.position}` : ''}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {[form.department, form.university].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
          Edit
        </span>
      </div>
    );
  }

  // Expanded / edit form
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Researcher Profile
          </p>
          <span className="text-xs text-slate-400">— personalises your Letter of Intent</span>
        </div>
        {profileComplete && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Collapse
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Full Name — read-only from account */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            readOnly
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            title="Name is set from your account"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">University / Institution</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => set('university', e.target.value)}
            placeholder="Stanford University"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Department</label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
            placeholder="Dept. of Environmental Health"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Position</label>
          <div className="flex flex-wrap gap-1.5">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => set('position', pos)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  form.position === pos
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {saveError && (
        <p className="mt-2 text-xs text-red-500">{saveError}</p>
      )}

      <div className="flex items-center justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving || !form.university.trim() || !form.department.trim() || !form.position}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
