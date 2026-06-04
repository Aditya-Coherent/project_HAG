/**
 * Password hashing using Node's built-in scrypt — no external deps (bcrypt/argon).
 *
 * Format stored in Mongo: "scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>"
 * The cost params are embedded so existing hashes keep verifying if we tune them.
 */

import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from 'crypto'

/** Promisified scrypt that preserves the (password, salt, keylen, options) overload. */
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

// scrypt cost params — N must be a power of 2. These are a sensible 2025 default
// (~64 MB, tens of ms) that any free-tier Node host handles fine.
const N = 16384
const r = 8
const p = 1
const KEY_LEN = 64
const SALT_BYTES = 16

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = await scryptAsync(password, salt, KEY_LEN, { N, r, p, maxmem: 128 * 1024 * 1024 })
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false
    const [, nStr, rStr, pStr, saltHex, hashHex] = parts
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const derived = await scryptAsync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: 128 * 1024 * 1024,
    })
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
