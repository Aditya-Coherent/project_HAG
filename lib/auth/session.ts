/**
 * Stateless sessions via signed cookies (HMAC-SHA256). No DB session table —
 * works on any free single/multi-instance host with zero extra infra.
 *
 * Token format: base64url(payloadJSON).base64url(hmac)
 * Payload: { uid, email, exp }  (exp = unix seconds)
 *
 * Requires env AUTH_SECRET (any long random string). If unset, sessions are
 * disabled and getSession() returns null — the app still builds/runs, auth
 * routes just reject with a clear "AUTH_SECRET not set" message.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'

export { SESSION_COOKIE } from './constants'

export interface SessionPayload {
  uid: string
  email: string
  exp: number
}

function getSecret(): string | null {
  return process.env.AUTH_SECRET?.trim() || null
}

export function isAuthConfigured(): boolean {
  return getSecret() !== null
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(payloadB64: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payloadB64).digest())
}

/** Create a signed session token for a user. Returns null if AUTH_SECRET is unset. */
export function createSessionToken(uid: string, email: string): string | null {
  const secret = getSecret()
  if (!secret) return null
  const payload: SessionPayload = {
    uid,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `${payloadB64}.${sign(payloadB64, secret)}`
}

/** Verify a token and return its payload, or null if invalid/expired/unconfigured. */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  const secret = getSecret()
  if (!secret || !token) return null

  const dot = token.indexOf('.')
  if (dot < 0) return null
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expected = sign(payloadB64, secret)
  const sigBuf = b64urlDecode(sig)
  const expBuf = b64urlDecode(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.uid || !payload.email) return null
    return payload
  } catch {
    return null
  }
}

/** Cookie attributes for setting the session (httpOnly, secure in prod). */
export function sessionCookieOptions(maxAgeSeconds = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
