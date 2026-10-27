import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSession, hashPin, audit } from '@/lib/auth'
import type { Department } from '@prisma/client'

async function requireAdmin() {
  const s = await requireSession()
  if (!s.isAdmin) throw new Error('FORBIDDEN')
  return s
}

export async function GET() {
  try {
    const s = await requireAdmin()
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        departments: true,
        allowedZohoEmails: true,
        isAdmin: true,
        disabledAt: true,
        createdAt: true,
      },
    })
    void s
    return NextResponse.json({ users })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const s = await requireAdmin()
    const body = (await req.json()) as {
      username?: string
      displayName?: string
      pin?: string
      departments?: Department[]
      allowedZohoEmails?: string[]
      isAdmin?: boolean
    }
    const username = (body.username || '').trim().toLowerCase()
    if (!username || !body.displayName || !body.pin || body.pin.length < 4) {
      return NextResponse.json({ error: 'username, displayName, pin required' }, { status: 400 })
    }
    const user = await prisma.user.create({
      data: {
        username,
        displayName: body.displayName,
        pinHash: await hashPin(body.pin),
        departments: body.departments || [],
        allowedZohoEmails: (body.allowedZohoEmails || []).map((e) => e.toLowerCase()),
        isAdmin: Boolean(body.isAdmin),
      },
    })
    await audit(s.username, 'admin_user_create', { id: user.id, username }, s.userId)
    return NextResponse.json({ id: user.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
