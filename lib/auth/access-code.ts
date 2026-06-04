/**
 * Per-link access codes for shared dashboards.
 *
 * A code is generated when a dashboard is saved, hashed (scrypt) and stored on
 * the document as `accessCodeHash`. The plaintext code is returned to the
 * builder ONCE (to share with the client) and never persisted in plaintext.
 * Viewers submit the code to open /shared/[id].
 */

import { hashPassword, verifyPassword } from './password'

// Unambiguous alphabet (no 0/O, 1/I/l) — easy to read aloud / copy.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 8

export function generateAccessCode(): string {
  const bytes = new Uint8Array(CODE_LEN)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export async function hashAccessCode(code: string): Promise<string> {
  // Reuse scrypt; codes are uppercased so verification is case-insensitive.
  return hashPassword(code.toUpperCase())
}

export async function verifyAccessCode(code: unknown, hash: string | null | undefined): Promise<boolean> {
  if (!hash || typeof code !== 'string') return false
  return verifyPassword(code.trim().toUpperCase(), hash)
}
