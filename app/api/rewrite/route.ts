import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS: Record<string, (text: string, param?: string) => string> = {
  formal: (text) =>
    `Rewrite the following letter of intent in a more formal, academic tone. Preserve all content and structure; only elevate the language. Return only the rewritten letter with no preamble:\n\n${text}`,
  shorter: (text) =>
    `Condense the following letter of intent to approximately 80% of its current length. Keep the most important points. Return only the condensed letter:\n\n${text}`,
  stronger: (text) =>
    `Rewrite the following letter to be more persuasive and impactful. Strengthen the argument, improve word choice, and make a more compelling case. Return only the rewritten letter:\n\n${text}`,
  grammar: (text) =>
    `Correct all grammar, spelling, and punctuation errors in the following letter. Do not change tone, structure, or meaning — only fix errors. Return only the corrected letter:\n\n${text}`,
  tone: (text, tone) =>
    `Rewrite the following letter in a ${tone} tone. Keep all key information but adjust the style accordingly. Return only the rewritten letter:\n\n${text}`,
};

export async function POST(req: NextRequest) {
  try {
    const { text, action, tone } = (await req.json()) as {
      text: string;
      action: string;
      tone?: string;
    };

    if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });
    const promptFn = PROMPTS[action];
    if (!promptFn)
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: promptFn(text, tone) }],
    });

    const rewritten = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ rewritten });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
