import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createWorkspace } from '@/lib/grantsgov-s2s';

export interface ApplyRequestBody {
  grantTitle: string;
  grantUrl: string;
  agency?: string;
  opportunityId?: string;
}

/**
 * Pulls a numeric Grants.gov opportunity ID from any known URL shape:
 *   /search-results-detail/{id}          ← our grantsgov.ts format
 *   /web/grants/view-opportunity.html?oppId={id}
 *   /opportunity/{id}
 */
function parseOpportunityId(url: string, explicit?: string): string | null {
  if (explicit) return explicit;
  if (!url.includes('grants.gov')) return null;

  try {
    const u = new URL(url);
    // ?oppId=...
    const qs = u.searchParams.get('oppId') ?? u.searchParams.get('id');
    if (qs) return qs;
    // /search-results-detail/123456  or  /opportunity/123456
    const m = url.match(/\/(?:search-results-detail|opportunity)\/(\d+)/);
    if (m) return m[1];
  } catch {
    /* malformed URL — fall through */
  }
  return null;
}

export async function POST(req: NextRequest) {
  // Must be signed in — we use the session email as the contact
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'You must be signed in to start a grant application.' },
      { status: 401 }
    );
  }

  let body: ApplyRequestBody;
  try {
    body = (await req.json()) as ApplyRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { grantTitle, grantUrl, agency, opportunityId: passedId } = body;

  if (!grantTitle?.trim() || !grantUrl?.trim()) {
    return NextResponse.json(
      { error: 'grantTitle and grantUrl are required.' },
      { status: 400 }
    );
  }

  // Non-Grants.gov URLs cannot go through the S2S API
  if (!grantUrl.includes('grants.gov')) {
    return NextResponse.json(
      {
        error: 'S2S submission is only available for Grants.gov opportunities.',
        fallbackUrl: grantUrl,
        notGrantsGov: true,
      },
      { status: 422 }
    );
  }

  const opportunityId = parseOpportunityId(grantUrl, passedId);
  if (!opportunityId) {
    return NextResponse.json(
      {
        error: 'Could not determine a Grants.gov opportunity ID from the URL.',
        fallbackUrl: grantUrl,
      },
      { status: 422 }
    );
  }

  // Break name into first/last (best-effort)
  const nameParts = (session.user.name ?? session.user.email.split('@')[0]).trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

  try {
    const workspace = await createWorkspace({
      opportunityId,
      applicantEin: process.env.GRANTSGOV_APPLICANT_EIN ?? '',
      applicantOrg: process.env.GRANTSGOV_APPLICANT_ORG ?? '',
      contactFirstName: firstName,
      contactLastName: lastName,
      contactEmail: session.user.email,
      projectTitle: grantTitle,
    });

    return NextResponse.json({ workspace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[/api/apply]', message);

    // Surface the original grant URL so the frontend can offer a manual fallback
    return NextResponse.json(
      { error: message, fallbackUrl: grantUrl },
      { status: 502 }
    );
  }
}
