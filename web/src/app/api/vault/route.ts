import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRealSession as requireSession, audit } from '@/lib/auth'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import type { Department } from '@prisma/client'

// Every handler uses requireRealSession: demo personas never reach the vault.

export async function GET() {
  try {
    const s = await requireSession()
    const entries = await prisma.vaultEntry.findMany({
      where: {
        OR: [
          { scope: 'PRIVATE', ownerId: s.userId },
          { scope: 'DEPARTMENT', department: { in: s.departments } },
        ],
      },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        usernameHint: true,
        scope: true,
        department: true,
        ownerId: true,
        updatedAt: true,
      },
    })
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    const body = (await req.json()) as {
      title?: string
      url?: string
      usernameHint?: string
      secret?: string
      scope?: 'PRIVATE' | 'DEPARTMENT'
      department?: Department
    }
    if (!body.title || !body.secret) {
      return NextResponse.json({ error: 'title and secret required' }, { status: 400 })
    }
    const scope = body.scope === 'DEPARTMENT' ? 'DEPARTMENT' : 'PRIVATE'
    if (scope === 'DEPARTMENT') {
      if (!body.department || !s.departments.includes(body.department)) {
        return NextResponse.json({ error: 'department required / not allowed' }, { status: 403 })
      }
    }
    const entry = await prisma.vaultEntry.create({
      data: {
        title: body.title,
        url: body.url || null,
        usernameHint: body.usernameHint || null,
        secretCiphertext: encryptSecret(body.secret),
        scope,
        ownerId: scope === 'PRIVATE' ? s.userId : null,
        department: scope === 'DEPARTMENT' ? body.department : null,
      },
    })
    await audit(s.username, 'vault_create', { id: entry.id, scope }, s.userId)
    return NextResponse.json({ id: entry.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const s = await requireSession()
    const body = (await req.json()) as { id?: string }
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const entry = await prisma.vaultEntry.findUnique({ where: { id: body.id } })
    if (!entry) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const allowed =
      (entry.scope === 'PRIVATE' && entry.ownerId === s.userId) ||
      (entry.scope === 'DEPARTMENT' &&
        entry.department &&
        s.departments.includes(entry.department))
    if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const secret = decryptSecret(entry.secretCiphertext)
    await audit(s.username, 'vault_reveal', { id: entry.id }, s.userId)
    return NextResponse.json({
      id: entry.id,
      title: entry.title,
      url: entry.url,
      usernameHint: entry.usernameHint,
      secret,
    })
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
}
