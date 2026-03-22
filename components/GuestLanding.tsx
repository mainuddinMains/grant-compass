import Link from 'next/link';

const STEPS = [
  {
    num: 1,
    icon: '🔍',
    title: 'Describe your research in plain English',
    desc: 'No grant codes or Boolean operators — just write what you study.',
  },
  {
    num: 2,
    icon: '🤖',
    title: 'AI matches you with relevant NIH and NSF grants',
    desc: 'Claude scores every open grant 0–100 for relevance to your work.',
  },
  {
    num: 3,
    icon: '📊',
    title: 'Compare grants and see your match score',
    desc: 'Sort, filter, and compare two grants side by side with AI commentary.',
  },
  {
    num: 4,
    icon: '✉️',
    title: 'Generate a personalized Letter of Intent',
    desc: 'One click produces a formal, agency-addressed letter ready to submit.',
  },
];

export default function GuestLanding() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)' }}
    >

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="bg-[#0f172a] text-white shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧭</span>
            <span className="text-xl font-bold tracking-tight">Grant Compass</span>
          </div>

          {/* Right: auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-4 py-1.5 text-sm font-bold text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* ── Locked search bar ─────────────────────────────────── */}
        <div className="relative group/search">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-5 py-4 shadow-sm opacity-60 cursor-not-allowed select-none">
            {/* Info icon */}
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1 text-sm text-slate-400">
              Describe your research in plain English…
            </span>
            {/* Lock icon */}
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/search:block z-20 pointer-events-none">
            <div className="rounded-xl bg-slate-800 text-white text-xs px-4 py-2 shadow-xl whitespace-nowrap">
              🔒 Sign in to search your own research
            </div>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── LEFT: How to Use ─────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                How to Use Grant Compass
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                From research description to Letter of Intent in minutes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {STEPS.map(({ num, icon, title, desc }) => (
                <div
                  key={num}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
                >
                  {/* Number badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {num}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      <span className="mr-1.5">{icon}</span>
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/signup"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Sign Up Free →
              </Link>
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Demo ───────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                See it in action
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Try the demo — no account required.
              </p>
            </div>

            {/* Try Demo button */}
            <Link
              href="/search?demo=true"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg shadow-indigo-200"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Live Demo
            </Link>

            {/* Preview grant card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
              {/* Card header */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center">1</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      NIH
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    NIH Brain Development Research Grant
                  </h3>
                </div>
              </div>

              {/* Match score bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: '85%' }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8 text-right text-green-700">85</span>
                  <span className="text-xs text-green-700 hidden sm:inline">Strong match</span>
                </div>
              </div>

              {/* Claude reason */}
              <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-blue-200 pl-3 italic">
                Strong alignment with neurological development research. Funding specifically targets
                early-career investigators studying cognitive development mechanisms.
              </p>

              {/* Meta: amount + deadline */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-700">$450K</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  87 days left
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                Supports research on mechanisms underlying early brain development and neuroplasticity,
                with emphasis on translational approaches linking basic science to clinical outcomes.
              </p>

              {/* Footer: locked Generate Letter button */}
              <div className="pt-1 border-t border-gray-100">
                <div className="relative group/letter inline-block">
                  <button
                    disabled
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-400 opacity-50 cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Letter of Intent
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/letter:block z-10 pointer-events-none">
                    <div className="rounded-lg bg-slate-800 text-white text-xs px-3 py-1.5 whitespace-nowrap shadow-lg">
                      Sign in to unlock
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400 leading-relaxed">
              Sign in to see real matches for your research
              {' · '}
              <Link href="/signup" className="text-indigo-500 hover:text-indigo-600 font-medium">
                Create free account →
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span aria-hidden="true">🧭</span>
            <span className="font-semibold text-slate-700">Grant Compass</span>
            <span>·</span>
            <span>Powered by NIH Reporter, NSF Awards API & Claude AI</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/login" className="hover:text-slate-600 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-600 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
