import axios from 'axios';

export interface Grant {
  title: string;
  description: string;
  deadline: string | null;
  amount: number | null;
  agency: string;
  url: string;
}

interface NSFAward {
  id: string;
  title: string;
  abstractText: string;
  expDate: string;
  fundsObligatedAmt: string;
  agency: string;
}

interface NSFResponse {
  response: {
    award: NSFAward[];
  };
}

export async function fetchNSFGrants(keyword: string): Promise<Grant[]> {
  const response = await axios.get<NSFResponse>(
    'https://api.nsf.gov/services/v1/awards.json',
    {
      params: {
        keyword,
        dateStart: '01/01/2024',
        printFields: 'id,title,abstractText,expDate,fundsObligatedAmt,agency',
      },
    }
  );

  return (response.data.response?.award ?? []).map((a) => ({
    title: a.title ?? '',
    description: a.abstractText ?? '',
    deadline: a.expDate ?? null,
    amount: a.fundsObligatedAmt ? Number(a.fundsObligatedAmt) : null,
    agency: a.agency ?? 'NSF',
    url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}`,
  }));
}
