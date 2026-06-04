/**
 * Edge-runtime session verification using Web Crypto (middleware can't use
 * node:crypto). Mirrors the HMAC scheme in ./session.ts exactly.
 */

import type { SessionPayload } from './session'

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** Verify a session token at the edge. Returns payload or null. */
export async function verifySessionTokenEdge(
  token: string | undefined | null,
  secret: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || !secret) return null
  const dot = token.indexOf('.')
  if (dot < 0) return null
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  )
  const actual = b64urlToBytes(sig)
  // Compare via the canonical b64url encoding to avoid padding ambiguity.
  if (bytesToB64url(expected) !== bytesToB64url(actual)) {
    if (!timingSafeEqual(expected, actual)) return null
  }

  try {
    const json = new TextDecoder().decode(b64urlToBytes(payloadB64))
    const payload = JSON.parse(json) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.uid || !payload.email) return null
    return payload
  } catch {
    return null
  }
}
