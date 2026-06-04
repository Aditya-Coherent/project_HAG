/**
 * Liveness probe — always 200 if the Node server is up.
 *
 * Intentionally has NO dependency on Mongo or R2. Render (and other PaaS) use
 * the health check to decide whether to route traffic; if it depended on Mongo,
 * a transient Atlas hiccup would make the whole app appear down. Use
 * /api/dashboards/health for the richer readiness view (Mongo + R2 status).
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
