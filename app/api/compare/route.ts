import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { grant1, grant2, researchDescription } = (await req.json()) as {
      grant1: { title: string; agency: string; score: number; reason: string; amount: number | null; deadline: string | null; description: string };
      grant2: { title: string; agency: string; score: number; reason: string; amount: number | null; deadline: string | null; description: string };
      researchDescription: string;
    };

    if (!grant1 || !grant2) {
      return NextResponse.json({ error: 'grant1 and grant2 are required' }, { status: 400 });
    }

    const prompt = `You are a research grant advisor. A researcher is comparing two grants to decide which one to apply to first.

Researcher's description: "${researchDescription || 'Not provided'}"

Grant A: ${grant1.title}
Agency: ${grant1.agency}
Match Score: ${grant1.score}/100
Amount: ${grant1.amount != null ? `$${grant1.amount.toLocaleString()}` : 'Not specified'}
Deadline: ${grant1.deadline ?? 'Not specified'}
Match Reason: ${grant1.reason}
Description: ${grant1.description}

Grant B: ${grant2.title}
Agency: ${grant2.agency}
Match Score: ${grant2.score}/100
Amount: ${grant2.amount != null ? `$${grant2.amount.toLocaleString()}` : 'Not specified'}
Deadline: ${grant2.deadline ?? 'Not specified'}
Match Reason: ${grant2.reason}
Description: ${grant2.description}

Write a 2–3 sentence recommendation for which grant the researcher should prioritize and why. Be specific about the trade-offs (score, funding amount, deadline urgency, fit with their research). Start directly with your recommendation — do not use preamble like "Based on the comparison..."`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const recommendation = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ recommendation });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
