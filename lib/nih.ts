import axios from 'axios';

export interface Grant {
  title: string;
  description: string;
  deadline: string | null;
  amount: number | null;
  agency: string;
  url: string;
}

interface NIHReporterProject {
  project_num: string;
  project_title: string;
  abstract_text: string;
  award_amount: number | null;
  project_end_date: string | null;
  organization: { org_name: string } | null;
  agency_ic_admin: { abbreviation: string } | null;
}

interface NIHReporterResponse {
  results: NIHReporterProject[];
}

export async function fetchNIHGrants(keyword: string): Promise<Grant[]> {
  const response = await axios.post<NIHReporterResponse>(
    'https://api.reporter.nih.gov/v2/projects/search',
    {
      criteria: {
        advanced_text_search: {
          operator: 'and',
          search_field: 'terms',
          search_text: keyword,
        },
      },
      limit: 50,
      offset: 0,
      sort_field: 'award_amount',
      sort_order: 'desc',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const projects: NIHReporterProject[] = response.data?.results ?? [];

  return projects
    .filter((p) => p.project_title?.trim())
    .map((p) => {
      const agency = p.agency_ic_admin?.abbreviation ?? p.organization?.org_name ?? 'NIH';
      return {
        title: p.project_title.trim(),
        description: p.abstract_text ?? '',
        deadline: p.project_end_date ?? null,
        amount: p.award_amount && p.award_amount > 0 ? p.award_amount : null,
        agency: `NIH – ${agency}`,
        url: `https://reporter.nih.gov/search/${encodeURIComponent(p.project_num)}`,
      };
    });
}
