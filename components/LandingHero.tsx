'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import {
  Settings,
  Upload,
  LayoutDashboard,
  Package,
  ArrowRight,
  Sparkles,
  BarChart3,
  Zap,
} from 'lucide-react'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const LandingScene = dynamic(
  () => import('@/components/landing/LandingScene').then((m) => m.LandingScene),
  {
    ssr: false,
    loading: () => <div className="landing-scene-fallback" aria-hidden />,
  }
)

interface LandingHeroProps {
  onOpenBuilder: () => void
}

const pipelineSteps = [
  { label: 'Upload CSV / Excel', icon: Upload },
  { label: 'Preview', icon: LayoutDashboard },
  { label: 'Download package', icon: Package },
] as const

const features = [
  {
    icon: Upload,
    title: 'Upload once',
    description:
      'Value, volume, and intelligence spreadsheets—aligned to how you already model the market.',
    accent: 'from-sky-500/20 to-blue-600/5',
    iconClass: 'text-sky-400',
    delay: 'landing-card-delay-1',
  },
  {
    icon: LayoutDashboard,
    title: 'Explore visually',
    description:
      'Bars, lines, heatmaps, waterfalls, and tables stay in sync with geography and segment filters.',
    accent: 'from-violet-500/20 to-indigo-600/5',
    iconClass: 'text-violet-400',
    delay: 'landing-card-delay-2',
  },
  {
    icon: Package,
    title: 'Ship anywhere',
    description:
      'Export a deployment-ready dashboard package when reviewers sign off—not after another rebuild cycle.',
    accent: 'from-fuchsia-500/15 to-purple-600/5',
    iconClass: 'text-fuchsia-400',
    delay: 'landing-card-delay-3',
  },
] as const

const stats = [
  { value: '12+', label: 'Chart types' },
  { value: '3', label: 'Data layers' },
  { value: '1-click', label: 'Export' },
] as const

export function LandingHero({ onOpenBuilder }: LandingHeroProps) {
  const parallax = useMouseParallax(24)
  const featuresReveal = useScrollReveal<HTMLElement>(0.12)

  return (
    <div className="landing-page relative flex min-h-[calc(100vh-4.5rem)] flex-col overflow-hidden">
      <div className="landing-bg-stack" aria-hidden>
        <div className="landing-bg-noise" />
        <div className="landing-bg-aurora" />
        <div className="landing-bg-grid-dark" />
        <div className="landing-bg-beam" />
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
        <div className="landing-bg-vignette" />
      </div>

      <div className="landing-content-layer relative z-10 flex flex-1 flex-col">
        {/* Hero split */}
        <section className="relative flex flex-1 flex-col lg:grid lg:grid-cols-[1fr_min(48%,520px)] lg:items-center lg:gap-8">
          <div className="relative z-10 flex flex-col justify-center px-5 pb-8 pt-10 sm:px-8 md:pt-14 lg:pb-16 lg:pt-16">
            <div className="animate-landing-hero-base animate-landing-delay-1 landing-badge landing-badge-glow mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-sky-300 backdrop-blur-md">
              <Sparkles className="landing-icon-spin h-3.5 w-3.5" aria-hidden />
              Coherent Market Insights
            </div>

            <h1 className="animate-landing-title animate-landing-delay-2 max-w-xl text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
              Transform market data into{' '}
              <span className="landing-gradient-text-v2">interactive intelligence</span>
            </h1>

            <p className="animate-landing-hero-base animate-landing-delay-3 mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              Upload value and volume files, enrich with intelligence tables, and deploy a
              fully interactive analytics workspace—without rebuilding charts on every data refresh.
            </p>

            <div className="animate-landing-hero-base animate-landing-delay-4 mt-9 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={onOpenBuilder}
                className="landing-cta-primary landing-cta-glow group relative inline-flex min-h-[54px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-8 py-3.5 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <span className="landing-cta-shine" aria-hidden />
                <span className="landing-cta-ring" aria-hidden />
                <Settings className="relative h-5 w-5" aria-hidden />
                <span className="relative">Dashboard Builder</span>
                <ArrowRight
                  className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </button>
            </div>

            {/* Pipeline steps */}
            <ol
              className="animate-landing-hero-base animate-landing-delay-5 landing-pipeline mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-0"
              aria-label="Workflow"
            >
              {pipelineSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <li
                    key={step.label}
                    className="landing-pipeline-step flex items-center"
                    style={{ animationDelay: `${0.7 + i * 0.12}s` }}
                  >
                    {i > 0 && (
                      <span className="landing-pipeline-connector mx-3 hidden h-px w-8 sm:block" aria-hidden />
                    )}
                    <span className="landing-pipeline-pill inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm text-slate-300 backdrop-blur-sm transition-colors duration-300 hover:border-sky-500/30 hover:bg-white/[0.07]">
                      <Icon className="h-4 w-4 text-sky-400/90" aria-hidden />
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ol>

            {/* Stats */}
            <dl className="animate-landing-hero-base animate-landing-delay-5 mt-12 flex flex-wrap gap-8 border-t border-white/[0.06] pt-8">
              {stats.map((stat, i) => (
                <div key={stat.label} className="landing-stat-item" style={{ animationDelay: `${0.85 + i * 0.1}s` }}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="landing-stat-value landing-stat-pop text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dd className="mt-0.5 text-sm text-slate-500">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 3D scene column */}
          <div
            className="relative min-h-[280px] flex-1 sm:min-h-[340px] lg:min-h-[480px]"
            style={{
              transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
            }}
          >
            <div className="landing-scene-mask absolute inset-0 lg:relative lg:inset-auto lg:h-full">
              <LandingScene />
            </div>
            {/* Floating preview card */}
            <div
              className="landing-preview-card landing-preview-border animate-landing-hero-base animate-landing-delay-4 pointer-events-none absolute bottom-6 left-1/2 z-20 hidden w-[min(92%,320px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl lg:left-auto lg:right-4 lg:bottom-12 lg:translate-x-0 lg:block"
              aria-hidden
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Live preview</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="landing-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {[40, 65, 45, 80, 55, 72, 48, 90].map((h, i) => (
                  <div
                    key={i}
                    className="landing-preview-bar landing-preview-bar-loop flex-1 rounded-sm bg-gradient-to-t from-sky-600 to-violet-500"
                    style={{ height: `${h}%`, animationDelay: `${1.2 + i * 0.08}s` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                <span>Filters synced across 12 chart groups</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section
          ref={featuresReveal.ref}
          className={`landing-features-section px-5 pb-20 sm:px-8 md:pb-28 ${featuresReveal.isVisible ? 'landing-features-visible' : ''}`}
        >
          <div className="mx-auto max-w-6xl">
            <div className="landing-features-heading mb-8 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Zap className="h-4 w-4 text-amber-400 landing-icon-pulse" aria-hidden />
              Everything you need in one workspace
            </div>
            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {features.map(({ icon: Icon, title, description, accent, iconClass }, i) => (
                <article
                  key={title}
                  className="landing-glass-card landing-feature-card group relative overflow-hidden rounded-2xl border border-white/[0.08] p-7 transition-all duration-500"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    aria-hidden
                  />
                  <div className="relative">
                    <div className="landing-feature-icon mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:border-sky-500/30">
                      <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={1.75} aria-hidden />
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export function LandingHeader({
  onOpenBuilder,
}: {
  onOpenBuilder: () => void
}) {
  return (
    <header className="landing-header-enter landing-header-dark sticky top-0 z-30 border-b border-white/[0.06]">
      <div className="container mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <div className="flex min-w-0 shrink-0 items-center">
          <span className="shrink-0 rounded-lg bg-white px-3 py-2 shadow-sm">
            <Image
              src="/logo.png"
              alt="Coherent Market Insights"
              width={200}
              height={48}
              unoptimized
              className="h-8 w-auto max-w-[min(200px,calc(100vw-220px))] object-contain sm:h-9"
              priority
            />
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenBuilder}
          className="landing-header-cta landing-cta-glow flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <Settings className="h-4 w-4" aria-hidden />
          Dashboard Builder
        </button>
      </div>
    </header>
  )
}
