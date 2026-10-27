import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getZohoGate } from '@/lib/auth'

/**
 * Usernames bound to the current Zoho gate email.
 * If none are bound, returns [] — UI still allows typing any username;
 * PIN handler enforces allowedZohoEmails (empty list = any company gate).
 */
export async function GET() {
  const email = await getZohoGate()
  if (!email) return NextResponse.json({ error: 'no_gate' }, { status: 401 })
  const users = await prisma.user.findMany({
    where: { disabledAt: null, allowedZohoEmails: { has: email } },
    select: { username: true, displayName: true, departments: true },
    orderBy: { username: 'asc' },
  })
  return NextResponse.json({ zohoEmail: email, users })
}
