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
  try {
    const body = await req.json();
    const researchDescription: string = body.researchDescription;
    const grants: Grant[] = body.grants;

    if (!researchDescription?.trim()) {
      return NextResponse.json({ error: 'researchDescription is required' }, { status: 400 });
    }
    if (!Array.isArray(grants) || grants.length === 0) {
      return NextResponse.json({ error: 'grants array is required' }, { status: 400 });
    }

    // Cap at 10 grants — each entry needs ~80 tokens of output, so 10 fits well within budget
    const capped = grants.slice(0, 10);
    console.log(`[/api/match] scoring ${capped.length} grants`);

    const grantsText = capped
      .map((g, i) =>
        `[${i}] title: ${g.title ?? ''} | agency: ${g.agency ?? ''} | description: ${(g.description ?? '').slice(0, 150)}`
      )
      .join('\n');

    const userMessage = `Researcher description:\n${researchDescription}\n\nGrants:\n${grantsText}`;

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[/api/match] Claude API error:', message);
      return NextResponse.json({ error: 'Claude API error', detail: message }, { status: 502 });
    }

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract the JSON array from anywhere in the response
    console.log('[/api/match] Claude raw response:', text.slice(0, 500));

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.error('[/api/match] No JSON array found in response:', text);
      return NextResponse.json({ error: 'Failed to parse Claude response', detail: `No JSON array in: ${text.slice(0, 200)}` }, { status: 502 });
    }

    let ranked: MatchResult[];
    try {
      ranked = JSON.parse(arrayMatch[0]);
    } catch (parseErr) {
      console.error('[/api/match] JSON parse failed:', parseErr, 'raw:', text);
      return NextResponse.json({ error: 'Failed to parse Claude response', detail: `Parse error on: ${arrayMatch[0].slice(0, 200)}` }, { status: 502 });
    }

    const results = ranked.map((m) => ({
      ...m,
      grant: capped[m.grantId] ?? null,
    }));

    return NextResponse.json({ results });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/match] Unhandled error:', message);
    return NextResponse.json({ error: 'Internal error', detail: message }, { status: 500 });
  }
}
