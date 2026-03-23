import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface NewsItem {
  title: string;
  summary: string;
  date: string;
  url: string;
  agency: string;
  searchQuery: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const department: string = body.department || 'biomedical research';

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `You are a grant news curator. Generate realistic, plausible recent NIH and NSF grant announcements and funding news relevant to the given research department. These should represent typical grant program updates, new funding opportunities, and deadline announcements that would appear in early 2026.
Return ONLY a JSON array of exactly 4 items with fields: title (string), summary (string, 1-2 sentences), date (string, ISO format like "2026-03-15"), url (string, realistic grants.gov or nih.gov URL), agency (string, "NIH" or "NSF" or "DOE" etc.), searchQuery (string, 3-5 words to find related grants).`,
      messages: [{ role: 'user', content: `Generate grant news for: ${department} research` }],
    });

    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ items: [] });

    const items: NewsItem[] = JSON.parse(match[0]);
    return NextResponse.json({ items: items.slice(0, 5) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/news]', message);
    return NextResponse.json({ items: [] });
  }
}
