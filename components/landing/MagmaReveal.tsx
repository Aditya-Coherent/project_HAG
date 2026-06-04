'use client'

import { useScrollProgress } from '@/hooks/useScrollProgress'

/**
 * Magma-style word-by-word color reveal: text starts dim and fills to white as
 * the section scrolls through the viewport (scrubbed, like thisismagma.com).
 *
 * Reveals per WORD (not per character) so words never break mid-letter — each
 * word is an inline-block unit the browser wraps cleanly.
 */
export function MagmaReveal({ text, className = '' }: { text: string; className?: string }) {
  const { ref, progress } = useScrollProgress<HTMLHeadingElement>()
  const words = text.split(' ')
  // Map scroll progress (0.05 → 0.65 window) onto how many words are lit.
  const lit = Math.round(((progress - 0.05) / 0.6) * words.length)

  return (
    <h1 ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: 'inline-block',
            color: i < lit ? '#ffffff' : 'rgba(255,255,255,0.18)',
            transition: 'color 0.35s ease',
            marginRight: '0.28em',
          }}
        >
          {word}
        </span>
      ))}
    </h1>
  )
}
