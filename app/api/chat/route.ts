import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Grant Compass AI, an expert assistant helping university researchers find and apply for research grants.

You help with:
- Understanding grant requirements and eligibility
- Writing tips for grant applications and letters of intent
- Explaining funding agencies (NIH, NSF, DOE, etc.) and their priorities
- Suggesting search strategies to find relevant grants
- Answering questions about the grants currently displayed

Be concise, friendly, and practical. Use bullet points when listing multiple items.
If the user shares their research description or grant results, reference them specifically in your answers.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];
    const context: { researchDescription?: string; grantTitles?: string[] } = body.context ?? {};

    if (!messages.length) {
      return new Response('No messages provided', { status: 400 });
    }

    // Inject context into system prompt if available
    let systemPrompt = SYSTEM_PROMPT;
    if (context.researchDescription) {
      systemPrompt += `\n\nCurrent researcher context:\nResearch description: "${context.researchDescription}"`;
    }
    if (context.grantTitles?.length) {
      systemPrompt += `\nCurrently displayed grants:\n${context.grantTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    }

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
