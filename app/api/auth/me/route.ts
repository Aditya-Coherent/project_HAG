import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({ user: { id: user.uid, email: user.email } }, { status: 200 })
}
