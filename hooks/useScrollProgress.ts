'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks how far an element has scrolled through the viewport, 0 → 1.
 * 0 = element's top just entered the bottom of the viewport,
 * 1 = element's bottom has passed the top of the viewport.
 * Used for the Magma-style per-letter color reveal (scrubbed by scroll).
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // total distance the element travels through the viewport
      const total = rect.height + vh
      const travelled = vh - rect.top
      const p = Math.min(1, Math.max(0, travelled / total))
      setProgress(p)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return { ref, progress }
}
