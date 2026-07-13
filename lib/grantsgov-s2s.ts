/**
 * Grants.gov System-to-System (S2S) REST API client.
 *
 * Authentication: HTTP Basic using a registered S2S system account
 * (GRANTSGOV_S2S_USERNAME + GRANTSGOV_S2S_PASSWORD).
 *
 * Docs: https://www.grants.gov/system-to-system/
 * Sandbox: https://apply07.grants.gov/grantsws/rest (use GRANTSGOV_S2S_BASE_URL to override)
 */

const S2S_BASE =
  process.env.GRANTSGOV_S2S_BASE_URL ?? 'https://apply07.grants.gov/grantsws/rest';

function basicAuth(): string {
  const user = process.env.GRANTSGOV_S2S_USERNAME;
  const pass = process.env.GRANTSGOV_S2S_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      'GRANTSGOV_S2S_USERNAME and GRANTSGOV_S2S_PASSWORD must be set to use the S2S API.'
    );
  }
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

export interface WorkspacePayload {
  opportunityId: string;
  cfda?: string;           // e.g. "84.999"
  competition?: string;   // competition number within the opportunity
  applicantEin: string;   // EIN of the submitting institution (XX-XXXXXXX)
  applicantOrg: string;   // Legal name of the institution
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  projectTitle: string;
}

export interface WorkspaceResult {
  workspaceId: string;
  applicationId: string;
  opportunityId: string;
  applicationStatus: string;
  workspaceLink: string;
}

/**
 * Creates a new application workspace for the given opportunity.
 * Returns a WorkspaceResult the frontend can use to link the user into Grants.gov.
 */
export async function createWorkspace(payload: WorkspacePayload): Promise<WorkspaceResult> {
  const res = await fetch(`${S2S_BASE}/opportunity/apply`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grants.gov S2S ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: {
    errorMsgs?: string[] | null;
    workspace?: {
      workspaceId: string;
      applicationId: string;
      opportunityId: string;
      applicationStatus?: string;
      workspaceLink?: string;
    };
  } = await res.json();

  if (data.errorMsgs?.length) {
    throw new Error(`Grants.gov rejected the request: ${data.errorMsgs.join('; ')}`);
  }

  const ws = data.workspace!;
  return {
    workspaceId: ws.workspaceId,
    applicationId: ws.applicationId,
    opportunityId: ws.opportunityId,
    applicationStatus: ws.applicationStatus ?? 'In Progress',
    workspaceLink:
      ws.workspaceLink ??
      `https://apply07.grants.gov/apply/ws/workspace/${ws.workspaceId}`,
  };
}

/**
 * Polls the current status of an existing workspace.
 */
export async function getWorkspaceStatus(workspaceId: string): Promise<WorkspaceResult> {
  const res = await fetch(
    `${S2S_BASE}/workspace/${encodeURIComponent(workspaceId)}`,
    { headers: { Authorization: basicAuth() } }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grants.gov S2S ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: { workspace?: WorkspaceResult } = await res.json();
  const ws = data.workspace ?? (data as unknown as WorkspaceResult);

  return {
    workspaceId: ws.workspaceId,
    applicationId: ws.applicationId,
    opportunityId: ws.opportunityId,
    applicationStatus: ws.applicationStatus,
    workspaceLink:
      ws.workspaceLink ??
      `https://apply07.grants.gov/apply/ws/workspace/${ws.workspaceId}`,
  };
}
