import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert in academic grant applications. \
Based on the grant title and description provided, generate a practical application checklist. \
Return ONLY a valid JSON array with no markdown, no code fences, no extra text. \
Each element must have exactly these fields:
- category (string: one of "Documents", "Writing", "Submission", "Research")
- task (string: specific action item, concise)
- description (string: one sentence explaining what is needed)
- estimatedHours (number: realistic hours to complete)
Return maximum 12 items total.`;

export async function POST(req: NextRequest) {
  const { title, description, agency } = await req.json() as {
    title: string;
    description?: string;
    agency?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const userMessage = `Grant title: ${title}
Agency: ${agency ?? 'Unknown'}
${description ? `Description: ${description.slice(0, 800)}` : ''}

Generate the application checklist now.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip markdown code fences if Claude wrapped the JSON
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let items;
  try {
    items = JSON.parse(cleaned);
    if (!Array.isArray(items)) throw new Error('not an array');
  } catch {
    return NextResponse.json({ error: 'Failed to parse checklist from AI response' }, { status: 500 });
  }

  // Assign stable IDs
  const withIds = items.map((item: Omit<typeof items[0], 'id'>, i: number) => ({
    id: `item-${i}`,
    ...item,
  }));

  return NextResponse.json({ items: withIds });
}
