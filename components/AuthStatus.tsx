'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Shows the signed-in user's email + a logout button. Renders nothing if logged out. */
export function AuthStatus({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (active) setEmail(d?.user?.email ?? null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!email) return null

  async function logout() {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="hidden text-sm text-slate-400 sm:inline" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="builder-btn-ghost shrink-0 text-sm disabled:opacity-60"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
