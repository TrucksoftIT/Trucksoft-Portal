import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login', '/api/auth/zoho', '/api/auth/dev-gate', '/api/health', '/api/auth/logout']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }
  // Soft gate: pages check session server-side; API routes enforce themselves.
  // Keep middleware light (no jose in edge if avoidable) — only redirect bare /
  // when no session cookie for hub routes.
  if (pathname.startsWith('/hub') || pathname.startsWith('/vault') || pathname.startsWith('/admin')) {
    const session = req.cookies.get('ts_portal_session')
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}
