/**
 * Login.gov OAuth 2.0 callback handler.
 *
 * After the user authenticates on Login.gov they are redirected here with ?code=&state=.
 * We validate the state cookie, exchange the code for tokens, store the access token in
 * an httpOnly cookie, then send the user back to the dashboard.
 *
 * To start the Login.gov auth flow, redirect the user to /api/apply/start.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/logingov';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  const dashboardBase = new URL('/dashboard', req.url);

  if (error) {
    dashboardBase.searchParams.set('auth_error', errorDesc ?? error);
    return NextResponse.redirect(dashboardBase);
  }

  if (!code || !state) {
    dashboardBase.searchParams.set('auth_error', 'missing_code_or_state');
    return NextResponse.redirect(dashboardBase);
  }

  const cookieStore = await cookies();
  const savedState    = cookieStore.get('logingov_state')?.value;
  const codeVerifier  = cookieStore.get('logingov_pkce_verifier')?.value;

  if (!savedState || savedState !== state || !codeVerifier) {
    dashboardBase.searchParams.set('auth_error', 'state_mismatch');
    return NextResponse.redirect(dashboardBase);
  }

  try {
    const { accessToken, email } = await exchangeCodeForToken(code, codeVerifier);

    const successUrl = new URL('/dashboard', req.url);
    successUrl.searchParams.set('auth_success', '1');
    const res = NextResponse.redirect(successUrl);

    res.cookies.set('logingov_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    // Clear the one-time PKCE / state cookies
    res.cookies.delete('logingov_state');
    res.cookies.delete('logingov_pkce_verifier');

    console.info(`[Login.gov] Authenticated: ${email}`);
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed';
    console.error('[/api/apply/callback]', msg);
    dashboardBase.searchParams.set('auth_error', encodeURIComponent(msg));
    return NextResponse.redirect(dashboardBase);
  }
}
