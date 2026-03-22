import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SuccessPrediction } from '@/lib/types';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert in NIH and NSF grant funding patterns. Given this grant opportunity and researcher description, return ONLY a JSON object with no markdown, no code fences, no extra text:
- successScore: number 0-100 (likelihood of funding success)
- competitionLevel: string (Low / Medium / High / Very High)
- effortScore: number 0-100 (effort required to apply, 100 = maximum effort)
- effortVsReward: string (Excellent / Good / Fair / Poor)
- winningFactors: array of exactly 2 strings (what to emphasize to win this grant)
- redFlags: array of exactly 2 strings (potential weaknesses in this application)
Be realistic and specific.`;

export async function POST(req: NextRequest) {
  const { grant, researchDescription } = await req.json() as {
    grant: { title: string; agency: string; description?: string };
    researchDescription: string;
  };

  if (!grant?.title || !researchDescription?.trim()) {
    return NextResponse.json({ error: 'grant and researchDescription are required' }, { status: 400 });
  }

  const userContent = `Grant: ${grant.title}\nAgency: ${grant.agency}\nDescription: ${grant.description ?? 'Not provided'}\n\nResearcher background: ${researchDescription.trim()}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
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

  let prediction: SuccessPrediction;
  try {
    prediction = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'Failed to parse prediction from AI response' }, { status: 500 });
  }

  return NextResponse.json({ prediction });
}
