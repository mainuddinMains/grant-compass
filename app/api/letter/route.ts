import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Grant } from '@/lib/nih';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert academic grant writer. Write a professional \
one-page letter of intent for a university researcher applying \
to a grant. Be specific, formal, and compelling. Structure it as:
1. Opening paragraph: researcher background and research focus
2. Middle paragraph: alignment between research and grant goals
3. Closing paragraph: expected outcomes and impact
Address it to the funding agency. Sign off as "Principal Investigator"`;

export async function POST(req: NextRequest) {
  const { researchDescription, grant } = await req.json() as {
    researchDescription: string;
    grant: Grant;
  };

  if (!researchDescription?.trim()) {
    return NextResponse.json({ error: 'researchDescription is required' }, { status: 400 });
  }
  if (!grant?.title) {
    return NextResponse.json({ error: 'grant is required' }, { status: 400 });
  }

  const userMessage = `Researcher description:
${researchDescription}

Grant details:
Title: ${grant.title}
Agency: ${grant.agency}
${grant.amount != null ? `Funding amount: $${grant.amount.toLocaleString()}` : ''}
${grant.deadline ? `Deadline: ${grant.deadline}` : ''}
${grant.description ? `Abstract: ${grant.description.slice(0, 500)}` : ''}

Write the letter of intent now.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const letter = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return NextResponse.json({ letter });
}
