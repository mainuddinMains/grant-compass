// Mock dataset for the Country Funding Diagram.
// Field keys must match the RESEARCH_FIELDS object in SearchTab.tsx.

export type ResearchFieldKey =
  | 'Computer Science'
  | 'Biology & Life Sciences'
  | 'Medicine & Health'
  | 'Chemistry & Materials'
  | 'Physics & Engineering'
  | 'Social & Health Sciences';

export interface FundingSector {
  label: string;              // Short display label for the bar chart
  field: ResearchFieldKey;    // Matches RESEARCH_FIELDS keys for sidebar linkage
  percentage: number;         // 0–100 share of national grant budget
  amountBillions: number;     // USD-equivalent amount in billions
  color: string;              // Hex fill for bar
  query: string;              // Full-text search query for sector drill-down
}

export interface CountryFundingData {
  country: string;
  flag: string;
  totalBudgetBillions: number;
  topAgencies: string[];
  tagline: string;
  sectors: FundingSector[];   // Sorted descending by percentage
}

// One canonical color per research field — reused across all countries
const C: Record<ResearchFieldKey, string> = {
  'Computer Science':        '#6366f1', // indigo
  'Medicine & Health':       '#3b82f6', // blue
  'Biology & Life Sciences': '#10b981', // emerald
  'Physics & Engineering':   '#f59e0b', // amber
  'Chemistry & Materials':   '#8b5cf6', // violet
  'Social & Health Sciences':'#f43f5e', // rose
};

export const COUNTRY_FUNDING_DATA: Record<string, CountryFundingData> = {

  China: {
    country: 'China',
    flag: '🇨🇳',
    totalBudgetBillions: 68.4,
    topAgencies: ['NSFC', 'MoST', 'CAS'],
    tagline: 'Driven by national priorities in AI, quantum computing, and biotech',
    sectors: [
      { label: 'CS & AI',       field: 'Computer Science',        percentage: 28, amountBillions: 19.2, color: C['Computer Science'],        query: 'China computer science artificial intelligence machine learning research funding' },
      { label: 'Physics & Eng.',field: 'Physics & Engineering',   percentage: 24, amountBillions: 16.4, color: C['Physics & Engineering'],    query: 'China physics engineering quantum technology research funding' },
      { label: 'Medicine',      field: 'Medicine & Health',       percentage: 22, amountBillions: 15.0, color: C['Medicine & Health'],        query: 'China medicine health biomedical research funding' },
      { label: 'Biology',       field: 'Biology & Life Sciences', percentage: 16, amountBillions: 10.9, color: C['Biology & Life Sciences'],  query: 'China biology life sciences genomics research funding' },
      { label: 'Chemistry',     field: 'Chemistry & Materials',   percentage:  7, amountBillions:  4.8, color: C['Chemistry & Materials'],   query: 'China chemistry materials science nanotechnology research funding' },
      { label: 'Social Sci.',   field: 'Social & Health Sciences',percentage:  3, amountBillions:  2.1, color: C['Social & Health Sciences'],query: 'China social sciences public health research funding' },
    ],
  },

  Germany: {
    country: 'Germany',
    flag: '🇩🇪',
    totalBudgetBillions: 15.2,
    topAgencies: ['DFG', 'BMBF', 'Alexander von Humboldt Foundation'],
    tagline: 'Excellence-driven with strong public-private research partnerships',
    sectors: [
      { label: 'Medicine',      field: 'Medicine & Health',       percentage: 35, amountBillions:  5.3, color: C['Medicine & Health'],        query: 'Germany medicine health biomedical research funding DFG' },
      { label: 'Physics & Eng.',field: 'Physics & Engineering',   percentage: 28, amountBillions:  4.3, color: C['Physics & Engineering'],    query: 'Germany physics engineering renewable energy research funding DFG' },
      { label: 'CS & AI',       field: 'Computer Science',        percentage: 15, amountBillions:  2.3, color: C['Computer Science'],        query: 'Germany computer science AI machine learning research funding BMBF' },
      { label: 'Chemistry',     field: 'Chemistry & Materials',   percentage: 12, amountBillions:  1.8, color: C['Chemistry & Materials'],   query: 'Germany chemistry materials science research funding' },
      { label: 'Social Sci.',   field: 'Social & Health Sciences',percentage:  7, amountBillions:  1.1, color: C['Social & Health Sciences'],query: 'Germany social sciences behavioral research funding' },
      { label: 'Biology',       field: 'Biology & Life Sciences', percentage:  3, amountBillions:  0.5, color: C['Biology & Life Sciences'],  query: 'Germany biology life sciences ecology research funding' },
    ],
  },

  Japan: {
    country: 'Japan',
    flag: '🇯🇵',
    totalBudgetBillions: 19.1,
    topAgencies: ['JSPS', 'JST', 'MEXT'],
    tagline: 'Long-term fundamental research with emphasis on robotics and materials',
    sectors: [
      { label: 'Physics & Eng.',field: 'Physics & Engineering',   percentage: 32, amountBillions:  6.1, color: C['Physics & Engineering'],    query: 'Japan physics engineering robotics quantum research funding JSPS' },
      { label: 'Medicine',      field: 'Medicine & Health',       percentage: 26, amountBillions:  5.0, color: C['Medicine & Health'],        query: 'Japan medicine health aging neuroscience research funding JSPS' },
      { label: 'CS & AI',       field: 'Computer Science',        percentage: 18, amountBillions:  3.4, color: C['Computer Science'],        query: 'Japan computer science AI robotics research funding JST' },
      { label: 'Biology',       field: 'Biology & Life Sciences', percentage: 14, amountBillions:  2.7, color: C['Biology & Life Sciences'],  query: 'Japan biology life sciences genomics research funding MEXT' },
      { label: 'Chemistry',     field: 'Chemistry & Materials',   percentage:  8, amountBillions:  1.5, color: C['Chemistry & Materials'],   query: 'Japan chemistry materials science nanotechnology research funding' },
      { label: 'Social Sci.',   field: 'Social & Health Sciences',percentage:  2, amountBillions:  0.4, color: C['Social & Health Sciences'],query: 'Japan social sciences public health research funding' },
    ],
  },

  'South Korea': {
    country: 'South Korea',
    flag: '🇰🇷',
    totalBudgetBillions: 9.3,
    topAgencies: ['NRF', 'IITP', 'KIST'],
    tagline: 'Heavily invested in semiconductors, AI, and the green energy transition',
    sectors: [
      { label: 'CS & AI',       field: 'Computer Science',        percentage: 35, amountBillions:  3.3, color: C['Computer Science'],        query: 'South Korea computer science AI semiconductor research funding NRF' },
      { label: 'Physics & Eng.',field: 'Physics & Engineering',   percentage: 28, amountBillions:  2.6, color: C['Physics & Engineering'],    query: 'South Korea physics engineering clean energy research funding IITP' },
      { label: 'Medicine',      field: 'Medicine & Health',       percentage: 20, amountBillions:  1.9, color: C['Medicine & Health'],        query: 'South Korea medicine health biotech research funding NRF' },
      { label: 'Chemistry',     field: 'Chemistry & Materials',   percentage: 10, amountBillions:  0.9, color: C['Chemistry & Materials'],   query: 'South Korea chemistry materials battery research funding KIST' },
      { label: 'Biology',       field: 'Biology & Life Sciences', percentage:  5, amountBillions:  0.5, color: C['Biology & Life Sciences'],  query: 'South Korea biology life sciences research funding NRF' },
      { label: 'Social Sci.',   field: 'Social & Health Sciences',percentage:  2, amountBillions:  0.2, color: C['Social & Health Sciences'],query: 'South Korea social sciences research funding NRF' },
    ],
  },

  'United Kingdom': {
    country: 'United Kingdom',
    flag: '🇬🇧',
    totalBudgetBillions: 14.1,
    topAgencies: ['UKRI', 'Wellcome Trust', 'BBSRC'],
    tagline: 'World-class biomedical and life sciences research ecosystem',
    sectors: [
      { label: 'Medicine',      field: 'Medicine & Health',       percentage: 38, amountBillions:  5.4, color: C['Medicine & Health'],        query: 'United Kingdom medicine health biomedical research funding UKRI Wellcome' },
      { label: 'Biology',       field: 'Biology & Life Sciences', percentage: 22, amountBillions:  3.1, color: C['Biology & Life Sciences'],  query: 'United Kingdom biology life sciences genomics research funding BBSRC' },
      { label: 'Physics & Eng.',field: 'Physics & Engineering',   percentage: 18, amountBillions:  2.5, color: C['Physics & Engineering'],    query: 'United Kingdom physics engineering clean energy research funding EPSRC' },
      { label: 'CS & AI',       field: 'Computer Science',        percentage: 12, amountBillions:  1.7, color: C['Computer Science'],        query: 'United Kingdom computer science AI machine learning research funding UKRI' },
      { label: 'Social Sci.',   field: 'Social & Health Sciences',percentage:  7, amountBillions:  1.0, color: C['Social & Health Sciences'],query: 'United Kingdom social sciences public health research funding ESRC' },
      { label: 'Chemistry',     field: 'Chemistry & Materials',   percentage:  3, amountBillions:  0.4, color: C['Chemistry & Materials'],   query: 'United Kingdom chemistry materials research funding EPSRC' },
    ],
  },
};
