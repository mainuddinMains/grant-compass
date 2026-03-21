import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🧭</span>
            <span className="text-lg font-bold tracking-tight">Grant Compass</span>
          </div>
          <Link
            href="/search"
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-sm font-semibold transition-colors"
          >
            Search Grants →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Built at TrueHacks 2025 · Powered by Claude AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Find the perfect grant{' '}
            <span className="text-indigo-400">for your research</span>
            {' '}in seconds
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Describe your research in plain English. Grant Compass searches NIH and NSF
            in parallel, then uses Claude to rank and explain every match — so you spend
            time on science, not grant hunting.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-base font-semibold transition-colors shadow-lg shadow-indigo-900/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Demo
            </Link>
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 hover:border-slate-400 px-8 py-3.5 text-base font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Search Grants →
            </Link>
          </div>
        </div>

        {/* Hero bottom wave */}
        <div className="overflow-hidden">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
            <path d="M0 60 C360 0 1080 0 1440 60 L1440 60 L0 60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">Three steps from description to Letter of Intent</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe your research',
                body: 'Type a few sentences about your research focus in plain English — no grant IDs or agency codes required.',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'We search NIH & NSF',
                body: 'Grant Compass queries NIH Reporter v2 and NSF Awards API simultaneously and deduplicates the results.',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Claude ranks & explains',
                body: 'Claude scores each grant 0–100 for relevance, explains why it matches, and can generate a full Letter of Intent in one click.',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
            ].map(({ step, title, body, icon }) => (
              <div key={step} className="relative flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <div className="absolute top-5 right-5 text-3xl font-black text-slate-100 select-none">{step}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  {icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything you need</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">Designed for researchers, not grant administrators</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Natural language search',
                body: 'No Boolean operators or field codes. Just describe your work.',
                color: 'bg-blue-50 text-blue-600',
                icon: '💬',
              },
              {
                title: 'Live NIH & NSF data',
                body: 'Pulls from official APIs in real time — no stale database.',
                color: 'bg-green-50 text-green-600',
                icon: '🔴',
              },
              {
                title: 'AI relevance scores',
                body: 'Color-coded 0–100 bars make it instant to spot top matches.',
                color: 'bg-indigo-50 text-indigo-600',
                icon: '📊',
              },
              {
                title: 'One-click Letter of Intent',
                body: 'Claude writes a structured, formal one-page letter addressed to the funding agency.',
                color: 'bg-violet-50 text-violet-600',
                icon: '✉️',
              },
              {
                title: 'Copy to clipboard',
                body: 'Grab the generated letter instantly and paste it into your submission.',
                color: 'bg-amber-50 text-amber-600',
                icon: '📋',
              },
              {
                title: 'Demo mode fallback',
                body: 'Works even when external APIs are slow — sample grants always load.',
                color: 'bg-rose-50 text-rose-600',
                icon: '🛡️',
              },
            ].map(({ title, body, color, icon }) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-lg`}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ───────────────────────────────────────── */}
      <section className="py-14 bg-white border-t border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#20558A] flex items-center justify-center">
                <span className="text-white text-xs font-black">NIH</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">NIH Reporter</span>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center">
                <span className="text-white text-xs font-black">NSF</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">NSF Awards API</span>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D97706] flex items-center justify-center">
                <span className="text-white text-xs font-black">AI</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">Claude AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[#0f172a] text-white text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find your next grant?
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Start with the demo — no account, no setup required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-base font-semibold transition-colors shadow-lg shadow-indigo-900/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Demo
            </Link>
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 hover:border-slate-400 px-8 py-3.5 text-base font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Search Grants →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🧭</span>
            <span className="font-semibold text-slate-400">Grant Compass</span>
            <span>— Built at TrueHacks 2025</span>
          </div>
          <span>
            Data from{' '}
            <span className="text-slate-400">NIH Reporter</span>
            {' & '}
            <span className="text-slate-400">NSF Awards API</span>
            {' · AI by '}
            <span className="text-slate-400">Claude</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
