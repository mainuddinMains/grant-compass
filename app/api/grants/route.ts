import { NextRequest, NextResponse } from 'next/server';
import { fetchNIHGrants } from '@/lib/nih';
import { fetchNSFGrants } from '@/lib/nsf';
import type { Grant } from '@/lib/nih';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'q query param is required' }, { status: 400 });
  }

  const [nihResult, nsfResult] = await Promise.all([
    fetchNIHGrants(q).catch((err) => ({ error: String(err), grants: [] as Grant[] })),
    fetchNSFGrants(q).catch((err) => ({ error: String(err), grants: [] as Grant[] })),
  ]);

  const nihGrants = Array.isArray(nihResult) ? nihResult : nihResult.grants;
  const nsfGrants = Array.isArray(nsfResult) ? nsfResult : nsfResult.grants;

  // Deduplicate by normalised title
  const seen = new Set<string>();
  const combined = [...nihGrants, ...nsfGrants].filter((g) => {
    const key = g.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ grants: combined });
}
