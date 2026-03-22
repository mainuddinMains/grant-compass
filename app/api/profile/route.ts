import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readUsers, writeUsers } from '@/lib/auth-db';

// GET /api/profile — return current user's name + profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await readUsers();
  const user = users.find((u) => u.id === session.user.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    fullName: user.name,
    university: user.profile?.university ?? '',
    department: user.profile?.department ?? '',
    position: user.profile?.position ?? '',
  });
}

// PUT /api/profile — save university, department, position
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    university?: string;
    department?: string;
    position?: string;
  };

  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === session.user.id);
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  users[idx] = {
    ...users[idx],
    profile: {
      university: body.university?.trim() ?? '',
      department: body.department?.trim() ?? '',
      position: body.position?.trim() ?? '',
    },
  };

  await writeUsers(users);
  return NextResponse.json({ ok: true });
}
