import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getZohoGate,
  verifyPin,
  createSession,
  clearZohoGate,
  audit,
  pinOnlyLoginEnabled,
} from '@/lib/auth'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  // With the Zoho gate, the mailbox comes from the gate cookie. In PIN-only
  // mode (no Zoho OAuth yet) username + PIN alone sign in, still with lockout.
  const gateEmail = await getZohoGate()
  const pinOnly = !gateEmail && pinOnlyLoginEnabled()
  if (!gateEmail && !pinOnly) {
    return NextResponse.json({ error: 'Zoho sign-in expired. Start again from the sign-in page.' }, { status: 401 })
  }
  const body = (await req.json()) as { username?: string; pin?: string }
  const username = (body.username || '').trim().toLowerCase()
  const pin = body.pin || ''
  if (!username || pin.length < 4) {
    return NextResponse.json({ error: 'Enter your username and a PIN of at least 4 digits.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  // Demo personas are only reachable through the demo sign-in.
  if (!user || user.disabledAt || user.isDemo) {
    return NextResponse.json({ error: 'That username and PIN don’t match.' }, { status: 401 })
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: 'Too many wrong PINs. This account is locked for 15 minutes.' },
      { status: 423 },
    )
  }
  if (gateEmail) {
    const allowed = user.allowedZohoEmails.map((e) => e.toLowerCase())
    if (allowed.length > 0 && !allowed.includes(gateEmail)) {
      await audit(username, 'pin_rejected_zoho_binding', { gateEmail }, user.id)
      return NextResponse.json(
        { error: 'This username isn’t linked to the Zoho mailbox you signed in with.' },
        { status: 403 },
      )
    }
  }

  const ok = await verifyPin(pin, user.pinHash)
  if (!ok) {
    const attempts = user.failedPinAttempts + 1
    const data: { failedPinAttempts: number; lockedUntil?: Date } = { failedPinAttempts: attempts }
    if (attempts >= MAX_ATTEMPTS) {
      data.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      data.failedPinAttempts = 0
    }
    await prisma.user.update({ where: { id: user.id }, data })
    await audit(username, 'pin_failed', { attempts, pinOnly }, user.id)
    return NextResponse.json({ error: 'That username and PIN don’t match.' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedPinAttempts: 0, lockedUntil: null },
  })
  const signedInVia = gateEmail ?? 'pin-only'
  await createSession({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    zohoEmail: signedInVia,
    departments: user.departments,
    level: user.level,
    isAdmin: user.isAdmin,
    demo: false,
  })
  if (gateEmail) await clearZohoGate()
  await audit(username, 'login_ok', { via: signedInVia }, user.id)
  return NextResponse.json({ ok: true })
}
