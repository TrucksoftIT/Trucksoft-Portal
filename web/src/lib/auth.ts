import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import type { AccessLevel, Department } from '@prisma/client'
import { prisma } from './db'

const COOKIE = 'ts_portal_session'
const DOMAIN = 'trucksoft.com.ng'

export type Session = {
  userId: string
  username: string
  displayName: string
  /** Zoho gate mailbox; 'pin-only' or 'demo' when signed in without the gate. */
  zohoEmail: string
  departments: Department[]
  level: AccessLevel
  isAdmin: boolean
  /** Demo persona session: no vault, never admin. */
  demo: boolean
}

/** One-click demo personas are offered (no Zoho, no PIN). */
export function demoLoginEnabled(): boolean {
  return process.env.DEMO_LOGIN === '1'
}

/** Username + PIN without the Zoho gate — interim until Zoho OAuth is configured. */
export function pinOnlyLoginEnabled(): boolean {
  return process.env.PIN_ONLY_LOGIN === '1'
}

export function zohoConfigured(): boolean {
  return Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET)
}

function secret() {
  const s = process.env.PORTAL_JWT_SECRET
  if (!s || s.length < 32) throw new Error('PORTAL_JWT_SECRET must be set (≥32 chars)')
  return new TextEncoder().encode(s)
}

export function isCompanyEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${DOMAIN}`)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret())
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export async function clearSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    const demo = Boolean(payload.demo)
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      displayName: String(payload.displayName || payload.username),
      zohoEmail: String(payload.zohoEmail),
      departments: (payload.departments as Department[]) || [],
      level: payload.level === 'HEAD' ? 'HEAD' : 'STAFF',
      isAdmin: !demo && Boolean(payload.isAdmin),
      demo,
    }
  } catch {
    return null
  }
}

export async function requireSession(): Promise<Session> {
  const s = await getSession()
  if (!s) throw new Error('UNAUTHORIZED')
  const user = await prisma.user.findUnique({ where: { id: s.userId } })
  if (!user || user.disabledAt) throw new Error('UNAUTHORIZED')
  return s
}

/** Like requireSession, but refuses demo personas (vault, admin, anything with real secrets). */
export async function requireRealSession(): Promise<Session> {
  const s = await requireSession()
  if (s.demo) throw new Error('DEMO_FORBIDDEN')
  return s
}

/** Pending Zoho gate cookie before username pick. */
export async function setZohoGate(email: string): Promise<void> {
  const token = await new SignJWT({ zohoEmail: email, stage: 'zoho' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret())
  const jar = await cookies()
  jar.set('ts_portal_zoho', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  })
}

export async function getZohoGate(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get('ts_portal_zoho')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (payload.stage !== 'zoho') return null
    const email = String(payload.zohoEmail || '')
    return isCompanyEmail(email) ? email.toLowerCase() : null
  } catch {
    return null
  }
}

export async function clearZohoGate(): Promise<void> {
  const jar = await cookies()
  jar.delete('ts_portal_zoho')
}

export async function audit(username: string, action: string, meta?: Record<string, unknown>, userId?: string) {
  await prisma.auditLog.create({
    data: {
      username,
      action,
      meta: meta ? (meta as object) : undefined,
      userId,
    },
  })
}
