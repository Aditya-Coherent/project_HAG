/**
 * User accounts — Mongo `users` collection (DBbuilder).
 * Email is the unique key; password is scrypt-hashed (see ./password).
 */

import { getMongoClient } from '../mongodb'
import { getMongoDatabaseName } from '../mongo-config'
import { hashPassword, verifyPassword } from './password'

const USERS_COLLECTION = 'users'

export interface UserDocument {
  _id: string // 24-char hex
  email: string // stored lowercased
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  email: string
}

function generateId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function getUsers() {
  const client = await getMongoClient()
  const col = client.db(getMongoDatabaseName()).collection<UserDocument>(USERS_COLLECTION)
  // Unique index on email — idempotent, cheap to call.
  await col.createIndex({ email: 1 }, { unique: true }).catch(() => {})
  return col
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

export type CreateUserResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: 'invalid_email' | 'weak_password' | 'email_taken' }

export async function createUser(email: unknown, password: unknown): Promise<CreateUserResult> {
  const normalized = normalizeEmail(email)
  if (!normalized) return { ok: false, reason: 'invalid_email' }
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, reason: 'weak_password' }
  }

  const col = await getUsers()
  const existing = await col.findOne({ email: normalized })
  if (existing) return { ok: false, reason: 'email_taken' }

  const doc: UserDocument = {
    _id: generateId(),
    email: normalized,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  try {
    await col.insertOne(doc)
  } catch (err) {
    // Race on the unique index → treat as taken.
    if (err instanceof Error && /E11000|duplicate key/.test(err.message)) {
      return { ok: false, reason: 'email_taken' }
    }
    throw err
  }

  return { ok: true, user: { id: doc._id, email: doc.email } }
}

export async function authenticateUser(email: unknown, password: unknown): Promise<PublicUser | null> {
  const normalized = normalizeEmail(email)
  if (!normalized || typeof password !== 'string') return null

  const col = await getUsers()
  const user = await col.findOne({ email: normalized })
  if (!user) {
    // Verify against a dummy hash anyway to keep timing roughly constant.
    await verifyPassword(password, 'scrypt$16384$8$1$00$00')
    return null
  }

  const ok = await verifyPassword(password, user.passwordHash)
  return ok ? { id: user._id, email: user.email } : null
}
