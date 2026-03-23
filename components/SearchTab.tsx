'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import GrantCard from '@/components/GrantCard';
import LetterModal from '@/components/LetterModal';
import GrantFeed from '@/components/GrantFeed';
import type { ResearcherProfile } from '@/components/ProfileForm';
import { sampleGrants } from '@/lib/sampleGrants';
import { RESULTS_KEY, SEARCH_KEY } from '@/app/grants/[id]/page';
import type { Grant } from '@/lib/nih';
import type { GrantProps } from '@/components/GrantCard';
import type { MatchResult, SuccessPrediction } from '@/lib/types';

const HISTORY_KEY = 'grant_compass_history';
const COMPARE_KEY = 'grant_compass_compare';
const STAGGER = ['', 'animation-delay-75', 'animation-delay-150', 'animation-delay-225', 'animation-delay-300', 'animation-delay-375'];

const RESEARCH_FIELDS: Record<string, string[]> = {
  'Computer Science': [
    'Machine Learning', 'Deep Learning', 'Computer Vision',
    'Natural Language Processing', 'Robotics', 'Cybersecurity',
    'Human-Computer Interaction', 'Data Science', 'Algorithms',
    'Distributed Systems', 'Quantum Computing', 'Bioinformatics',
  ],
  'Biology & Life Sciences': [
    'Neuroscience', 'Cancer Biology', 'Genomics', 'Cell Biology',
    'Stem Cell Biology', 'Synthetic Biology', 'Structural Biology',
    'Microbiology', 'Immunology', 'Ecology', 'Marine Biology',
    'Evolutionary Biology', 'Molecular Biology',
  ],
  'Medicine & Health': [
    'Public Health', 'Cardiology', 'Neurodegenerative Disease',
    'Drug Discovery', 'Vaccine Development', 'Epidemiology',
    'Precision Medicine', 'Pediatric Research', 'Mental Health',
    'Global Health', 'Nuclear Medicine', 'Pharmacology',
  ],
  'Chemistry & Materials': [
    'Materials Science', 'Proteomics', 'Gene Therapy',
    'Biomedical Engineering', 'Nutrition Science',
    'Environmental Health', 'Soil Science', 'Cell Biology',
  ],
  'Physics & Engineering': [
    'Astrophysics', 'Renewable Energy', 'Quantum Computing',
    'Robotics', 'Biomedical Engineering', 'Nuclear Medicine',
  ],
  'Social & Health Sciences': [
    'Behavioral Science', 'Mental Health', 'Public Health',
    'Aging & Longevity', 'Pediatric Research', 'Global Health',
  ],
};

const RESEARCH_DOMAINS = [
  { label: 'Neuroscience',            query: 'neuroscience and brain research' },
  { label: 'Cancer Biology',          query: 'cancer biology and oncology research' },
  { label: 'Genomics',                query: 'genomics and genetic sequencing research' },
  { label: 'Climate Science',         query: 'climate science and environmental research' },
  { label: 'Machine Learning',        query: 'machine learning and artificial intelligence research' },
  { label: 'Drug Discovery',          query: 'drug discovery and pharmaceutical research' },
  { label: 'Public Health',           query: 'public health and epidemiology research' },
  { label: 'Materials Science',       query: 'materials science and nanotechnology' },
  { label: 'Ecology',                 query: 'ecology and biodiversity research' },
  { label: 'Immunology',              query: 'immunology and infectious disease research' },
  { label: 'Astrophysics',            query: 'astrophysics and space science research' },
  { label: 'Bioinformatics',          query: 'bioinformatics and computational biology' },
  { label: 'Quantum Computing',       query: 'quantum computing and quantum information science' },
  { label: 'Cognitive Science',       query: 'cognitive science and psychology research' },
  { label: 'Renewable Energy',        query: 'renewable energy and clean technology research' },
  { label: 'Structural Biology',      query: 'structural biology and protein research' },
  { label: 'Robotics',                query: 'robotics and autonomous systems research' },
  { label: 'Epidemiology',            query: 'epidemiology and disease surveillance research' },
  { label: 'Cardiology',              query: 'cardiovascular disease and heart research' },
  { label: 'Stem Cell Biology',       query: 'stem cell biology and regenerative medicine' },
  { label: 'Synthetic Biology',       query: 'synthetic biology and genetic engineering' },
  { label: 'Neurodegenerative Disease', query: 'neurodegenerative disease Alzheimer Parkinson research' },
  { label: 'Global Health',           query: 'global health and infectious disease prevention' },
  { label: 'Microbiome',              query: 'microbiome and gut health research' },
  { label: 'Data Science',            query: 'data science and biomedical informatics research' },
  { label: 'Aging & Longevity',       query: 'aging longevity and geroscience research' },
  { label: 'Mental Health',           query: 'mental health depression anxiety psychiatric research' },
  { label: 'Nutrition Science',       query: 'nutrition science and dietary health research' },
  { label: 'Vaccine Development',     query: 'vaccine development and immunization research' },
  { label: 'Gene Therapy',            query: 'gene therapy and CRISPR genetic medicine' },
  { label: 'Marine Biology',          query: 'marine biology and ocean science research' },
  { label: 'Biomedical Engineering',  query: 'biomedical engineering and medical devices research' },
  { label: 'Proteomics',              query: 'proteomics and protein expression research' },
  { label: 'Computer Vision',         query: 'computer vision and image recognition research' },
  { label: 'Natural Language Processing', query: 'natural language processing and text mining research' },
  { label: 'Environmental Health',    query: 'environmental health and toxicology research' },
  { label: 'Cell Biology',            query: 'cell biology and molecular mechanisms research' },
  { label: 'Pharmacology',            query: 'pharmacology and drug mechanisms research' },
  { label: 'Pediatric Research',      query: 'pediatric health and child development research' },
  { label: 'Precision Medicine',      query: 'precision medicine and personalized healthcare' },
  { label: 'Nuclear Medicine',        query: 'nuclear medicine and radiopharmaceutical research' },
  { label: 'Soil Science',            query: 'soil science and agricultural sustainability research' },
  { label: 'Behavioral Science',      query: 'behavioral science and human behavior research' },
];

interface SearchTabProps {
  initialQuery: string;
  preloadedResults: MatchResult[] | null;
  profile: ResearcherProfile | null;
}

export default function SearchTab({ initialQuery, preloadedResults, profile }: SearchTabProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [description, setDescription] = useState(initialQuery);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchDescription, setResearchDescription] = useState('');
  const [activeGrant, setActiveGrant] = useState<GrantProps | null>(null);
  const [usedSampleData, setUsedSampleData] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [limitedMatches, setLimitedMatches] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  const [predictions, setPredictions] = useState<Record<number, SuccessPrediction>>({});
  const [predictingIndices, setPredictingIndices] = useState<Set<number>>(new Set());
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [domainSearch, setDomainSearch] = useState('');
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // AI Chat assistant
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preloadedResults && preloadedResults.length > 0 && initialQuery) {
      setMatchResults(preloadedResults);
      setResearchDescription(initialQuery);
      setDescription(initialQuery);
      setHasSearched(true);
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(preloadedResults));
        localStorage.setItem(SEARCH_KEY, initialQuery);
      } catch { /* ignore */ }
    } else if (initialQuery) {
      setDescription(initialQuery);
      void handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (desc: string) => {
    setResearchDescription(desc);
    setIsSearching(true);
    setMatchResults([]);
    setError(null);
    setUsedSampleData(false);
    setHasSearched(true);
    setLimitedMatches(false);
    setSuggestions([]);

    try {
      let grants: Grant[] = [];
      try {
        const grantsRes = await fetch(`/api/grants?q=${encodeURIComponent(desc)}`);
        if (grantsRes.ok) {
          const grantsData = await grantsRes.json();
          grants = grantsData.grants ?? [];
        }
      } catch { /* fall through to sample data */ }

      if (grants.length === 0) {
        grants = sampleGrants;
        setUsedSampleData(true);
      }

      setIsMatching(true);
      setIsSearching(false);
      setIsSuggesting(true);

      const [matchRes, suggestRes] = await Promise.all([
        fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchDescription: desc, grants }),
        }),
        fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchDescription: desc }),
        }).catch(() => null),
      ]);

      if (!matchRes.ok) {
        const errBody = await matchRes.json().catch(() => ({}));
        throw new Error(errBody.detail ?? errBody.error ?? `Match API error: ${matchRes.status}`);
      }

      const matchData = await matchRes.json();
      const all: MatchResult[] = matchData.results ?? [];
      const aboveThreshold = all.filter((r) => r.score > 15);
      const isLimited = aboveThreshold.length < 5;
      const finalResults = isLimited ? all.slice(0, 20) : aboveThreshold;
      setLimitedMatches(isLimited);
      setMatchResults(finalResults);
      setPredictions({});
      setPredictingIndices(new Set());

      const top3 = finalResults
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.score > 40)
        .slice(0, 3);
      if (top3.length > 0) {
        setPredictingIndices(new Set(top3.map(({ i }) => i)));
        top3.forEach(({ r, i }) => {
          void (async () => {
            try {
              const predRes = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  grant: { title: r.grant.title, agency: r.grant.agency, description: r.grant.description },
                  researchDescription: desc,
                }),
              });
              if (predRes.ok) {
                const predData = await predRes.json();
                if (predData.prediction) setPredictions((prev) => ({ ...prev, [i]: predData.prediction }));
              }
            } catch { /* silently skip */ }
            setPredictingIndices((prev) => { const next = new Set(prev); next.delete(i); return next; });
          })();
        });
      }

      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(finalResults));
        localStorage.setItem(SEARCH_KEY, desc);
      } catch { /* ignore */ }

      try {
        const topScore = finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.score)) : 0;
        const entry = { id: Date.now().toString(), description: desc, timestamp: Date.now(), grantCount: finalResults.length, topScore, results: finalResults };
        const stored = localStorage.getItem(HISTORY_KEY);
        const prev: { description: string }[] = stored ? JSON.parse(stored) : [];
        const deduped = prev.filter((e) => e.description !== desc);
        localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...deduped].slice(0, 5)));
      } catch { /* ignore */ }

      if (session?.user?.id) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchDescription: desc,
            grantsFound: finalResults.length,
            topMatchScore: finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.score)) : 0,
            fullResults: finalResults,
          }),
        }).catch(() => {});
      }

      if (suggestRes?.ok) {
        const suggestData = await suggestRes.json();
        setSuggestions(suggestData.suggestions ?? []);
      }
      setIsSuggesting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSearching(false);
      setIsMatching(false);
      setIsSuggesting(false);
    }
  };

  const handleCompareToggle = (index: number) => {
    setCompareIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };

  const handleCompare = () => {
    if (compareIndices.length !== 2) return;
    const [a, b] = compareIndices;
    const g1 = matchResults[a];
    const g2 = matchResults[b];
    const compareData = {
      grant1: { title: g1.grant.title, agency: g1.grant.agency, score: g1.score, reason: g1.reason, amount: g1.grant.amount, deadline: g1.grant.deadline, description: g1.grant.description, url: g1.grant.url },
      grant2: { title: g2.grant.title, agency: g2.grant.agency, score: g2.score, reason: g2.reason, amount: g2.grant.amount, deadline: g2.grant.deadline, description: g2.grant.description, url: g2.grant.url },
      researchDescription,
    };
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareData)); } catch { /* ignore */ }
    router.push('/compare');
  };

  const isLoading = isSearching || isMatching;

  const handleDomainSelect = (domain: { label: string; query: string }) => {
    setActiveDomain(domain.label);
    setDescription(domain.query);
    void handleSearch(domain.query);
  };

  const handleClearDomain = () => {
    setActiveDomain(null);
    setDescription('');
    setMatchResults([]);
    setHasSearched(false);
    setSuggestions([]);
    setError(null);
  };

  const filteredSidebarDomains = RESEARCH_DOMAINS.filter(d =>
    d.label.toLowerCase().includes(domainSearch.toLowerCase())
  );

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    const userMsg = { role: 'user' as const, content: text };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput('');
    setIsChatLoading(true);

    // Build context from current search
    const context = {
      researchDescription: researchDescription || undefined,
      grantTitles: matchResults.length > 0
        ? matchResults.slice(0, 10).map(r => r.grant.title)
        : undefined,
    };

    // Placeholder for streaming response
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context }),
      });

      if (!res.ok || !res.body) throw new Error('Chat API error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left Filter Sidebar ────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Research Fields</p>
            {activeDomain && (
              <button onClick={handleClearDomain} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                Clear
              </button>
            )}
          </div>
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter domains…"
              value={domainSearch}
              onChange={e => { setDomainSearch(e.target.value); setExpandedField(null); }}
              className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
            />
            {domainSearch && (
              <button onClick={() => setDomainSearch('')} className="text-slate-400 hover:text-slate-600 text-xs leading-none">✕</button>
            )}
          </div>
        </div>

        {/* Field / subfield list */}
        <div className="flex-1 overflow-y-auto py-1">
          {domainSearch.trim() ? (
            /* ── Search mode: flat filtered results grouped by parent ── */
            (() => {
              const q = domainSearch.toLowerCase();
              const matches: { field: string; subfield: string }[] = [];
              Object.entries(RESEARCH_FIELDS).forEach(([field, subfields]) => {
                subfields.forEach(sub => {
                  if (sub.toLowerCase().includes(q) || field.toLowerCase().includes(q)) {
                    matches.push({ field, subfield: sub });
                  }
                });
              });

              if (matches.length === 0) {
                return <p className="text-xs text-slate-400 text-center py-8 px-4">No matches found</p>;
              }

              // Group by parent field
              const grouped: Record<string, string[]> = {};
              matches.forEach(({ field, subfield }) => {
                if (!grouped[field]) grouped[field] = [];
                grouped[field].push(subfield);
              });

              return Object.entries(grouped).map(([field, subfields]) => (
                <div key={field} className="mb-1">
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {field}
                  </p>
                  {subfields.map(sub => {
                    const isActive = activeDomain === sub;
                    const idx = sub.toLowerCase().indexOf(q);
                    return (
                      <button
                        key={sub}
                        onClick={() => handleDomainSelect({ label: sub, query: `${sub} research` })}
                        disabled={isLoading}
                        className={`w-full text-left pl-6 pr-4 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {idx >= 0 ? (
                          <>
                            {sub.slice(0, idx)}
                            <mark className="bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded px-0.5">
                              {sub.slice(idx, idx + q.length)}
                            </mark>
                            {sub.slice(idx + q.length)}
                          </>
                        ) : sub}
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          ) : (
            /* ── Normal mode: expandable field sections ── */
            Object.entries(RESEARCH_FIELDS).map(([field, subfields]) => {
              const isExpanded = expandedField === field;
              return (
                <div key={field} className={`border-b border-slate-100 dark:border-slate-700/50 ${isExpanded ? 'border-l-2 border-l-indigo-400' : ''}`}>
                  {/* Main field row */}
                  <button
                    onClick={() => setExpandedField(isExpanded ? null : field)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors ${
                      isExpanded
                        ? 'bg-indigo-50/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">{field}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="text-slate-400 dark:text-slate-500 font-normal">({subfields.length})</span>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Subfields */}
                  {isExpanded && (
                    <div className="pb-1 bg-indigo-50/30 dark:bg-indigo-900/10">
                      {subfields.map(sub => {
                        const isActive = activeDomain === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => handleDomainSelect({ label: sub, query: `${sub} research` })}
                            disabled={isLoading}
                            className={`w-full text-left pl-6 pr-4 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between gap-2 ${
                              isActive
                                ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                            }`}
                          >
                            <span className="truncate">{sub}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            Can&apos;t find your field?<br />Type it in the search bar above.
          </p>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="p-6 xl:p-8 flex flex-col gap-5 min-h-full">

          {/* ── Centered search bar (always visible at top) ────────── */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[1000px]">
              <SearchBar
                value={description}
                onChange={(val) => { setDescription(val); setActiveDomain(null); }}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Press Enter or click to search
            </p>
          </div>

          {/* Status banners */}
          {isSearching && <StatusBanner message="Searching NIH Reporter and NSF APIs…" />}
          {isMatching  && <StatusBanner message="Claude is ranking grants by relevance…" />}

          {/* Notices */}
          {usedSampleData && matchResults.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Live APIs returned no results — showing sample grant data for demonstration.
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Welcome / empty state ──────────────────────────────── */}
          {!hasSearched && !isLoading && (
            <div className="flex-1 flex flex-col items-center gap-6 py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-inner">
                  🧭
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">Find your perfect grant</p>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-md leading-relaxed">
                    Describe your research above, or click a domain below to get started.
                  </p>
                </div>
              </div>

              {/* All domain chips — centered, wrapping */}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {RESEARCH_DOMAINS.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => { setDescription(d.query); void handleSearch(d.query); }}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* ── Personalized Grant Feed ─────────────────────── */}
              <div className="w-full max-w-5xl">
                <GrantFeed
                  profile={profile}
                  onSearchQuery={(q) => { setDescription(q); void handleSearch(q); }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {matchResults.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Matched Grants
                    <span className="ml-2 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                      {matchResults.length}
                    </span>
                  </h2>
                  {activeDomain && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      {activeDomain}
                      <button onClick={handleClearDomain} className="hover:text-indigo-900 leading-none">✕</button>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">Sorted by relevance</span>
              </div>

              {limitedMatches && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Limited matches found — try refining your description with more specific scientific terms.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {matchResults.map((result, i) => {
                  const grantProps: GrantProps = {
                    title: result.grant.title,
                    agency: result.grant.agency,
                    score: result.score,
                    reason: result.reason,
                    amount: result.grant.amount,
                    deadline: result.grant.deadline,
                    description: result.grant.description,
                    url: result.grant.url,
                  };
                  return (
                    <div key={`${result.grantId}-${i}`} className={`animate-fade-in-up ${STAGGER[Math.min(i, STAGGER.length - 1)]}`}>
                      <GrantCard
                        rank={i + 1}
                        index={i}
                        grant={grantProps}
                        onGenerateLetter={() => setActiveGrant(grantProps)}
                        compareSelected={compareIndices.includes(i)}
                        compareDisabled={compareIndices.length >= 2}
                        onCompareToggle={() => handleCompareToggle(i)}
                        guestMode={false}
                        prediction={predictions[i]}
                        predictionLoading={predictingIndices.has(i)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Refine suggestions (inline, below results) ─────────── */}
          {(suggestions.length > 0 || isSuggesting) && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">✦ Refine Search</p>
              {isSuggesting && suggestions.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Generating suggestions…
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setDescription(s); void handleSearch(s); }}
                      disabled={isLoading}
                      className="rounded-full border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── Floating compare bar ──────────────────────────────────── */}
      {compareIndices.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-[#0f172a] text-white shadow-2xl px-5 py-3 border border-slate-700 animate-fade-in-up">
          <div className="flex items-center gap-2">
            {compareIndices.map((idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {matchResults[idx]?.grant.title.slice(0, 24)}…
              </span>
            ))}
          </div>
          {compareIndices.length === 1 ? (
            <span className="text-xs text-slate-400">Select 1 more to compare</span>
          ) : (
            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold transition-colors"
            >
              Compare 2 grants
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          )}
          <button onClick={() => setCompareIndices([])} className="ml-1 text-slate-400 hover:text-white transition-colors" title="Clear">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Letter modal ──────────────────────────────────────────── */}
      {activeGrant && (
        <LetterModal
          grant={activeGrant}
          researchDescription={researchDescription}
          profile={profile}
          onClose={() => setActiveGrant(null)}
        />
      )}

      {/* ── AI Assistant floating button ──────────────────────────── */}
      <button
        onClick={() => setChatOpen(o => !o)}
        title="AI Grant Assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          chatOpen
            ? 'bg-slate-700 hover:bg-slate-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {chatOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* ── AI Assistant chat panel ───────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          style={{ maxHeight: '70vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-sm font-semibold leading-none">Grant Compass AI</p>
                <p className="text-xs text-indigo-200 mt-0.5">Ask me anything about grants</p>
              </div>
            </div>
            <button
              onClick={() => { setChatMessages([]); setChatInput(''); }}
              title="Clear chat"
              className="text-indigo-200 hover:text-white text-xs transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="text-3xl">💡</div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">How can I help?</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">Ask me about grants, funding agencies, writing tips, or your current search results.</p>
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  {[
                    'What makes a strong NIH grant?',
                    'How do I write a letter of intent?',
                    'Which agency funds my research?',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-left text-xs rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && msg.content === '' && isChatLoading && (
                      <span className="inline-flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-3">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleChatSend();
                  }
                }}
                placeholder="Ask about grants…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
                style={{ minHeight: '36px', maxHeight: '96px' }}
              />
              <button
                onClick={() => void handleChatSend()}
                disabled={!chatInput.trim() || isChatLoading}
                className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 py-4">
      <svg className="animate-spin h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message}
    </div>
  );
}
