import axios from 'axios';

export interface NSFAward {
  id: string;
  title: string;
  abstractText: string;
  agency: string;
  fundsObligatedAmt: string;
  date: string;
  expDate: string;
  awardeeName: string;
  piFirstName: string;
  piLastName: string;
  primaryProgram: string;
}

interface NSFResponse {
  response: {
    award: NSFAward[];
  };
}

export async function searchNSFGrants(query: string, limit = 10): Promise<NSFAward[]> {
  const response = await axios.get<NSFResponse>(
    'https://api.nsf.gov/services/v1/awards.json',
    {
      params: {
        keyword: query,
        rpp: limit,
        offset: 0,
        printFields:
          'id,title,abstractText,agency,fundsObligatedAmt,date,expDate,awardeeName,piFirstName,piLastName,primaryProgram',
      },
    }
  );
  return response.data.response?.award || [];
}
