'use client'

import { Suspense, useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/store'
import { DashboardShell } from '@/components/DashboardShell'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagmaLanding } from '@/components/MagmaLanding'

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showHeroLanding = searchParams.get('home') === '1'
  const {
    setLoading,
    data,
    isLoading,
    error,
    rawIntelligenceData,
    proposition2Data,
    proposition3Data,
    distributorRawIntelligenceData,
    distributorProposition2Data,
    distributorProposition3Data,
    pricingAnalysisData,
  } = useDashboardStore()
  const [mounted, setMounted] = useState(false)
  const [hasCheckedStore, setHasCheckedStore] = useState(false)

  const hasMarketData = !!data
  const hasIntelligenceData = !!(
    rawIntelligenceData?.rows?.length ||
    proposition2Data?.rows?.length ||
    proposition3Data?.rows?.length ||
    distributorRawIntelligenceData?.rows?.length ||
    distributorProposition2Data?.rows?.length ||
    distributorProposition3Data?.rows?.length
  )
  const hasPricingData = !!(pricingAnalysisData?.data?.value?.geography_segment_matrix?.length)
  const hasAnyData = hasMarketData || hasIntelligenceData || hasPricingData

  useEffect(() => {
    setMounted(true)

    // Check if data already exists in store (from dashboard builder)
    const storeState = useDashboardStore.getState()
    const existingData = storeState.data
    const existingIntelligence =
      storeState.rawIntelligenceData ||
      storeState.proposition2Data ||
      storeState.proposition3Data ||
      storeState.distributorRawIntelligenceData ||
      storeState.distributorProposition2Data ||
      storeState.distributorProposition3Data

    if ((existingData || existingIntelligence) && !hasCheckedStore) {
      // Data already exists from dashboard builder, don't reload
      console.log('✅ Using existing data from store (from Dashboard Builder)')
      setHasCheckedStore(true)
      setLoading(false)
      // Load default filters for existing data if we have market data
      if (existingData) {
        const { loadDefaultFilters } = useDashboardStore.getState()
        loadDefaultFilters()
      }
      return
    }

    // Fresh visit: show hero landing; do not auto-fetch public JSON / mock data.
    if (hasCheckedStore) {
      return
    }

    setHasCheckedStore(true)
    setLoading(false)
  }, [setLoading, hasCheckedStore])

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-black">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !hasAnyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-2xl font-semibold mb-3">Error</div>
          <p className="text-black mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Hero landing — default when no data, or when returning home from builder header
  if (!hasAnyData || showHeroLanding) {
    const openBuilder = () => router.push('/dashboard-builder')
    return <MagmaLanding onOpenBuilder={openBuilder} />
  }

  return <DashboardShell />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  )
}
