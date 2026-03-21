import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { researcherProfile, grants } = await req.json();

  if (!researcherProfile?.trim() || !grants?.length) {
    return new Response(
      JSON.stringify({ error: 'researcherProfile and grants are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const grantsText = grants
    .map((g: Record<string, unknown>, i: number) => `Grant ${i + 1}:\n${JSON.stringify(g, null, 2)}`)
    .join('\n\n');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          thinking: { type: 'adaptive' },
          messages: [
            {
              role: 'user',
              content: `You are a grant matching expert. Given a researcher profile and a list of grants, identify the best matches and generate a tailored cover letter for the top match.

Researcher Profile:
${researcherProfile}

Available Grants:
${grantsText}

Respond with a JSON object (no markdown fences) using this exact structure:
{
  "matches": [
    {
      "rank": 1,
      "grantIndex": 0,
      "matchScore": 95,
      "title": "...",
      "reasoning": "...",
      "keyAlignments": ["...", "..."]
    }
  ],
  "coverLetter": "..."
}

Include the top 3 matches ranked by relevance. The coverLetter should be for rank 1.`,
            },
          ],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`{"error":"${message}"}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
