import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readUsers, writeUsers } from '@/lib/auth-db';
import type { ChecklistState } from '@/lib/auth-db';

async function getCtx() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === session.user.id);
  if (idx === -1) return null;
  return { users, idx };
}

// GET /api/checklist/progress?grantUrl=...
export async function GET(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) return new Response('Unauthorized', { status: 401 });

  const grantUrl = new URL(req.url).searchParams.get('grantUrl') ?? '';
  const progress = ctx.users[ctx.idx].checklistProgress ?? {};
  return Response.json({ state: progress[grantUrl] ?? null });
}

// PUT /api/checklist/progress — body: { grantUrl, state }
export async function PUT(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) return new Response('Unauthorized', { status: 401 });

  const { grantUrl, state } = await req.json() as { grantUrl: string; state: ChecklistState };
  const { users, idx } = ctx;

  users[idx].checklistProgress = {
    ...(users[idx].checklistProgress ?? {}),
    [grantUrl]: state,
  };
  await writeUsers(users);

  return Response.json({ ok: true });
}

// DELETE /api/checklist/progress — body: { grantUrl }
export async function DELETE(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) return new Response('Unauthorized', { status: 401 });

  const { grantUrl } = await req.json() as { grantUrl: string };
  const { users, idx } = ctx;

  const progress = { ...(users[idx].checklistProgress ?? {}) };
  delete progress[grantUrl];
  users[idx].checklistProgress = progress;
  await writeUsers(users);

  return Response.json({ ok: true });
}
