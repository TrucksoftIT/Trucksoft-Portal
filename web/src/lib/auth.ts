import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import type { Department } from '@prisma/client'
import { prisma } from './db'

const COOKIE = 'ts_portal_session'
const DOMAIN = 'trucksoft.com.ng'

export type Session = {
  userId: string
  username: string
  zohoEmail: string
  departments: Department[]
  isAdmin: boolean
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
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      zohoEmail: String(payload.zohoEmail),
      departments: (payload.departments as Department[]) || [],
      isAdmin: Boolean(payload.isAdmin),
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
