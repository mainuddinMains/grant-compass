/**
 * Login.gov OAuth 2.0 + PKCE helpers.
 *
 * Login.gov uses private_key_jwt client authentication (RS256).
 * You must register an app at https://dashboard.int.identitysandbox.gov (sandbox)
 * or https://dashboard.login.gov (production) and supply a public key.
 * Store the matching private key in LOGINGOV_PRIVATE_KEY (PEM format).
 *
 * Docs: https://developers.login.gov/oidc/
 */

import crypto from 'crypto';

const LOGINGOV_HOST =
  process.env.LOGINGOV_ENV === 'production'
    ? 'https://secure.login.gov'
    : 'https://idp.int.identitysandbox.gov';

const CLIENT_ID = process.env.LOGINGOV_CLIENT_ID ?? '';
const REDIRECT_URI = process.env.LOGINGOV_REDIRECT_URI ?? '';

// ── PKCE ─────────────────────────────────────────────────────────

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

export function generatePKCE(): PKCEPair {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

// ── Authorization URL ─────────────────────────────────────────────

export function buildAuthorizationUrl(
  state: string,
  nonce: string,
  codeChallenge: string,
): string {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error('LOGINGOV_CLIENT_ID and LOGINGOV_REDIRECT_URI must be set.');
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    // IAL1 = identity-verified to email level (sufficient for grant applications)
    acr_values: 'http://idmanagement.gov/ns/assurance/ial/1',
  });
  return `${LOGINGOV_HOST}/openid_connect/authorize?${params}`;
}

// ── Token exchange ────────────────────────────────────────────────

export interface LoginGovTokens {
  accessToken: string;
  idToken: string;
  email: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<LoginGovTokens> {
  const privateKeyPem = process.env.LOGINGOV_PRIVATE_KEY;
  if (!privateKeyPem) throw new Error('LOGINGOV_PRIVATE_KEY is not set.');

  const clientAssertion = buildClientAssertion(privateKeyPem);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
    client_assertion_type:
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: clientAssertion,
  });

  const res = await fetch(`${LOGINGOV_HOST}/api/openid_connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Login.gov token exchange failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data: { access_token: string; id_token: string } = await res.json();
  const payload = decodeJwtPayload(data.id_token);

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    email: (payload.email as string) ?? '',
  };
}

// ── Private key JWT (RS256) ───────────────────────────────────────

function buildClientAssertion(privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: CLIENT_ID,
      sub: CLIENT_ID,
      aud: `${LOGINGOV_HOST}/api/openid_connect/token`,
      jti: crypto.randomBytes(16).toString('hex'),
      iat: now,
      exp: now + 300, // 5-minute window
    }),
  );

  const signingInput = `${header}.${claims}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const sig = sign.sign(privateKeyPem, 'base64url');

  return `${signingInput}.${sig}`;
}

function b64url(s: string): string {
  return Buffer.from(s).toString('base64url');
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part, 'base64url').toString());
  } catch {
    return {};
  }
}
