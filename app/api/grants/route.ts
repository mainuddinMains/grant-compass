import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchNIHGrants } from '@/lib/nih';
import { fetchNSFGrants } from '@/lib/nsf';
import { fetchGrantsGovGrants } from '@/lib/grantsgov';
import type { Grant } from '@/lib/nih';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Returns 3 keyword combinations: specific, broader, and mechanism-focused
async function extractKeywordSets(description: string): Promise<string[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    system: `You are a biomedical grant search expert. Given a research description, produce exactly 3 search queries for NIH/NSF grant databases.
Return ONLY a JSON array of 3 strings. No explanation.
Query 1: 3-5 highly specific scientific terms (e.g. "microplastics neurological development adolescents cognitive decline")
Query 2: 3-4 broader related terms covering the same domain
Query 3: 2-3 key mechanisms or methods used in the research`,
    messages: [{ role: 'user', content: description }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [description];
  const sets: string[] = JSON.parse(arrayMatch[0]);
  return sets.filter((s) => typeof s === 'string' && s.trim().length > 0);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'q query param is required' }, { status: 400 });
  }

  // Extract multiple keyword sets with Claude
  let keywordSets: string[] = [q];
  try {
    keywordSets = await extractKeywordSets(q);
  } catch (err) {
    console.error('[/api/grants] keyword extraction failed, using raw query:', err);
  }

  const primary = keywordSets[0];

  // Parallel NIH calls per keyword set + NSF + Grants.gov with primary keywords
  const nihCalls = keywordSets.map((kw) =>
    fetchNIHGrants(kw).catch((err) => {
      console.error(`[/api/grants] NIH call failed for "${kw}":`, err);
      return [] as Grant[];
    })
  );

  const nsfCall = fetchNSFGrants(primary).catch((err) => {
    console.error('[/api/grants] NSF call failed:', err);
    return [] as Grant[];
  });

  const grantsGovCall = fetchGrantsGovGrants(primary).catch((err) => {
    console.error('[/api/grants] Grants.gov call failed:', err);
    return [] as Grant[];
  });

  const [nsfGrants, grantsGovGrants, ...nihResults] = await Promise.all([
    nsfCall,
    grantsGovCall,
    ...nihCalls,
  ]);

  const nihGrants = nihResults.flat();

  // Deduplicate by normalised title, and drop grants whose deadline has passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seen = new Set<string>();
  const combined = [...nihGrants, ...grantsGovGrants, ...nsfGrants].filter((g) => {
    const key = g.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    if (g.deadline) {
      const deadline = new Date(g.deadline);
      if (!isNaN(deadline.getTime()) && deadline < today) return false;
    }
    return true;
  });

  return NextResponse.json({ grants: combined, keywords: keywordSets });
}
