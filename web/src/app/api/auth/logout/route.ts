import { NextResponse } from 'next/server'
import { clearSession, clearZohoGate, getSession, audit } from '@/lib/auth'

export async function POST() {
  const s = await getSession()
  if (s) await audit(s.username, 'logout', {}, s.userId)
  await clearSession()
  await clearZohoGate()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}

export async function GET() {
  return POST()
}
