import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readSearches, writeSearches } from '@/lib/auth-db';

// GET /api/history — return current user's searches, newest first
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = await readSearches();
  const mine = all
    .filter((s) => s.userId === session.user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({ searches: mine });
}

// POST /api/history — save a new search entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { searchDescription, grantsFound, topMatchScore, fullResults } = body as {
    searchDescription: string;
    grantsFound: number;
    topMatchScore: number;
    fullResults: unknown[];
  };

  const all = await readSearches();
  const entry = {
    id: `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: session.user.id,
    searchDescription,
    timestamp: Date.now(),
    grantsFound,
    topMatchScore,
    fullResults: fullResults ?? [],
  };

  await writeSearches([entry, ...all]);
  return NextResponse.json({ ok: true, id: entry.id });
}

// DELETE /api/history?id=xxx  or  ?all=true
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const clearAll = url.searchParams.get('all') === 'true';

  const all = await readSearches();

  if (clearAll) {
    await writeSearches(all.filter((s) => s.userId !== session.user.id));
  } else if (id) {
    await writeSearches(
      all.filter((s) => !(s.id === id && s.userId === session.user.id))
    );
  } else {
    return NextResponse.json({ error: 'Provide ?id= or ?all=true' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
