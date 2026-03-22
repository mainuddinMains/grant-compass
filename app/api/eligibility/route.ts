import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
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
${description?.trim() ? `Description: ${description.slice(0, 600)}` : 'No description available.'}

Based on this grant, extract or infer the eligibility requirements. Cover:
- Who can apply (institution types: R1, R2, non-profit, etc.)
- Researcher career stage (student, postdoc, PI, etc.)
- US citizenship or institution residency requirements
- Any specific qualifications, experience, or prior funding requirements
- Restrictions (e.g., cannot hold concurrent awards)

Format as a concise bullet list using "• " bullets. If a detail is not stated, make a reasonable inference based on the agency and grant type and note it as an assumption.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system:
        'You are a grant eligibility expert helping researchers understand if they qualify for a grant. Be concise and accurate. When inferring eligibility from limited information, label assumptions clearly.',
      messages: [{ role: 'user', content: userMessage }],
    });

    const eligibility = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ eligibility });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
