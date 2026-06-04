/**
 * Server-side helper: read the current user from the session cookie inside
 * route handlers. Returns null when unauthenticated or auth is unconfigured.
 */

import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session'

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

/** Guard for write routes — returns the user or null; caller returns 401 on null. */
export async function requireUser(): Promise<SessionPayload | null> {
  return getCurrentUser()
}
