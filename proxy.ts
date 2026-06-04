/**
 * Auth gate for builder pages + write APIs (Next.js "proxy" convention).
 *
 * Protected (require a valid session):
 *   • /dashboard-builder            (the builder UI)
 *   • /api/dashboards/save          (create/update)
 *   • /api/process-*                (Excel/intelligence/pricing/competitive)
 *   • /api/generate-dashboard       (export package)
 *   • /api/extract-regions          (builder helper)
 *
 * Public (no session):
 *   • /                             (landing)
 *   • /shared/[id]                  (gated separately by per-link access code)
 *   • /api/dashboards/[id]          (gated by access code in the route)
 *   • /api/dashboards/health
 *   • /api/auth/*                   (login/signup/logout/me)
 *
 * Verification uses Web Crypto (Edge-compatible). Unauthenticated API calls
 * get 401 JSON; unauthenticated page loads redirect to /login.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/constants'
import { verifySessionTokenEdge } from '@/lib/auth/session-edge'

const PROTECTED_API_PREFIXES = [
  '/api/dashboards/save',
  '/api/process-',
  '/api/generate-dashboard',
  '/api/extract-regions',
]

const PROTECTED_PAGE_PREFIXES = ['/dashboard-builder']

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))
}
function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protectedApi = isProtectedApi(pathname)
  const protectedPage = isProtectedPage(pathname)
  if (!protectedApi && !protectedPage) return NextResponse.next()

  const secret = process.env.AUTH_SECRET
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySessionTokenEdge(token, secret)

  if (session) return NextResponse.next()

  if (protectedApi) {
    return NextResponse.json(
      { error: 'You must be signed in to perform this action.' },
      { status: 401 }
    )
  }

  // Page: redirect to login, preserving where they were headed.
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(loginUrl)
}

// Coarse matcher — run the proxy for the builder page and all /api routes.
// The precise allow/deny decision is made in isProtectedApi/isProtectedPage,
// so single-segment routes like /api/process-excel are reliably covered
// (named-parameter matchers like "/api/process-:path*" don't bind those).
export const config = {
  matcher: ['/dashboard-builder/:path*', '/api/:path*'],
}
