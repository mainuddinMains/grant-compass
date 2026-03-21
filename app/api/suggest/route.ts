import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { researchDescription } = await req.json() as { researchDescription: string };

  if (!researchDescription?.trim()) {
    return NextResponse.json({ error: 'researchDescription is required' }, { status: 400 });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are a research grant advisor. Given a researcher's description, generate 2-3 alternative descriptions that would return better, more specific grant matches from NIH and NSF databases.
Each suggestion should:
- Be 1-2 sentences
- Emphasise a different angle, mechanism, or application of the same research
- Use precise scientific terminology that grant databases respond well to
Return ONLY a JSON array of strings. No explanation.`,
    messages: [{ role: 'user', content: researchDescription }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let suggestions: string[];
  try {
    suggestions = JSON.parse(json);
  } catch {
    return NextResponse.json({ error: 'Failed to parse suggestions', raw: text }, { status: 502 });
  }

  return NextResponse.json({ suggestions });
}
