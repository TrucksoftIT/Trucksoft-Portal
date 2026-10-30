import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'
import { prisma } from '@/lib/db'
import { audit, createSession, demoLoginEnabled } from '@/lib/auth'

/**
 * One-click demo sign-in (DEMO_LOGIN=1). Only users flagged isDemo are
 * reachable here; the session is marked demo, which hides the vault and
 * never grants admin. Posted from a plain <form>, so it answers with a 303.
 */
export async function POST(req: NextRequest) {
  const base = appUrl()
  if (!demoLoginEnabled()) {
    return NextResponse.redirect(new URL('/login?error=demo_off', base), 303)
  }
  const form = await req.formData()
  const username = String(form.get('username') || '').trim().toLowerCase()
  const user = username ? await prisma.user.findUnique({ where: { username } }) : null
  if (!user || !user.isDemo || user.disabledAt) {
    return NextResponse.redirect(new URL('/login?error=demo_unknown', base), 303)
  }

  await createSession({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    zohoEmail: 'demo',
    departments: user.departments,
    level: user.level,
    isAdmin: false,
    demo: true,
  })
  await audit(user.username, 'demo_login', undefined, user.id)
  return NextResponse.redirect(new URL('/hub', base), 303)
}
