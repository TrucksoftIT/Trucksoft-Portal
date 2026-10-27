import { NextRequest, NextResponse } from 'next/server'
import { exchangeZohoCode } from '@/lib/zoho'
import { isCompanyEmail, setZohoGate, audit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const expected = req.cookies.get('ts_portal_oauth_state')?.value
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${base}/login?error=invalid_oauth_state`)
  }
  try {
    const { email } = await exchangeZohoCode(code)
    if (!isCompanyEmail(email)) {
      await audit('anonymous', 'zoho_rejected_domain', { email })
      return NextResponse.redirect(`${base}/login?error=company_email_required`)
    }
    await setZohoGate(email)
    await audit('anonymous', 'zoho_gate_ok', { email })
    return NextResponse.redirect(`${base}/login/pick-user`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'oauth_failed'
    return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(msg)}`)
  }
}
