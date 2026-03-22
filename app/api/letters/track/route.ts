import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readUsers, writeUsers } from '@/lib/auth-db';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === session.user.id);
  if (idx === -1) return new Response('Not found', { status: 404 });

  users[idx].lettersGenerated = (users[idx].lettersGenerated ?? 0) + 1;
  await writeUsers(users);

  return Response.json({ ok: true });
}
