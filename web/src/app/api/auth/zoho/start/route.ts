import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { zohoAuthorizeUrl } from '@/lib/zoho'

export async function GET() {
  try {
    const state = randomBytes(16).toString('hex')
    const url = zohoAuthorizeUrl(state)
    const res = NextResponse.redirect(url)
    res.cookies.set('ts_portal_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 600,
    })
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Zoho not configured'
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}
