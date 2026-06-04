/**
 * Prepare / restore dashboard snapshots for MongoDB (size limits + gzip).
 */

import { gzipSync, gunzipSync } from 'zlib'
import type { ComparisonData, DataRecord } from './types'
import type { DashboardDocument } from './dashboard-mongo'
import { isBlobStoreEnabled, putBlob, getBlob } from './blob-store'

const INLINE_MAX_BYTES = 1_500_000
const MONGO_DOC_SOFT_LIMIT = 15_000_000

function slimRecords(records: DataRecord[]): DataRecord[] {
  return records.filter(
    (r) => r.is_aggregated !== true && r.segment !== '__ALL_SEGMENTS__'
  )
}

/** Drop redundant aggregated rows; charts filter on leaf data. */
export function slimComparisonData(data: ComparisonData | null): ComparisonData | null {
  if (!data?.data) return data

  return {
    ...data,
    data: {
      value: {
        geography_segment_matrix: slimRecords(
          data.data.value?.geography_segment_matrix ?? []
        ),
      },
      volume: {
        geography_segment_matrix: slimRecords(
          data.data.volume?.geography_segment_matrix ?? []
        ),
      },
    },
  }
}

function gzipToBase64(json: string): string {
  return gzipSync(Buffer.from(json, 'utf8')).toString('base64')
}

function gunzipFromBase64(b64: string): string {
  return gunzipSync(Buffer.from(b64, 'base64')).toString('utf8')
}

export type PersistedMarketData = {
  data: ComparisonData | null
  dataCompressed: string | null
  /** Object-storage key when the blob was offloaded (see blob-store.ts). */
  dataS3Key: string | null
}

/**
 * Decide where a gzip blob lives based on size and whether a blob store
 * is configured:
 *   • blob store enabled → offload to object storage, store only the key
 *   • blob store disabled → keep inline in Mongo (current behavior), but
 *     enforce the 15 MB BSON-safe ceiling
 *
 * `dashboardId`/`field` are required so the blob gets a stable, deletable key.
 */
async function offloadOrInline(
  compressed: string,
  dashboardId: string,
  field: string
): Promise<{ compressed: string | null; s3Key: string | null }> {
  if (isBlobStoreEnabled()) {
    const key = await putBlob(dashboardId, field, compressed)
    return { compressed: null, s3Key: key }
  }
  if (compressed.length > MONGO_DOC_SOFT_LIMIT) {
    throw new Error('DASHBOARD_TOO_LARGE')
  }
  return { compressed, s3Key: null }
}

export async function persistMarketData(
  raw: ComparisonData | null | undefined,
  dashboardId: string
): Promise<PersistedMarketData> {
  const slim = slimComparisonData(raw ?? null)
  if (!slim) return { data: null, dataCompressed: null, dataS3Key: null }

  const json = JSON.stringify(slim)
  if (json.length <= INLINE_MAX_BYTES) {
    return { data: slim, dataCompressed: null, dataS3Key: null }
  }

  const compressed = gzipToBase64(json)
  const { compressed: dataCompressed, s3Key } = await offloadOrInline(
    compressed,
    dashboardId,
    'market'
  )
  return { data: null, dataCompressed, dataS3Key: s3Key }
}

export async function restoreMarketData(doc: {
  data?: ComparisonData | null
  dataCompressed?: string | null
  dataS3Key?: string | null
}): Promise<ComparisonData | null> {
  if (doc.data) return doc.data
  const b64 = doc.dataCompressed ?? (doc.dataS3Key ? await getBlob(doc.dataS3Key) : null)
  if (!b64) return null
  try {
    return JSON.parse(gunzipFromBase64(b64)) as ComparisonData
  } catch (err) {
    console.error('[snapshot-persist] Failed to decompress market data:', err)
    return null
  }
}

export async function persistJsonField(
  value: unknown,
  dashboardId: string,
  field: string
): Promise<{ inline: unknown; compressed: string | null; s3Key: string | null }> {
  if (value == null) return { inline: null, compressed: null, s3Key: null }
  const json = JSON.stringify(value)
  if (json.length <= INLINE_MAX_BYTES) {
    return { inline: value, compressed: null, s3Key: null }
  }
  const gz = gzipToBase64(json)
  const { compressed, s3Key } = await offloadOrInline(gz, dashboardId, field)
  return { inline: null, compressed, s3Key }
}

export async function restoreJsonField(doc: {
  inline?: unknown
  compressed?: string | null
  s3Key?: string | null
}): Promise<unknown> {
  if (doc.inline != null) return doc.inline
  const b64 = doc.compressed ?? (doc.s3Key ? await getBlob(doc.s3Key) : null)
  if (!b64) return null
  try {
    return JSON.parse(gunzipFromBase64(b64))
  } catch {
    return null
  }
}

/** Decode client upload when body was gzip-compressed in the browser. */
export function decodeSaveRequestBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (body._compressed === true && typeof body.payload === 'string') {
    const json = gunzipFromBase64(body.payload)
    return JSON.parse(json) as Record<string, unknown>
  }
  return body
}

export async function hydrateDashboardDocument(
  doc: DashboardDocument
): Promise<DashboardDocument> {
  const [data, pricingAnalysisData] = await Promise.all([
    restoreMarketData(doc),
    restoreJsonField({
      inline: doc.pricingAnalysisData,
      compressed: doc.pricingAnalysisCompressed ?? null,
      s3Key: doc.pricingAnalysisS3Key ?? null,
    }),
  ])
  return { ...doc, data, pricingAnalysisData }
}
