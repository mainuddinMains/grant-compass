'use client';

import { useState } from 'react';

export interface ResearcherProfile {
  fullName: string;
  university: string;
  department: string;
  position: 'Masters Student' | 'PhD Student' | 'Postdoc' | 'Professor' | '';
}

const STORAGE_KEY = 'grant_compass_profile';
const POSITIONS = ['Masters Student', 'PhD Student', 'Postdoc', 'Professor'] as const;

export function loadProfile(): ResearcherProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ResearcherProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

interface ProfileFormProps {
  initial: ResearcherProfile | null;
  onSave: (profile: ResearcherProfile) => void;
}

export default function ProfileForm({ initial, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<ResearcherProfile>(
    initial ?? { fullName: '', university: '', department: '', position: '' }
  );
  const [editing, setEditing] = useState(!initial);

  const set = (field: keyof ResearcherProfile, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.fullName.trim() || !form.university.trim() || !form.position) return;
    saveProfile(form);
    onSave(form);
    setEditing(false);
  };

  // Collapsed summary view
  if (!editing && initial) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {initial.fullName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{initial.fullName}</p>
            <p className="text-xs text-slate-400 truncate">
              {initial.position} · {initial.department}, {initial.university}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  // Form view
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Researcher Profile
        </p>
        <span className="text-xs text-slate-400">— used to personalise your Letter of Intent</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Dr. Jane Smith"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
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
          <div className="flex gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => set('position', pos)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
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

      <div className="flex items-center justify-between mt-4">
        {initial && (
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!form.fullName.trim() || !form.university.trim() || !form.position}
          className="ml-auto rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
