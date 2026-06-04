import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/users'
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
    const user = await authenticateUser(body.email, body.password)
    if (!user) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    const token = createSessionToken(user.id, user.email)!
    const res = NextResponse.json({ user }, { status: 200 })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (err) {
    console.error('[auth/login] Error:', err)
    const { message, status } = getPublicMongoErrorMessage(err)
    return NextResponse.json({ error: message }, { status })
  }
}
