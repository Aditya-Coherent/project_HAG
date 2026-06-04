'use client'

import Image from 'next/image'
import { ArrowRight, Upload, LayoutDashboard, Share2, Lock, Menu } from 'lucide-react'
import { MagmaReveal } from '@/components/landing/MagmaReveal'
import { Footer } from '@/components/Footer'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import './magma.css'

// Hero 3D-render video, self-hosted from /public (no external dependency).
const HERO_VIDEO_URL = '/hero.mp4'

interface Props {
  onOpenBuilder: () => void
}

const features = [
  {
    eyebrow: 'STEP 01',
    title: 'Upload your market data',
    body: 'Drop in value and volume spreadsheets, plus customer, distributor, and competitive intelligence workbooks. The builder aligns to how you already model the market — geography × segment × year.',
    icon: Upload,
  },
  {
    eyebrow: 'STEP 02',
    title: 'Explore it as a living dashboard',
    body: 'Bars, lines, heatmaps, waterfalls, opportunity matrices and tables stay in sync with every geography and segment filter. CAGR, share, and KPIs are computed for you — no manual chart rebuilding.',
    icon: LayoutDashboard,
  },
  {
    eyebrow: 'STEP 03',
    title: 'Share a secure link with clients',
    body: 'Generate a permanent link backed by your own database and object storage. Each link carries its own access code, so only the people you choose can open it.',
    icon: Share2,
  },
] as const

export function MagmaLanding({ onOpenBuilder }: Props) {
  const f1 = useScrollReveal<HTMLDivElement>(0.2)

  return (
    <div className="magma-root">
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="magma-nav">
        <span className="magma-logo-box">
          <Image
            src="/logo.png"
            alt="Coherent Market Insights"
            width={200}
            height={48}
            unoptimized
            className="magma-logo-img"
            priority
          />
        </span>
        <div className="magma-nav-right">
          <button type="button" onClick={onOpenBuilder} className="magma-pill magma-pill-outline">
            Open Builder
          </button>
          <button type="button" className="magma-pill magma-pill-icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ── Page 1: Hero ──────────────────────────────────────── */}
      <section className="magma-hero">
        <div className="magma-hero-bg" aria-hidden>
          <div className="magma-hero-orb magma-hero-orb-1" />
          <div className="magma-hero-orb magma-hero-orb-2" />
          <div className="magma-hero-grid" />
        </div>

        {/* Hero 3D render (looping video) */}
        <video
          className="magma-hero-video"
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />

        <div className="magma-hero-bottom">
          <h1 className="magma-hero-title">
            Turn market data
            <br />
            into intelligence
          </h1>
          <div className="magma-hero-inner">
            <h4 className="magma-hero-sub">
              Upload Excel, build an interactive market dashboard,
              <br />
              and share it with your clients in minutes.
            </h4>
            <button type="button" onClick={onOpenBuilder} className="magma-pill magma-pill-solid">
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button type="button" className="magma-scroll-hint" aria-hidden onClick={onOpenBuilder}>
          Scroll to explore
        </button>
      </section>

      {/* ── Page 2: Statement (per-letter reveal) ─────────────── */}
      <section className="magma-statement">
        <h2 className="magma-statement-eyebrow">WHAT YOU CAN BUILD</h2>
        <MagmaReveal
          className="magma-statement-text"
          text="Raw spreadsheets become interactive dashboards your whole team can read, filter, and share."
        />
      </section>

      {/* ── Page 3+: Feature sections ─────────────────────────── */}
      <div ref={f1.ref} className={`magma-features ${f1.isVisible ? 'magma-in' : ''}`}>
        {features.map(({ eyebrow, title, body, icon: Icon }, i) => (
          <section className="magma-feature" key={title} style={{ transitionDelay: `${i * 0.12}s` }}>
            <div className="magma-feature-left">
              <span className="magma-feature-eyebrow">{eyebrow}</span>
              <h3 className="magma-feature-title">{title}</h3>
            </div>
            <div className="magma-feature-right">
              <div className="magma-feature-icon">
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="magma-feature-body">{body}</p>
            </div>
          </section>
        ))}
      </div>

      {/* ── Security band ─────────────────────────────────────── */}
      <section className="magma-security">
        <Lock className="magma-security-icon" />
        <p>
          Every shared dashboard is protected by a per-link access code and your own
          authentication — your clients see only what you send them.
        </p>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="magma-cta">
        <h1 className="magma-cta-title">
          Build your first
          <br />
          dashboard
        </h1>
        <button type="button" onClick={onOpenBuilder} className="magma-pill magma-pill-solid magma-cta-btn">
          Open Dashboard Builder
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

      {/* Footer — Coherent content, Magma-themed */}
      <Footer variant="magma" />
    </div>
  )
}
