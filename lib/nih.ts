import axios from 'axios';

export interface NIHGrant {
  appl_id: number;
  project_title: string;
  abstract_text: string;
  agency_ic_admin: { abbreviation: string };
  fiscal_year: number;
  award_amount: number;
  project_start_date: string;
  project_end_date: string;
  org_name: string;
  contact_pi_name: string;
  opportunity_number?: string;
}

interface NIHSearchResult {
  meta: { total: number };
  results: NIHGrant[];
}

export async function searchNIHGrants(query: string, limit = 10): Promise<NIHGrant[]> {
  const response = await axios.post<NIHSearchResult>(
    'https://api.reporter.nih.gov/v2/projects/search',
    {
      criteria: {
        advanced_text_search: {
          operator: 'and',
          search_field: 'all',
          search_text: query,
        },
      },
      limit,
      offset: 0,
    }
  );
  return response.data.results || [];
}
