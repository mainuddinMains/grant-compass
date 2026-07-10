'use client';

import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useTheme } from 'next-themes';

// ── Types ─────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
  agency: string;
  amount: number;
  daysRemaining: number;
}

interface StateInfo {
  funding: number; // millions
  projects: Project[];
}

interface TooltipState {
  x: number;
  y: number;
  stateCode: string;
  info: StateInfo | null;
}

// ── Geography source ──────────────────────────────────────────────
// us-atlas states-10m gives geoAlbersUsa with AK+HI insets built in
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS → state abbreviation
const FIPS: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '12': 'FL', '13': 'GA',
  '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
  '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO',
  '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ',
  '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC',
  '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT',
  '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming',
};

// ── Sample Data ───────────────────────────────────────────────────

const DATA: Record<string, StateInfo> = {
  CA: {
    funding: 42.6,
    projects: [
      { id: 'ca1', title: 'Neural Mechanisms of Memory Consolidation in Aging', agency: 'NIH – NIA', amount: 3_200_000, daysRemaining: 47 },
      { id: 'ca2', title: 'Machine Learning Approaches to Early Cancer Detection', agency: 'NIH – NCI', amount: 2_850_000, daysRemaining: 89 },
      { id: 'ca3', title: 'Quantum Computing for Drug Discovery Applications', agency: 'NSF', amount: 1_500_000, daysRemaining: 124 },
      { id: 'ca4', title: 'Climate Resilience in Coastal Ecosystems', agency: 'DOE', amount: 5_100_000, daysRemaining: 22 },
    ],
  },
  TX: {
    funding: 28.3,
    projects: [
      { id: 'tx1', title: 'Cardiovascular Disease Prevention in Hispanic Populations', agency: 'NIH – NHLBI', amount: 4_400_000, daysRemaining: 61 },
      { id: 'tx2', title: 'Advanced Materials for Renewable Energy Storage', agency: 'DOE', amount: 3_750_000, daysRemaining: 33 },
      { id: 'tx3', title: 'AI-Driven Precision Agriculture Systems', agency: 'NSF', amount: 980_000, daysRemaining: 155 },
    ],
  },
  NY: {
    funding: 35.8,
    projects: [
      { id: 'ny1', title: 'Epigenetic Regulation in Pediatric Leukemia', agency: 'NIH – NCI', amount: 5_600_000, daysRemaining: 14 },
      { id: 'ny2', title: 'Urban Microbiome and Mental Health Correlations', agency: 'NIH – NIMH', amount: 2_100_000, daysRemaining: 78 },
      { id: 'ny3', title: 'Cryptographic Protocols for Healthcare Data Privacy', agency: 'NSF', amount: 1_200_000, daysRemaining: 203 },
    ],
  },
  MA: {
    funding: 31.2,
    projects: [
      { id: 'ma1', title: 'mRNA Vaccine Development for Pancreatic Cancer', agency: 'NIH – NCI', amount: 6_800_000, daysRemaining: 52 },
      { id: 'ma2', title: 'Protein Misfolding in Neurodegenerative Disease', agency: 'NIH – NINDS', amount: 3_300_000, daysRemaining: 91 },
      { id: 'ma3', title: 'Large Language Models for Clinical Decision Support', agency: 'NSF', amount: 1_750_000, daysRemaining: 118 },
    ],
  },
  IL: {
    funding: 19.4,
    projects: [
      { id: 'il1', title: 'Social Determinants of Health in Urban Communities', agency: 'NIH – NIMHD', amount: 2_950_000, daysRemaining: 37 },
      { id: 'il2', title: 'Photonic Sensors for Environmental Monitoring', agency: 'NSF', amount: 1_400_000, daysRemaining: 172 },
    ],
  },
  WA: {
    funding: 22.7,
    projects: [
      { id: 'wa1', title: 'CRISPR-Based Gene Therapy for Rare Blood Disorders', agency: 'NIH – NHLBI', amount: 4_200_000, daysRemaining: 66 },
      { id: 'wa2', title: 'Federated Learning for Privacy-Preserving Medical AI', agency: 'NSF', amount: 2_100_000, daysRemaining: 99 },
      { id: 'wa3', title: 'Pacific Salmon Ecosystem Recovery', agency: 'NSF', amount: 870_000, daysRemaining: 44 },
    ],
  },
  NC: {
    funding: 17.1,
    projects: [
      { id: 'nc1', title: 'Tobacco Cessation Interventions in Rural Populations', agency: 'NIH – NCI', amount: 3_100_000, daysRemaining: 28 },
      { id: 'nc2', title: 'Biomaterials for Wound Healing Applications', agency: 'NIH – NIBIB', amount: 1_850_000, daysRemaining: 140 },
    ],
  },
  PA: {
    funding: 24.5,
    projects: [
      { id: 'pa1', title: 'Immunotherapy Combinations in Solid Tumors', agency: 'NIH – NCI', amount: 5_100_000, daysRemaining: 19 },
      { id: 'pa2', title: 'Structural Genomics of Viral Proteomes', agency: 'NIH – NIAID', amount: 2_600_000, daysRemaining: 83 },
      { id: 'pa3', title: 'Robotics for Minimally Invasive Surgery', agency: 'NSF', amount: 1_300_000, daysRemaining: 207 },
    ],
  },
  MI: {
    funding: 15.9,
    projects: [
      { id: 'mi1', title: 'Autoimmune Disease Biomarker Discovery', agency: 'NIH – NIAMS', amount: 2_400_000, daysRemaining: 55 },
      { id: 'mi2', title: 'Next-Generation Battery Technologies', agency: 'DOE', amount: 4_200_000, daysRemaining: 71 },
    ],
  },
  CO: {
    funding: 13.6,
    projects: [
      { id: 'co1', title: 'High-Altitude Physiology and Altitude Sickness Prevention', agency: 'NIH – NHLBI', amount: 1_900_000, daysRemaining: 43 },
      { id: 'co2', title: 'Deep Learning for Astronomical Survey Data', agency: 'NSF', amount: 2_300_000, daysRemaining: 168 },
    ],
  },
  OH: {
    funding: 16.8,
    projects: [
      { id: 'oh1', title: 'Opioid Use Disorder: Novel Pharmacological Interventions', agency: 'NIH – NIDA', amount: 3_700_000, daysRemaining: 31 },
      { id: 'oh2', title: 'Smart Manufacturing and Industrial IoT Security', agency: 'NSF', amount: 1_600_000, daysRemaining: 112 },
    ],
  },
  GA: {
    funding: 11.3,
    projects: [
      { id: 'ga1', title: 'Disparities in Maternal Health Outcomes', agency: 'NIH – NICHD', amount: 2_800_000, daysRemaining: 58 },
      { id: 'ga2', title: 'Cybersecurity in Critical Infrastructure Networks', agency: 'NSF', amount: 1_100_000, daysRemaining: 195 },
    ],
  },
  MN: {
    funding: 14.2,
    projects: [
      { id: 'mn1', title: 'Precision Oncology for Pediatric Brain Tumors', agency: 'NIH – NCI', amount: 4_500_000, daysRemaining: 26 },
      { id: 'mn2', title: 'Soil Carbon Sequestration in Agricultural Systems', agency: 'NSF', amount: 890_000, daysRemaining: 142 },
    ],
  },
  FL: {
    funding: 18.9,
    projects: [
      { id: 'fl1', title: "Alzheimer's Disease Risk Reduction in Diverse Cohorts", agency: 'NIH – NIA', amount: 5_300_000, daysRemaining: 73 },
      { id: 'fl2', title: 'Coral Reef Restoration and Climate Adaptation', agency: 'NSF', amount: 1_450_000, daysRemaining: 86 },
      { id: 'fl3', title: 'Space Weather Impact on Satellite Communications', agency: 'NSF', amount: 750_000, daysRemaining: 131 },
    ],
  },
  MD: {
    funding: 29.1,
    projects: [
      { id: 'md1', title: 'HIV Latency Reversal and Cure Strategies', agency: 'NIH – NIAID', amount: 6_200_000, daysRemaining: 41 },
      { id: 'md2', title: 'Genome-Wide Association Studies in Cardiovascular Disease', agency: 'NIH – NHLBI', amount: 4_800_000, daysRemaining: 102 },
    ],
  },
};

// ── Color scale (choropleth) ──────────────────────────────────────
// Max tracked funding for normalization
const MAX_FUNDING = 45;

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function getStateFill(funding: number | null, isSelected: boolean, isDark: boolean): string {
  if (isSelected) return isDark ? '#818cf8' : '#4f46e5';
  if (funding === null) return isDark ? '#1e293b' : '#e2e8f0'; // no data: slate-800 / slate-200

  const t = Math.min(funding / MAX_FUNDING, 1);

  if (isDark) {
    // indigo-900 [49,46,129] → indigo-400 [129,140,248]
    return `rgb(${lerp(49, 129, t)},${lerp(46, 140, t)},${lerp(129, 248, t)})`;
  }
  // indigo-100 [224,231,255] → indigo-600 [79,70,229]
  return `rgb(${lerp(224, 79, t)},${lerp(231, 70, t)},${lerp(255, 229, t)})`;
}

function getHoverFill(funding: number | null, isDark: boolean): string {
  if (funding === null) return isDark ? '#27374a' : '#cbd5e1'; // slightly brightened slate
  const t = Math.min(funding / MAX_FUNDING, 1);

  if (isDark) {
    // shift ~20 brighter
    return `rgb(${lerp(70, 149, t)},${lerp(60, 160, t)},${lerp(150, 252, t)})`;
  }
  // shift ~20 more saturated toward indigo-500
  return `rgb(${lerp(199, 67, t)},${lerp(210, 56, t)},${lerp(254, 202, t)})`;
}

// ── Helpers ───────────────────────────────────────────────────────

const STAGGER = ['', 'animation-delay-75', 'animation-delay-150', 'animation-delay-225'];

function fmtFunding(m: number): string {
  return `$${m.toFixed(1)}M`;
}

function fmtAmount(n: number): string {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1_000)}K`;
}

// ── Sub-components ────────────────────────────────────────────────

function AgencyBadge({ agency }: { agency: string }) {
  const u = agency.toUpperCase();
  const label = agency.includes('–') ? agency.split('–')[1].trim() : agency.slice(0, 6);

  if (u.startsWith('NIH')) {
    return <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">{label}</span>;
  }
  if (u.startsWith('NSF')) {
    return <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-300 flex-shrink-0">NSF</span>;
  }
  if (u.startsWith('DOE')) {
    return <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300 flex-shrink-0">DOE</span>;
  }
  return <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">{label}</span>;
}

function ProjectCard({ project }: { project: Project }) {
  const urgencyClass =
    project.daysRemaining < 30
      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      : project.daysRemaining <= 90
      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
      : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 h-full">
      <div className="flex items-start gap-2">
        <AgencyBadge agency={project.agency} />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 flex-1">
          {project.title}
        </h4>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
          {fmtAmount(project.amount)}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgencyClass}`}>
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {project.daysRemaining}d left
        </span>
      </div>
    </article>
  );
}

// ── Main export ───────────────────────────────────────────────────

export default function ActiveFundingByState() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const selectedInfo = selected ? DATA[selected] : null;
  const stateCount = Object.keys(DATA).length;
  const totalTracked = Object.values(DATA).reduce((s, d) => s + d.funding, 0);

  const borderColor = isDark ? '#0f172a' : '#ffffff';

  return (
    <section className="flex flex-col gap-5 w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
            Geographic Intelligence
          </p>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Active Funding by State
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Hover to preview · click a state to explore
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500">{stateCount} states tracked</p>
          <p className="text-base font-black text-slate-700 dark:text-slate-200 tabular-nums">
            ${totalTracked.toFixed(1)}M
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">total active</p>
        </div>
      </div>

      {/* Map area */}
      {!mounted ? (
        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden">
          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = String(geo.id ?? '').padStart(2, '0');
                  const stateCode = FIPS[fips];
                  const info = stateCode ? DATA[stateCode] : undefined;
                  const isSelected = stateCode === selected;
                  const hasData = !!info;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (hasData && stateCode) {
                          setSelected((p) => (p === stateCode ? null : stateCode));
                          setTooltip(null);
                        }
                      }}
                      onMouseEnter={(e: React.MouseEvent) => {
                        if (stateCode) {
                          setTooltip({ x: e.clientX, y: e.clientY, stateCode, info: info ?? null });
                        }
                      }}
                      onMouseMove={(e: React.MouseEvent) => {
                        setTooltip((prev) =>
                          prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                        );
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: getStateFill(info?.funding ?? null, isSelected, isDark),
                          stroke: borderColor,
                          strokeWidth: 0.75,
                          outline: 'none',
                        },
                        hover: {
                          fill: isSelected
                            ? getStateFill(info?.funding ?? null, true, isDark)
                            : getHoverFill(info?.funding ?? null, isDark),
                          stroke: borderColor,
                          strokeWidth: 0.75,
                          outline: 'none',
                          cursor: hasData ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: isDark ? '#818cf8' : '#4f46e5',
                          stroke: borderColor,
                          strokeWidth: 0.75,
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Legend */}
          <div className="px-5 pb-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-3 rounded-sm border border-slate-200 dark:border-slate-700"
                  style={{ background: isDark ? '#1e293b' : '#e2e8f0' }}
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">No data</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div
                  className="w-28 h-2 rounded-full"
                  style={{
                    background: isDark
                      ? 'linear-gradient(to right, #312e81, #4338ca, #818cf8)'
                      : 'linear-gradient(to right, #e0e7ff, #a5b4fc, #4f46e5)',
                  }}
                />
                <div className="flex justify-between w-28">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">$0</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">$43M+</span>
                </div>
              </div>
            </div>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tooltip — position: fixed, follows cursor */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 text-xs shadow-xl whitespace-nowrap"
          style={{ left: tooltip.x + 14, top: tooltip.y - 52 }}
        >
          <span className="font-semibold">{STATE_NAMES[tooltip.stateCode] ?? tooltip.stateCode}</span>
          {tooltip.info ? (
            <span className="ml-2 text-emerald-400 font-bold tabular-nums">
              {fmtFunding(tooltip.info.funding)} active
            </span>
          ) : (
            <span className="ml-1.5 text-slate-400">No data</span>
          )}
        </div>
      )}

      {/* Selected state project panel */}
      {selected && selectedInfo ? (
        <div className="animate-fade-in-up flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {STATE_NAMES[selected] ?? selected}
              </h3>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {selected}
              </span>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {fmtFunding(selectedInfo.funding)} active
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {selectedInfo.projects.length} project{selectedInfo.projects.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {selectedInfo.projects.map((project, i) => (
              <div key={project.id} className={`animate-fade-in-up ${STAGGER[Math.min(i, STAGGER.length - 1)]}`}>
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-1">
          Click a highlighted state to explore active grant projects
        </p>
      )}

      <p className="text-[10px] text-center text-slate-300 dark:text-slate-600">
        Sample data for demonstration · Estimated NIH, NSF &amp; DOE active awards
      </p>
    </section>
  );
}
