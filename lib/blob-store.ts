/**
 * Object-storage offload for large dashboard blobs (S3-compatible).
 *
 * WHY: MongoDB documents are capped at 16 MB (BSON), so storing big
 * gzip+base64 dashboards inline (see dashboard-snapshot-persist.ts) hits a
 * hard wall at ~3,500 rows and burns Atlas M0's 512 MB budget after only a
 * few dozen dashboards. Offloading the blob to object storage keeps the
 * Mongo document tiny (just an `s3Key` reference) so the free Atlas tier
 * holds tens of thousands of dashboards instead of dozens.
 *
 * WORKS WITH any S3-compatible store. Recommended free option:
 *   Cloudflare R2 — 10 GB storage, 1M writes/mo, zero egress fees.
 * The same code points at real AWS S3 by dropping BLOB_ENDPOINT.
 *
 * GRACEFUL FALLBACK: when no blob store is configured, isBlobStoreEnabled()
 * returns false and the persist layer keeps the current inline-Mongo
 * behavior. Nothing breaks locally without credentials.
 *
 * Required env vars (all four to enable):
 *   BLOB_BUCKET            bucket name
 *   BLOB_ACCESS_KEY_ID     access key
 *   BLOB_SECRET_ACCESS_KEY secret key
 *   BLOB_ENDPOINT          e.g. https://<account>.r2.cloudflarestorage.com  (omit for AWS S3)
 * Optional:
 *   BLOB_REGION            defaults to "auto" (R2) — use a real region for AWS S3
 *   BLOB_KEY_PREFIX        defaults to "dashboards/"
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

interface BlobConfig {
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  region: string
  keyPrefix: string
}

function readConfig(): BlobConfig | null {
  const bucket = process.env.BLOB_BUCKET?.trim()
  const accessKeyId = process.env.BLOB_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.BLOB_SECRET_ACCESS_KEY?.trim()
  if (!bucket || !accessKeyId || !secretAccessKey) return null

  const endpoint = process.env.BLOB_ENDPOINT?.trim() || undefined
  const region = process.env.BLOB_REGION?.trim() || 'auto'
  const keyPrefix = (process.env.BLOB_KEY_PREFIX?.trim() || 'dashboards/').replace(/^\/+/, '')

  return { bucket, accessKeyId, secretAccessKey, endpoint, region, keyPrefix }
}

/** True when all required blob-store env vars are present. */
export function isBlobStoreEnabled(): boolean {
  return readConfig() !== null
}

// Singleton client + config, created lazily so unconfigured deploys pay nothing.
declare global {
  // eslint-disable-next-line no-var
  var _blobClient: { client: S3Client; config: BlobConfig } | undefined
}

function getClient(): { client: S3Client; config: BlobConfig } {
  const config = readConfig()
  if (!config) {
    throw new Error('BLOB_STORE_NOT_CONFIGURED')
  }
  if (!global._blobClient) {
    global._blobClient = {
      client: new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        // R2 / most S3-compatibles require path-style off; AWS S3 works either way.
        forcePathStyle: false,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
      config,
    }
  }
  return global._blobClient
}

/**
 * Build the object key for a given dashboard + field.
 * Grouped by dashboardId so a delete can wipe all of a dashboard's blobs.
 */
export function blobKey(dashboardId: string, field: string): string {
  const { config } = getClient()
  return `${config.keyPrefix}${dashboardId}/${field}.gz.b64`
}

/** Upload a (already gzip+base64) blob. Returns the object key stored in Mongo. */
export async function putBlob(dashboardId: string, field: string, body: string): Promise<string> {
  const { client, config } = getClient()
  const key = blobKey(dashboardId, field)
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain; charset=utf-8',
    })
  )
  return key
}

/** Fetch a blob by key. Returns the gzip+base64 string, or null on any failure. */
export async function getBlob(key: string): Promise<string | null> {
  try {
    const { client, config } = getClient()
    const res = await client.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key })
    )
    if (!res.Body) return null
    // transformToString is provided by the AWS SDK v3 Node streaming body.
    return await (res.Body as unknown as { transformToString(): Promise<string> }).transformToString()
  } catch (err) {
    console.error('[blob-store] getBlob failed for key', key, err)
    return null
  }
}

/** Best-effort delete. Never throws — orphaned blobs are harmless. */
export async function deleteBlob(key: string): Promise<void> {
  try {
    const { client, config } = getClient()
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
  } catch (err) {
    console.warn('[blob-store] deleteBlob failed for key', key, err)
  }
}

/** Lightweight connectivity check for the health endpoint. */
export async function pingBlobStore(): Promise<{ ok: boolean; error?: string }> {
  if (!isBlobStoreEnabled()) return { ok: false, error: 'Blob store not configured' }
  try {
    // GET a key that almost certainly doesn't exist. Reaching the bucket and
    // authenticating is what we're proving — a "no such key" response means
    // success (creds + bucket are valid); only auth/network errors are failures.
    const { client, config } = getClient()
    await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: `${config.keyPrefix}__healthcheck__` }))
    return { ok: true }
  } catch (err) {
    // AWS SDK v3 puts the error code on err.name (e.g. "NoSuchKey"); some
    // S3-compatible stores (R2) only surface the human message
    // ("The specified key does not exist."). Either form means the bucket is
    // reachable and the credentials are valid → healthy.
    const name = err instanceof Error ? err.name : ''
    const message = err instanceof Error ? err.message : String(err)
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    const keyMissing =
      /NoSuchKey|NotFound/i.test(name) ||
      /no such key|does not exist|not found/i.test(message) ||
      httpStatus === 404
    if (keyMissing) return { ok: true }
    return { ok: false, error: message }
  }
}
