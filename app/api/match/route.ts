import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Grant } from '@/lib/nih';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a grant matching expert for university researchers.
Given a researcher's description and a list of grants, you will:
1. Score each grant 0-100 for relevance to the research
2. Write one sentence explaining why it matches
3. Return results sorted by score descending
Return ONLY a JSON array with fields: grantId, score, reason`;

interface MatchResult {
  grantId: number;
  score: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  const { researchDescription, grants } = await req.json() as {
    researchDescription: string;
    grants: Grant[];
  };

  if (!researchDescription?.trim()) {
    return NextResponse.json({ error: 'researchDescription is required' }, { status: 400 });
  }
  if (!Array.isArray(grants) || grants.length === 0) {
    return NextResponse.json({ error: 'grants array is required' }, { status: 400 });
  }

  const grantsText = grants
    .map((g, i) =>
      `[${i}] title: ${g.title} | agency: ${g.agency} | description: ${g.description.slice(0, 300)}`
    )
    .join('\n');

  const userMessage = `Researcher description:\n${researchDescription}\n\nGrants:\n${grantsText}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip markdown code fences if the model wraps the JSON
  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let ranked: MatchResult[];
  try {
    ranked = JSON.parse(json);
  } catch {
    return NextResponse.json({ error: 'Failed to parse Claude response', raw: text }, { status: 502 });
  }

  // Attach the full Grant object alongside each match result
  const results = ranked.map((m) => ({
    ...m,
    grant: grants[m.grantId] ?? null,
  }));

  return NextResponse.json({ results });
}
