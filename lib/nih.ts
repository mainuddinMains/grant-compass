import axios from 'axios';

export interface Grant {
  title: string;
  description: string;
  deadline: string | null;
  amount: number | null;
  agency: string;
  url: string;
}

interface NIHProject {
  project_title: string;
  abstract_text: string;
  project_end_date: string;
  award_amount: number;
  agency_ic_admin: { abbreviation: string };
  appl_id: number;
}

interface NIHSearchResult {
  meta: { total: number };
  results: NIHProject[];
}

export async function fetchNIHGrants(keyword: string): Promise<Grant[]> {
  const response = await axios.post<NIHSearchResult>(
    'https://api.reporter.nih.gov/v2/projects/search',
    {
      criteria: { terms: keyword },
      limit: 10,
    }
  );

  return (response.data.results ?? []).map((p) => ({
    title: p.project_title ?? '',
    description: p.abstract_text ?? '',
    deadline: p.project_end_date ? p.project_end_date.slice(0, 10) : null,
    amount: p.award_amount ?? null,
    agency: `NIH – ${p.agency_ic_admin?.abbreviation ?? ''}`.trimEnd(),
    url: `https://reporter.nih.gov/project-details/${p.appl_id}`,
  }));
}
