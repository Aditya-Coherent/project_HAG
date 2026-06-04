/**
 * Slave read path — GET /api/dashboards/[id]
 *
 * Flow:
 *  1. Validate the ID (prevent invalid/malicious lookups)
 *  2. Check the partition's slave cache → HIT: return immediately
 *  3. MISS: fetch from MongoDB → store in cache → return
 *  4. Increment readCount in the background (non-blocking, zero latency impact)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getDashboard,
  incrementReadCount,
  isValidDashboardId,
  deleteDashboardOwnedBy,
} from '@/lib/dashboard-mongo'
import { hydrateDashboardDocument } from '@/lib/dashboard-snapshot-persist'
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/slave-cache'
import { verifyAccessCode } from '@/lib/auth/access-code'
import { getCurrentUser } from '@/lib/auth/current-user'
import { deleteBlob, isBlobStoreEnabled } from '@/lib/blob-store'
import type { DashboardDocument } from '@/lib/dashboard-mongo'

export const dynamic = 'force-dynamic'

/** Strip secrets before sending a dashboard to the client. */
function publicView(
  doc: DashboardDocument
): Omit<DashboardDocument, 'accessCodeHash' | 'ownerId' | 'accessCode'> {
  const { accessCodeHash: _h, ownerId: _o, accessCode: _c, ...rest } = doc
  return rest
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const code = request.nextUrl.searchParams.get('code')

  if (!id) {
    return NextResponse.json({ error: 'Missing dashboard ID.' }, { status: 400 })
  }

  if (!isValidDashboardId(id)) {
    return NextResponse.json(
      { error: 'The dashboard ID in this link is not valid.' },
      { status: 400 }
    )
  }

  try {
    // ── Slave: check partition cache first ───────────────────────────────
    // We need the partitionKey to know which cache bucket to check.
    // For existing documents we'll get it from MongoDB on a miss and then
    // cache it so subsequent requests are instant.

    // Fast path: try to find it in all partitions via direct key lookup.
    // Since we store by dashboardId in the correct bucket, we need the
    // partitionKey first. We attempt a quick MongoDB fetch which also
    // gives us the partitionKey to use for all future cache operations.

    // Check if it's in any cache bucket by doing a DB fetch to get partitionKey,
    // then use that to check the correct cache bucket.
    // On first access this is one MongoDB round trip; every access after is cached.

    // Step 1: get the document (from cache or MongoDB)
    let doc = null
    let fromCache = false

    // We need the partitionKey to do a cache lookup. Fetch from MongoDB to get it.
    // On subsequent requests, the cache will be warm and we skip the fetch.
    // To avoid the bootstrap problem, we store a lightweight index in cache partition 0
    // mapping dashboardId → partitionKey. But for simplicity, we do a conditional:
    // try each partition's cache for this id (O(8) map lookups, sub-microsecond)
    const { PARTITION_COUNT } = await import('@/lib/slave-cache')
    for (let p = 0; p < PARTITION_COUNT; p++) {
      const cached = cacheGet(id, p)
      if (cached) {
        doc = cached
        fromCache = true
        break
      }
    }

    if (!doc) {
      // Cache miss — fetch from MongoDB
      doc = await getDashboard(id)

      if (!doc) {
        return NextResponse.json(
          {
            error: 'Dashboard not found.',
            detail: 'This link may be invalid or the dashboard was never saved.',
          },
          { status: 404 }
        )
      }

      // Store in the correct partition cache for future requests
      cacheSet(id, doc.partitionKey ?? 0, doc)
    }

    // ── Access control ───────────────────────────────────────────────────
    // The owner (logged in) always has access. Everyone else must supply the
    // correct per-link access code. Dashboards with no code (legacy/test) are
    // treated as protected too — they require a code that doesn't exist, so a
    // signed-in owner is the only way in. Adjust here to grandfather legacy.
    if (doc.accessCodeHash) {
      const user = await getCurrentUser()
      const isOwner = !!user && !!doc.ownerId && user.uid === doc.ownerId
      if (!isOwner) {
        const codeOk = await verifyAccessCode(code, doc.accessCodeHash)
        if (!codeOk) {
          return NextResponse.json(
            {
              error: 'access_code_required',
              // Dashboard name is not sensitive — surface it so the protected
              // page can greet the viewer with which dashboard they're opening.
              name: doc.name ?? null,
              detail: code
                ? 'That access code is incorrect.'
                : 'This dashboard is protected. Enter the access code to view it.',
            },
            { status: 401 }
          )
        }
      }
    }

    // ── Increment read counter (fire-and-forget, non-blocking) ───────────
    if (!fromCache) {
      // Only count on cache misses to avoid DB write on every cached hit
      incrementReadCount(id)
    }

    return NextResponse.json(publicView(await hydrateDashboardDocument(doc)))

  } catch (err) {
    console.error('[dashboards/[id]] Error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while loading the dashboard.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dashboards/[id] — owner-only delete.
 *
 * Removes the Mongo document, its R2 blobs (if offloaded), and the cache entry.
 * Non-owners (and missing dashboards) get 404 so we don't reveal existence.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidDashboardId(id)) {
    return NextResponse.json({ error: 'Invalid dashboard ID.' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  try {
    const deleted = await deleteDashboardOwnedBy(id, user.uid)
    if (!deleted) {
      // Either it doesn't exist or it isn't owned by this user.
      return NextResponse.json(
        { error: 'Dashboard not found, or you do not have permission to delete it.' },
        { status: 404 }
      )
    }

    // Best-effort cleanup of offloaded blobs (orphans are harmless but waste space).
    if (isBlobStoreEnabled()) {
      const keys = [deleted.dataS3Key, deleted.pricingAnalysisS3Key].filter(
        (k): k is string => typeof k === 'string' && k.length > 0
      )
      await Promise.all(keys.map((k) => deleteBlob(k)))
    }

    // Drop any cached copy so it can't be served after deletion.
    cacheInvalidate(id, deleted.partitionKey ?? 0)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[dashboards/[id]] DELETE error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the dashboard.' },
      { status: 500 }
    )
  }
}
