import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getWorkspaceStatus } from '@/lib/grantsgov-s2s';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = await params;

  try {
    const workspace = await getWorkspaceStatus(workspaceId);
    return NextResponse.json({ workspace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Status check failed';
    console.error('[/api/apply/status]', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
