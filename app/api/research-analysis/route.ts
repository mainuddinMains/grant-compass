import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert academic grant advisor. Analyze this researcher's background and return ONLY a valid JSON object with no markdown, no code fences, no extra text. The object must have exactly these fields:
- fundabilityScore: number 0-100
- topStrengths: array of exactly 3 strings (their strongest fundable research areas)
- recommendedGrantTypes: array of exactly 3 strings (grant categories they should target)
- profileGaps: array of exactly 2 strings (areas to strengthen)
- searchSuggestions: array of exactly 3 strings (specific research descriptions optimized for grant searching, each 1-2 sentences, ready to paste into a grant search bar)
Be specific and actionable.`;

export async function POST(req: NextRequest) {
  const { abstract } = await req.json() as { abstract: string };

  if (!abstract?.trim()) {
    return NextResponse.json({ error: 'abstract is required' }, { status: 400 });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: abstract.trim() }],
  });

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let analysis;
  try {
    analysis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'Failed to parse analysis from AI response' }, { status: 500 });
  }

  return NextResponse.json({ analysis });
}
