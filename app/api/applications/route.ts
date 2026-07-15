import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  readApplications,
  writeApplications,
  type StoredApplication,
  type ApplicationStatus,
} from '@/lib/auth-db';

// ── Mock seed data ────────────────────────────────────────────────
// Shown the first time a user opens Application History so the UI
// isn't empty during demos. These are tagged with isMock: true so
// the UI can label them clearly.

const now = Date.now();
const DAY = 86_400_000;

function makeMockApplications(userId: string): StoredApplication[] {
  const seeds: Omit<StoredApplication, 'id' | 'userId'>[] = [
    {
      grantTitle: 'Neural Mechanisms of Memory Consolidation in Aging',
      agency: 'NIH – NIA',
      grantUrl: 'https://www.grants.gov/search-results-detail/346891',
      opportunityId: '346891',
      appliedAt: now - 45 * DAY,
      lastUpdated: now - 10 * DAY,
      status: 'Under Review',
      fundingAmount: 3_200_000,
      deadline: new Date(now + 20 * DAY).toISOString().slice(0, 10),
    },
    {
      grantTitle: 'Machine Learning Approaches to Early Cancer Detection',
      agency: 'NIH – NCI',
      grantUrl: 'https://www.grants.gov/search-results-detail/352104',
      opportunityId: '352104',
      appliedAt: now - 12 * DAY,
      lastUpdated: now - 12 * DAY,
      status: 'Submitted to Grants.gov',
      fundingAmount: 2_850_000,
      deadline: new Date(now + 60 * DAY).toISOString().slice(0, 10),
    },
    {
      grantTitle: 'Climate Resilience in Coastal Ecosystems',
      agency: 'DOE',
      grantUrl: 'https://www.grants.gov/search-results-detail/339217',
      opportunityId: '339217',
      appliedAt: now - 90 * DAY,
      lastUpdated: now - 30 * DAY,
      status: 'Awarded',
      fundingAmount: 5_100_000,
      deadline: new Date(now - 5 * DAY).toISOString().slice(0, 10),
    },
    {
      grantTitle: 'Quantum Computing for Drug Discovery Applications',
      agency: 'NSF',
      grantUrl: 'https://www.grants.gov/search-results-detail/341558',
      opportunityId: '341558',
      appliedAt: now - 120 * DAY,
      lastUpdated: now - 60 * DAY,
      status: 'Not Funded',
      fundingAmount: 1_500_000,
      deadline: new Date(now - 30 * DAY).toISOString().slice(0, 10),
    },
    {
      grantTitle: 'Federated Learning for Privacy-Preserving Medical AI',
      agency: 'NSF',
      grantUrl: 'https://www.grants.gov/search-results-detail/358902',
      opportunityId: '358902',
      appliedAt: now - 3 * DAY,
      lastUpdated: now - 3 * DAY,
      status: 'Draft',
      fundingAmount: 2_100_000,
      deadline: new Date(now + 90 * DAY).toISOString().slice(0, 10),
    },
  ];

  return seeds.map((s, i) => ({
    ...s,
    id: `mock_app_${userId}_${i}`,
    userId,
  }));
}

// ── GET /api/applications ─────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = await readApplications();
  let mine = all
    .filter((a) => a.userId === session.user.id)
    .sort((a, b) => b.appliedAt - a.appliedAt);

  // Seed mock data on first visit so the tab isn't empty
  if (mine.length === 0) {
    const mocks = makeMockApplications(session.user.id);
    await writeApplications([...mocks, ...all]);
    mine = mocks;
  }

  return NextResponse.json({ applications: mine });
}

// ── POST /api/applications ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Partial<StoredApplication>;

  if (!body.grantTitle || !body.grantUrl) {
    return NextResponse.json({ error: 'grantTitle and grantUrl are required.' }, { status: 400 });
  }

  const entry: StoredApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: session.user.id,
    grantTitle: body.grantTitle,
    agency: body.agency ?? 'Federal',
    grantUrl: body.grantUrl,
    opportunityId: body.opportunityId,
    workspaceId: body.workspaceId,
    workspaceLink: body.workspaceLink,
    appliedAt: Date.now(),
    lastUpdated: Date.now(),
    status: (body.status as ApplicationStatus) ?? 'Draft',
    notes: body.notes,
    fundingAmount: body.fundingAmount ?? null,
    deadline: body.deadline ?? null,
  };

  const all = await readApplications();
  await writeApplications([entry, ...all]);

  return NextResponse.json({ ok: true, application: entry }, { status: 201 });
}

// ── PATCH /api/applications?id=xxx ───────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Provide ?id=' }, { status: 400 });

  const updates = (await req.json()) as Partial<StoredApplication>;
  const all = await readApplications();
  const idx = all.findIndex((a) => a.id === id && a.userId === session.user.id);

  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  all[idx] = { ...all[idx], ...updates, lastUpdated: Date.now() };
  await writeApplications(all);

  return NextResponse.json({ ok: true, application: all[idx] });
}

// ── DELETE /api/applications?id=xxx ──────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Provide ?id=' }, { status: 400 });

  const all = await readApplications();
  await writeApplications(
    all.filter((a) => !(a.id === id && a.userId === session.user.id))
  );

  return NextResponse.json({ ok: true });
}
