import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth/users'
import { createSessionToken, isAuthConfigured, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'
import { getMongoUri } from '@/lib/mongo-config'
import { getPublicMongoErrorMessage } from '@/lib/mongo-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth is not configured on the server. Set AUTH_SECRET in the environment.' },
      { status: 503 }
    )
  }
  if (!getMongoUri()) {
    return NextResponse.json({ error: 'Database is not configured (MONGODB_URI).' }, { status: 503 })
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  try {
    const result = await createUser(body.email, body.password)
    if (!result.ok) {
      const messages = {
        invalid_email: 'Please enter a valid email address.',
        weak_password: 'Password must be at least 8 characters.',
        email_taken: 'An account with this email already exists.',
      } as const
      return NextResponse.json({ error: messages[result.reason] }, { status: 400 })
    }

    const token = createSessionToken(result.user.id, result.user.email)!
    const res = NextResponse.json({ user: result.user }, { status: 201 })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (err) {
    console.error('[auth/signup] Error:', err)
    const { message, status } = getPublicMongoErrorMessage(err)
    return NextResponse.json({ error: message }, { status })
  }
}
