import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getZohoGate,
  verifyPin,
  createSession,
  clearZohoGate,
  audit,
} from '@/lib/auth'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  const gateEmail = await getZohoGate()
  if (!gateEmail) {
    return NextResponse.json({ error: 'Zoho gate expired — sign in again' }, { status: 401 })
  }
  const body = (await req.json()) as { username?: string; pin?: string }
  const username = (body.username || '').trim().toLowerCase()
  const pin = body.pin || ''
  if (!username || pin.length < 4) {
    return NextResponse.json({ error: 'username and PIN required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.disabledAt) {
    return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: 'Account locked — try later' }, { status: 423 })
  }
  const allowed = user.allowedZohoEmails.map((e) => e.toLowerCase())
  if (allowed.length > 0 && !allowed.includes(gateEmail)) {
    await audit(username, 'pin_rejected_zoho_binding', { gateEmail }, user.id)
    return NextResponse.json(
      { error: 'This username is not linked to the Zoho mailbox you used' },
      { status: 403 },
    )
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
    await audit(username, 'pin_failed', { attempts }, user.id)
    return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedPinAttempts: 0, lockedUntil: null },
  })
  await createSession({
    userId: user.id,
    username: user.username,
    zohoEmail: gateEmail,
    departments: user.departments,
    isAdmin: user.isAdmin,
  })
  await clearZohoGate()
  await audit(username, 'login_ok', { zohoEmail: gateEmail }, user.id)
  return NextResponse.json({ ok: true })
}
