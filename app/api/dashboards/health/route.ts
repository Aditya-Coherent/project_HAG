/**
 * Master health endpoint — GET /api/dashboards/health
 *
 * Returns a real-time snapshot of:
 *  • How many dashboards are in each partition (MongoDB load)
 *  • How many are currently cached in each partition (memory load)
 *  • Cache hit/miss rates per partition
 *  • Overall system status (healthy / degraded)
 *
 * The master uses this to detect partition imbalance.
 * A human operator (or future auto-rebalancer) can query this to
 * understand which partitions are hot and which are idle.
 */

import { NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/master-registry'
import { pingMongo } from '@/lib/mongodb'
import { getMongoUri, getMongoDatabaseName } from '@/lib/mongo-config'
import { getPublicMongoErrorMessage } from '@/lib/mongo-errors'
import { isBlobStoreEnabled, pingBlobStore } from '@/lib/blob-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const mongoConfigured = !!getMongoUri()
  const ping = mongoConfigured ? await pingMongo() : { ok: false, error: 'MONGODB_URI not set' }

  if (!ping.ok) {
    const { message } = getPublicMongoErrorMessage(new Error(ping.error || 'MongoDB ping failed'))
    return NextResponse.json(
      {
        status: 'unhealthy',
        mongo: { configured: mongoConfigured, connected: false, database: getMongoDatabaseName(), error: message },
      },
      { status: 503 }
    )
  }

  try {
    const blobEnabled = isBlobStoreEnabled()
    const blobPing = blobEnabled ? await pingBlobStore() : { ok: false }
    const health = await getSystemHealth()
    return NextResponse.json({
      ...health,
      mongo: { configured: true, connected: true, database: getMongoDatabaseName() },
      blobStore: {
        // When disabled, large dashboards still work but are capped at ~15 MB inline.
        enabled: blobEnabled,
        connected: blobEnabled ? blobPing.ok : false,
        ...(blobEnabled && !blobPing.ok ? { error: blobPing.error } : {}),
      },
    })
  } catch (err) {
    console.error('[health] Failed to collect system health:', err)
    const { message } = getPublicMongoErrorMessage(err)
    return NextResponse.json({ error: message, mongo: { connected: true } }, { status: 500 })
  }
}
