import axios from 'axios';

export interface Grant {
  title: string;
  description: string;
  deadline: string | null;
  amount: number | null;
  agency: string;
  url: string;
}

interface GrantsGovHit {
  id: number;
  number: string;
  title: string;
  agency: string;       // actual field name in API response
  agencyCode: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
  docType: string;
  // synopsis is not returned in search results
}

interface GrantsGovResponse {
  data: {
    oppHits: GrantsGovHit[];
    hitCount: number;
  };
}

// NIH and HHS agency code prefixes used on Grants.gov
const NIH_AGENCY_PREFIXES = ['NIH', 'HHS', 'DHHS', 'NCI', 'NHLBI', 'NIAID', 'NIMH', 'NIEHS', 'NINDS', 'NIA'];

function parseGrantsGovDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  // Grants.gov returns MM/DD/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  return dateStr;
}

export async function fetchNIHGrants(keyword: string): Promise<Grant[]> {
  const response = await axios.post<GrantsGovResponse>(
    'https://api.grants.gov/v1/api/search2',
    { keyword, oppStatuses: 'posted' },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const hits: GrantsGovHit[] = response.data?.data?.oppHits ?? [];

  // Filter to NIH / HHS opportunities only
  return hits
    .filter((h) => {
      const code = (h.agencyCode ?? '').toUpperCase();
      const name = (h.agency ?? '').toUpperCase();
      return NIH_AGENCY_PREFIXES.some((p) => code.startsWith(p) || name.includes(p));
    })
    .map((h) => ({
      title: h.title ?? '',
      description: '',   // synopsis not available in search results
      deadline: parseGrantsGovDate(h.closeDate),
      amount: null,
      agency: h.agency ?? 'NIH',
      url: `https://www.grants.gov/search-results-detail/${h.id}`,
    }));
}
