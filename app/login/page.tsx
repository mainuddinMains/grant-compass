'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
    } else {
      router.push(from === '/login' ? '/dashboard' : from);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl" aria-hidden="true">🧭</span>
            <span className="text-lg font-bold tracking-tight">Grant Compass</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Two-column layout */}
      <main className="flex-1 flex min-h-0">
        {/* Left: form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to your account</h1>
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm flex flex-col gap-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#0f172a] hover:bg-slate-700 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                Sign up
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
