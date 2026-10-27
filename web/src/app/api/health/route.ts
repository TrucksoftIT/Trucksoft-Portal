import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', app: 'TruckSoft Portal', db: 'ok' })
  } catch {
    return NextResponse.json({ status: 'degraded', app: 'TruckSoft Portal', db: 'error' }, { status: 503 })
  }
}
