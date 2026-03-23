import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchNIHGrants } from '@/lib/nih';
import { fetchNSFGrants } from '@/lib/nsf';
import type { Grant } from '@/lib/nih';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FeedRequest {
  profile: { university?: string; department?: string; position?: string };
  searchHistory: { description: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedRequest = await req.json();
    const { profile, searchHistory } = body;

    const profileSummary = [
      profile.position && `Position: ${profile.position}`,
      profile.department && `Department: ${profile.department}`,
      profile.university && `University: ${profile.university}`,
    ].filter(Boolean).join(', ');

    const historyText = searchHistory
      .slice(0, 5)
      .map((h) => h.description)
      .join('; ');

    if (!profileSummary && !historyText) {
      return NextResponse.json({ results: [] });
    }

    // Step 1: Generate targeted search queries
    const queryRes = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a grant recommendation engine. Based on the researcher's profile and search history, identify the most relevant grant opportunities. Consider their department, position level, university, and past research interests. Return ONLY a JSON array of search queries (max 5 strings) that would find the most relevant grants for this researcher.`,
      messages: [{ role: 'user', content: `Profile: ${profileSummary || 'Not specified'}\nPast searches: ${historyText || 'None'}` }],
    });

    const queryText = queryRes.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const queryMatch = queryText.match(/\[[\s\S]*\]/);
    let queries: string[] = queryMatch ? JSON.parse(queryMatch[0]) : [];
    if (!queries.length) queries = [profile.department || 'biomedical research'];
    queries = queries.slice(0, 5).filter((q): q is string => typeof q === 'string');

    // Step 2: Fetch grants for all queries in parallel
    const grantsPerQuery = await Promise.all(
      queries.map((q) =>
        Promise.all([
          fetchNIHGrants(q).catch(() => [] as Grant[]),
          fetchNSFGrants(q).catch(() => [] as Grant[]),
        ]).then(([nih, nsf]) => [...nih, ...nsf])
      )
    );

    // Deduplicate and remove expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seen = new Set<string>();
    const combined: Grant[] = grantsPerQuery.flat().filter((g) => {
      const key = g.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      if (g.deadline) {
        const d = new Date(g.deadline);
        if (!isNaN(d.getTime()) && d < today) return false;
      }
      return true;
    });

    if (combined.length === 0) return NextResponse.json({ results: [] });

    // Step 3: Rank top 5 with Claude
    const capped = combined.slice(0, 50);
    const researchContext = [profileSummary, historyText ? `Research interests: ${historyText}` : ''].filter(Boolean).join('. ');
    const grantsText = capped
      .map((g, i) => `[${i}] title: ${g.title} | agency: ${g.agency} | description: ${(g.description ?? '').slice(0, 150)}`)
      .join('\n');

    const matchRes = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: `You are a grant matching expert. Score each grant 0-100 for relevance to the researcher profile, write one sentence reason. Return top results sorted by score. Return ONLY a JSON array: [{grantId, score, reason}]`,
      messages: [{ role: 'user', content: `Researcher: ${researchContext}\n\nGrants:\n${grantsText}` }],
    });

    const matchText = matchRes.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const matchArray = matchText.match(/\[[\s\S]*\]/);
    if (!matchArray) return NextResponse.json({ results: [] });

    const ranked: { grantId: number; score: number; reason: string }[] = JSON.parse(matchArray[0]);
    const top5 = ranked
      .filter((r) => r.score > 20)
      .slice(0, 5)
      .map((r) => ({ ...r, grant: capped[r.grantId] ?? null }))
      .filter((r) => r.grant !== null);

    return NextResponse.json({ results: top5 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/feed]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
