import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Static data ──────────────────────────────────────────────── */

const STATS = [
  { value: '50,000+', label: 'Grants Indexed', icon: '📄' },
  { value: 'NIH & NSF', label: 'Agencies Covered', icon: '🏛️' },
  { value: '< 60s', label: 'Time to Match', icon: '⚡' },
  { value: 'Free', label: 'To Get Started', icon: '🎁' },
];

const RESEARCH_AREAS = [
  'Neuroscience', 'Oncology', 'Climate Science', 'Public Health',
  'Genomics', 'Biomedical Engineering', 'Environmental Science',
  'Cardiology', 'Computational Biology', 'Immunology',
  'Materials Science', 'Education Research', 'Psychiatry',
  'Social Sciences', 'Data Science & AI',
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'AI-Powered Matching',
    desc: 'Claude reads every open NIH and NSF grant and ranks them 0–100 for relevance to your specific research — not keyword overlap, but true semantic understanding.',
    detail: 'Matches across R01, R21, CAREER, STRIDES, and 40+ other grant mechanisms.',
  },
  {
    icon: '✉️',
    title: 'Letter of Intent Generator',
    desc: 'One click generates a formal, agency-addressed Letter of Intent tailored to your name, university, department, and research focus.',
    detail: 'Follows NIH and NSF formatting guidelines automatically.',
  },
  {
    icon: '📊',
    title: 'Side-by-Side Comparison',
    desc: 'Pick any two grants and get a structured AI comparison — funding amounts, effort estimates, fit scores, and a clear recommendation on which to pursue.',
    detail: 'Includes deadline urgency, competition level, and effort-vs-reward analysis.',
  },
];

const HOW_STEPS = [
  {
    num: 1, icon: '✍️',
    title: 'Describe your research',
    desc: 'Write 2–3 sentences about what you study in plain English. No grant codes, Boolean operators, or jargon required.',
  },
  {
    num: 2, icon: '🔍',
    title: 'We search NIH & NSF',
    desc: 'Grant Compass queries both agencies in parallel, pulling only currently open opportunities with active deadlines.',
  },
  {
    num: 3, icon: '🤖',
    title: 'Claude ranks every match',
    desc: 'Each grant receives a 0–100 relevance score with a written explanation of why it fits your specific research focus.',
  },
  {
    num: 4, icon: '✉️',
    title: 'Generate your letter',
    desc: 'One click produces a submission-ready Letter of Intent addressed to the funding agency, personalized to your profile.',
  },
];

const MOCK_GRANTS = [
  {
    agency: 'NIH',
    title: 'R01 — Mechanisms of Neuroplasticity in Early Development',
    score: 92,
    amount: '$450K',
    days: 34,
    reason: 'Strong alignment with neurological development research. Funding targets early-career investigators studying cognitive development mechanisms.',
    color: 'bg-green-500',
    agencyColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    agency: 'NSF',
    title: 'CAREER Award — Environmental Neurotoxicology',
    score: 78,
    amount: '$300K',
    days: 67,
    reason: 'Relevant to toxicological impacts on neural systems. Award supports junior faculty combining research and education.',
    color: 'bg-yellow-400',
    agencyColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    agency: 'NIH',
    title: 'R21 — Exploratory Research in Cognitive Biomarkers',
    score: 65,
    amount: '$275K',
    days: 89,
    reason: 'Moderate fit for cognitive research. Supports high-risk, high-reward pilot studies without preliminary data.',
    color: 'bg-amber-400',
    agencyColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
];

/* ── Component ────────────────────────────────────────────────── */

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f172a] overflow-x-hidden">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧭</span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Grant Compass</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="rounded-full border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-full px-4 py-1.5 text-sm font-bold text-white transition-all hover:brightness-110" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0f172a]">

        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="animate-glow-pulse absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 65%)' }} />
          <div className="animate-float-slow absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-5 dark:opacity-10"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="animate-float absolute -bottom-10 -right-10 w-96 h-96 rounded-full opacity-5 dark:opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '2s' }} />
          {/* Decorative molecule-like dots */}
          <div className="animate-float hidden lg:block absolute top-32 left-16 w-3 h-3 rounded-full bg-indigo-300 dark:bg-indigo-600 opacity-40" style={{ animationDelay: '0.5s' }} />
          <div className="animate-float hidden lg:block absolute top-48 left-32 w-1.5 h-1.5 rounded-full bg-violet-300 dark:bg-violet-600 opacity-40" style={{ animationDelay: '1.2s' }} />
          <div className="animate-float hidden lg:block absolute top-24 right-24 w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 opacity-30" style={{ animationDelay: '0.8s' }} />
          <div className="animate-float hidden lg:block absolute top-56 right-40 w-3 h-3 rounded-full bg-purple-300 dark:bg-purple-600 opacity-30" style={{ animationDelay: '1.8s' }} />
          <div className="animate-float hidden lg:block absolute bottom-16 left-1/4 w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-600 opacity-25" style={{ animationDelay: '2.5s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-36 text-center">

          {/* Headline */}
          <h1 className="animate-slide-up animation-delay-100 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white">
            Find the perfect grant{' '}
            <span
              className="text-transparent bg-clip-text animate-gradient-x"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #6366f1)', backgroundSize: '200% 200%' }}
            >
              for your research
            </span>
            {' '}in seconds
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up animation-delay-200 mt-7 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop spending weeks hunting through grant databases. Describe your research in plain English
            and let AI surface the most relevant NIH and NSF opportunities — with scores, explanations, and a ready-to-send letter.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up animation-delay-400 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/50 transition-all hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Get Started Free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/search?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 px-8 py-4 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Live Demo
            </Link>
          </div>

          <p className="animate-slide-up animation-delay-500 mt-8 text-xs text-slate-400 dark:text-slate-600 font-medium">
            No credit card required · Free forever plan available
          </p>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label, icon }, i) => (
              <div key={label} className={`animate-slide-up-sm animation-delay-${(i + 1) * 100} flex flex-col items-center gap-1.5`}>
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research areas ────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0f172a] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">Built for researchers</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
            Trusted across every research domain
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Whether you're studying synaptic plasticity or social inequality, Grant Compass finds the right funding for your work.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {RESEARCH_AREAS.map((area, i) => (
              <span
                key={area}
                className={`animate-fade-in-up animation-delay-${Math.min(i * 50, 375)} inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-default`}
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">What you get</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything a researcher needs
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, detail }, i) => (
              <div
                key={title}
                className={`animate-fade-in-up animation-delay-${i * 150} flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
                <p className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample results preview ────────────────────────────── */}
      <section className="bg-white dark:bg-[#0f172a] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">See it in action</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your results look like this
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed text-sm">
              Every grant gets a relevance score, a plain-English explanation, and funding details — all in one place.
            </p>
          </div>

          {/* Mock result cards with blur overlay */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* Cards */}
            <div className="flex flex-col gap-3 p-1">
              {MOCK_GRANTS.map((g, i) => (
                <div
                  key={g.title}
                  className={`animate-fade-in-up animation-delay-${i * 150} rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 flex flex-col gap-3 shadow-sm ${i >= 2 ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${g.agencyColor}`}>{g.agency}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug flex-1">{g.title}</p>
                  </div>
                  {/* Score bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${g.color} transition-all duration-700`} style={{ width: `${g.score}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200 w-6 text-right">{g.score}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                      {g.score >= 80 ? 'Strong match' : g.score >= 60 ? 'Moderate match' : 'Fair match'}
                    </span>
                  </div>
                  {/* Reason */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
                    {g.reason}
                  </p>
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{g.amount}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {g.days} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Blur overlay on bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 flex flex-col items-center justify-end pb-6"
              style={{ background: 'linear-gradient(to top, white 50%, transparent)' }}>
              <div className="dark:hidden">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Sign up to see your matches →
                </Link>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-40 hidden dark:flex flex-col items-center justify-end pb-6"
              style={{ background: 'linear-gradient(to top, #0f172a 50%, transparent)' }}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/50 transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Sign up to see your matches →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              From research description to Letter of Intent in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_STEPS.map(({ num, icon, title, desc }, i) => (
              <div
                key={num}
                className={`animate-fade-in-up animation-delay-${i * 150} relative flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200`}
              >
                <div className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none leading-none">
                  {String(num).padStart(2, '0')}
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/70 border border-indigo-100 dark:border-indigo-700/50 flex items-center justify-center text-xl relative z-10">
                  {icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0f172a] py-10 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-7">
            Data powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            <div className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#20558A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-black">NIH</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">NIH Reporter</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">National Institutes of Health</p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#003087] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-black">NSF</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">NSF Awards API</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">National Science Foundation</p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#D97706] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-black">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Claude AI</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Anthropic</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0f172a] py-24 sm:py-32 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="animate-glow-pulse w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 65%)' }} />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4">Start today</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Ready to find your perfect grant?
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Join researchers using Grant Compass to cut grant-hunting time from weeks to minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/50 transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Sign Up Free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 px-10 py-4 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-[#0f172a]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🧭</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Grant Compass</span>
            <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">AI-powered grant discovery for researchers</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400 dark:text-slate-600">
            <Link href="/login"  className="hover:text-indigo-500 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-indigo-500 transition-colors">Sign Up</Link>
            <Link href="/search?demo=true" className="hover:text-indigo-500 transition-colors">Try Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
