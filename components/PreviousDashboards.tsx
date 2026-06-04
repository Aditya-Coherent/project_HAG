'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, ExternalLink, Copy, Check, RefreshCw, Trash2 } from 'lucide-react'

interface MineItem {
  id: string
  name: string
  accessCode: string | null
  shareUrl: string
  createdAt: string
  updatedAt: string
  readCount: number
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Small copy-to-clipboard button with a transient "copied" state. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function PreviousDashboards() {
  const [items, setItems] = useState<MineItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  // id awaiting confirmation, and id currently being deleted
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/dashboards/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      // Remove from the list on success.
      setItems((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dashboard')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }, [])

  const fetchMine = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/dashboards/mine')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setItems(Array.isArray(body.dashboards) ? body.dashboards : [])
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchMine()
  }, [fetchMine])

  return (
    <div className="builder-card p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Previous Dashboards</h2>
          <p className="mt-1 text-sm text-slate-400">
            Every dashboard you&apos;ve created, with its share link and access code.
            Deleting one is permanent and immediately breaks its shared link.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMine}
          disabled={status === 'loading'}
          className="builder-btn-ghost inline-flex items-center gap-2 text-sm disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your dashboards…
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-10 text-center text-slate-400">
          You haven&apos;t created any dashboards yet. Build one and generate a link to see it here.
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="space-y-3">
          {items.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{d.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Created {fmtDate(d.createdAt)} · {d.readCount} view{d.readCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={d.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                  {/* Inline-confirm delete */}
                  {confirmId === d.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
                      >
                        {deletingId === d.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        disabled={deletingId === d.id}
                        className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(d.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete dashboard"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                {/* Share link */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs text-slate-500">Link</span>
                  <input
                    readOnly
                    value={d.shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-2 py-1.5 font-mono text-xs text-slate-200 outline-none select-all"
                  />
                  <CopyButton value={d.shareUrl} label="link" />
                </div>
                {/* Access code */}
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="shrink-0 text-xs text-slate-500">Code</span>
                  {d.accessCode ? (
                    <>
                      <code className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-mono text-sm tracking-widest text-amber-200">
                        {d.accessCode}
                      </code>
                      <CopyButton value={d.accessCode} label="code" />
                    </>
                  ) : (
                    <span className="text-xs italic text-slate-500">set at creation</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
