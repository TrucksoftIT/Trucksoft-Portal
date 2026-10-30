import { NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'
import { clearSession, clearZohoGate, getSession, audit } from '@/lib/auth'

export async function POST() {
  const s = await getSession()
  if (s) await audit(s.username, 'logout', {}, s.userId)
  await clearSession()
  await clearZohoGate()
  return NextResponse.redirect(new URL('/login', appUrl()))
}

export async function GET() {
  return POST()
}
