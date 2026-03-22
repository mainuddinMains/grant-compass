'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function FeatureItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MockCard({ score, label, agency, title, color }: { score: number; label: string; agency: string; title: string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${agency === 'NIH' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
          {agency}
        </span>
        <span className="text-xs font-semibold text-slate-800 truncate">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-600 w-6 text-right">{score}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="hidden lg:flex w-[420px] bg-[#0f172a] flex-col justify-center px-10 py-14 gap-10 flex-shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" aria-hidden="true">🧭</span>
          <span className="text-white font-bold text-lg">Grant Compass</span>
        </div>
        <h2 className="text-2xl font-bold text-white leading-snug">
          What you get with<br />Grant Compass
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <FeatureItem
          icon="🎯"
          title="AI-matched grants from NIH and NSF"
          desc="Claude ranks every open grant by relevance to your specific research focus."
        />
        <FeatureItem
          icon="✉️"
          title="Personalized Letter of Intent in seconds"
          desc="Generate a tailored letter using your name, university, and department."
        />
        <FeatureItem
          icon="📊"
          title="Compare grants side by side"
          desc="Pick two grants and get an AI recommendation on which to apply for."
        />
      </div>

      {/* Blurred mockup */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="blur-sm opacity-60 pointer-events-none select-none space-y-2" aria-hidden="true">
          <MockCard score={92} label="Strong match" agency="NIH" title="Neurological Development R01" color="bg-green-500" />
          <MockCard score={78} label="Moderate match" agency="NSF" title="CAREER Award — Environmental" color="bg-yellow-400" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    // 1. Create account
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Auto sign in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Account created but sign-in failed. Please go to the login page.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl" aria-hidden="true">🧭</span>
            <span className="text-lg font-bold tracking-tight">Grant Compass</span>
          </Link>
        </div>
      </header>

      {/* Two-column layout */}
      <main className="flex-1 flex min-h-0">
        {/* Left: form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              <p className="mt-1 text-sm text-slate-500">Start finding grants in seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-slate-600">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-600">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs font-semibold text-slate-600">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: preview panel (desktop only) */}
        <PreviewPanel />
      </main>
    </div>
  );
}
