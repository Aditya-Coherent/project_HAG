/**
 * GET /api/dashboards/mine — list dashboards owned by the logged-in user.
 *
 * Returns lightweight metadata only (no heavy dashboard payload): name,
 * access code, share URL, timestamps, read count. Used by the builder's
 * "Previous Dashboards" tab.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { listDashboardsByOwner } from '@/lib/dashboard-mongo'
import { getPublicAppOrigin } from '@/lib/app-origin'
import { getMongoUri } from '@/lib/mongo-config'
import { getPublicMongoErrorMessage } from '@/lib/mongo-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }
  if (!getMongoUri()) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  try {
    const origin = getPublicAppOrigin(request)
    const docs = await listDashboardsByOwner(user.uid)
    const dashboards = docs.map((d) => ({
      id: d._id,
      name: d.name || 'Untitled Dashboard',
      accessCode: d.accessCode ?? null,
      shareUrl: origin ? `${origin}/shared/${d._id}` : `/shared/${d._id}`,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      readCount: d.readCount ?? 0,
    }))
    return NextResponse.json({ dashboards })
  } catch (err) {
    console.error('[dashboards/mine] Error:', err)
    const { message, status } = getPublicMongoErrorMessage(err)
    return NextResponse.json({ error: message }, { status })
  }
}
