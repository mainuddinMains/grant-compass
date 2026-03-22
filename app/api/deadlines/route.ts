import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readUsers, writeUsers } from '@/lib/auth-db';
import type { SavedDeadline } from '@/lib/auth-db';

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === session.user.id);
  if (idx === -1) return null;
  return { users, idx, userId: session.user.id };
}

// GET — return all saved deadlines for the current user
export async function GET() {
  const ctx = await getUser();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  const deadlines = ctx.users[ctx.idx].savedDeadlines ?? [];
  return Response.json({ deadlines });
}

// POST — save a deadline
export async function POST(req: Request) {
  const ctx = await getUser();
  if (!ctx) return new Response('Unauthorized', { status: 401 });

  const body = await req.json() as Omit<SavedDeadline, 'savedAt'>;
  const { users, idx } = ctx;

  const deadlines: SavedDeadline[] = users[idx].savedDeadlines ?? [];

  // Prevent duplicates
  if (!deadlines.find((d) => d.grantUrl === body.grantUrl)) {
    deadlines.push({ ...body, savedAt: Date.now() });
    users[idx].savedDeadlines = deadlines;
    await writeUsers(users);
  }

  return Response.json({ ok: true });
}

// DELETE — remove a deadline by grantUrl
export async function DELETE(req: Request) {
  const ctx = await getUser();
  if (!ctx) return new Response('Unauthorized', { status: 401 });

  const { grantUrl } = await req.json() as { grantUrl: string };
  const { users, idx } = ctx;

  users[idx].savedDeadlines = (users[idx].savedDeadlines ?? []).filter(
    (d) => d.grantUrl !== grantUrl,
  );
  await writeUsers(users);

  return Response.json({ ok: true });
}
