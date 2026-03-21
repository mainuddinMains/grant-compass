import axios from 'axios';
import type { Grant } from '@/lib/nih';

interface GrantsGovHit {
  id: number;
  number: string;
  title: string;
  agencyName: string;
  openDate: string;
  closeDate: string;
  synopsis: string;
  awardCeiling: number | null;
}

interface GrantsGovResponse {
  data: {
    oppHits: GrantsGovHit[];
    hitCount: number;
  };
}

function parseGrantsGovDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  return dateStr;
}

export async function fetchGrantsGovGrants(keyword: string): Promise<Grant[]> {
  const response = await axios.post<GrantsGovResponse>(
    'https://api.grants.gov/v1/api/search2',
    { keyword, oppStatuses: 'posted' },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const hits: GrantsGovHit[] = response.data?.data?.oppHits ?? [];

  return hits.map((h) => ({
    title: h.title ?? '',
    description: h.synopsis ?? '',
    deadline: parseGrantsGovDate(h.closeDate),
    amount: h.awardCeiling ?? null,
    agency: h.agencyName ?? 'Grants.gov',
    url: `https://www.grants.gov/search-results-detail/${h.id}`,
  }));
}
