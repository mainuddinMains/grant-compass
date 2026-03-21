import { NextRequest, NextResponse } from 'next/server';
import { searchNIHGrants } from '@/lib/nih';
import { searchNSFGrants } from '@/lib/nsf';

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const [nihResult, nsfResult] = await Promise.allSettled([
    searchNIHGrants(query),
    searchNSFGrants(query),
  ]);

  return NextResponse.json({
    nih: nihResult.status === 'fulfilled' ? nihResult.value : [],
    nsf: nsfResult.status === 'fulfilled' ? nsfResult.value : [],
    errors: [
      nihResult.status === 'rejected' ? `NIH: ${nihResult.reason}` : null,
      nsfResult.status === 'rejected' ? `NSF: ${nsfResult.reason}` : null,
    ].filter(Boolean),
  });
}
