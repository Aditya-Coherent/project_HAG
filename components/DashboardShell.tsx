'use client'

/**
 * DashboardShell – the full interactive dashboard UI.
 *
 * Reads all data from the Zustand store. Assumes the caller has already
 * hydrated the store with the relevant data before rendering this component.
 *
 * Used by:
 *   - app/page.tsx          (normal dashboard flow)
 *   - app/shared/[id]/page.tsx  (shared-link flow)
 */

import { useEffect, useState, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'
import { EnhancedFilterPanel } from '@/components/filters/EnhancedFilterPanel'
import { GroupedBarChart } from '@/components/charts/GroupedBarChart'
import { MultiLineChart } from '@/components/charts/MultiLineChart'
import { MatrixHeatmap } from '@/components/charts/MatrixHeatmap'
import { ComparisonTable } from '@/components/charts/ComparisonTable'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { D3BubbleChartIndependent } from '@/components/charts/D3BubbleChartIndependent'
import { CompetitiveIntelligence } from '@/components/charts/CompetitiveIntelligence'
import { IntelligenceDatabaseViews } from '@/components/charts/IntelligenceDatabaseViews'
import { PricingAnalysisView } from '@/components/charts/PricingAnalysisView'
import { InsightsPanel } from '@/components/InsightsPanel'
import { FilterPresets } from '@/components/filters/FilterPresets'
import { ChartGroupSelector } from '@/components/filters/ChartGroupSelector'
import { CustomScrollbar } from '@/components/ui/CustomScrollbar'
import { GlobalKPICards } from '@/components/GlobalKPICards'
import { DashboardBuilderDownload } from '@/components/DashboardBuilderDownload'
import { getChartsForGroup } from '@/lib/chart-groups'
import { Lightbulb, X, Layers, LayoutGrid, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'
import Image from 'next/image'

type ActiveTab =
  | 'bar'
  | 'line'
  | 'heatmap'
  | 'table'
  | 'waterfall'
  | 'bubble'
  | 'competitive-intelligence'
  | 'customer-intelligence'
  | 'distributor-intelligence'
  | 'pricing-bar'
  | 'pricing-line'
  | 'pricing-heatmap'
  | 'pricing-table'

interface Props {
  /** When true the "Dashboard Builder" button in the header is hidden (read-only shared view). */
  readOnly?: boolean
}

export function DashboardShell({ readOnly = false }: Props) {
  const router = useRouter()
  const {
    data,
    filters,
    selectedChartGroup,
    dashboardName,
    rawIntelligenceData,
    proposition2Data,
    proposition3Data,
    distributorRawIntelligenceData,
    distributorProposition2Data,
    distributorProposition3Data,
    intelligenceType,
    pricingAnalysisData,
    showDemoNote,
  } = useDashboardStore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('bar')
  const [showInsights, setShowInsights] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'tabs' | 'vertical'>('tabs')
  const sidebarScrollRef = useRef<HTMLDivElement>(null)

  const hasMarketData = !!data
  const hasCustomerWorkbook = !!(
    rawIntelligenceData?.rows?.length ||
    proposition2Data?.rows?.length ||
    proposition3Data?.rows?.length
  )
  const hasDistributorWorkbook = !!(
    distributorRawIntelligenceData?.rows?.length ||
    distributorProposition2Data?.rows?.length ||
    distributorProposition3Data?.rows?.length
  )

  const visibleCharts = getChartsForGroup(selectedChartGroup)

  const isChartVisible = (chartId: string): boolean => {
    if (
      !hasMarketData &&
      chartId !== 'customer-intelligence' &&
      chartId !== 'distributor-intelligence'
    ) {
      return false
    }
    return visibleCharts.includes(chartId)
  }

  const chartIdToTab: Record<string, ActiveTab> = {
    'grouped-bar': 'bar',
    'multi-line': 'line',
    heatmap: 'heatmap',
    'comparison-table': 'table',
    waterfall: 'waterfall',
    bubble: 'bubble',
    'competitive-intelligence': 'competitive-intelligence',
    'customer-intelligence': 'customer-intelligence',
    'distributor-intelligence': 'distributor-intelligence',
    'pricing-grouped-bar': 'pricing-bar',
    'pricing-multi-line': 'pricing-line',
    'pricing-heatmap': 'pricing-heatmap',
    'pricing-comparison-table': 'pricing-table',
  }

  useEffect(() => {
    if (!hasMarketData && hasCustomerWorkbook) {
      setActiveTab('customer-intelligence')
      return
    }
    const first = visibleCharts[0]
    if (first && chartIdToTab[first]) setActiveTab(chartIdToTab[first])
  }, [selectedChartGroup, hasMarketData, hasCustomerWorkbook])

  useEffect(() => {
    if (filters.viewMode === 'matrix' && isChartVisible('heatmap')) {
      setActiveTab('heatmap')
    }
  }, [filters.viewMode])

  // ── Intelligence-only mode ──────────────────────────────────────────────
  if (!hasMarketData && (hasCustomerWorkbook || hasDistributorWorkbook)) {
    const typeLabel =
      intelligenceType === 'distributor'
        ? 'Distributor'
        : intelligenceType === 'both'
        ? 'Customer & Distributor'
        : 'Customer'

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="container mx-auto px-6 py-6 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <Image src="/logo.png" alt="Coherent Market Insights Logo" width={150} height={60} unoptimized className="h-auto w-auto max-w-[150px]" priority />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-black mb-1">Coherent Dashboard</h1>
                <h2 className="text-sm text-black">{dashboardName || `${typeLabel} Intelligence`}</h2>
              </div>
            </div>
            <div className="flex-shrink-0">
              {!readOnly && (
                <button
                  onClick={() => router.push('/dashboard-builder')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Dashboard Builder</span>
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <IntelligenceDatabaseViews />
          </div>
        </div>
        <DashboardBuilderDownload />
        <Footer />
      </div>
    )
  }

  // ── Full dashboard ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-6 py-6 flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <Image src="/logo.png" alt="Coherent Market Insights Logo" width={150} height={60} unoptimized className="h-auto w-auto max-w-[150px]" priority />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black mb-1">Coherent Dashboard</h1>
              <h2 className="text-sm text-black">{dashboardName || ' Market Analysis'}</h2>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center">
            {!readOnly && (
              <button
                onClick={() => router.push('/dashboard-builder')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                title="Open Dashboard Builder to upload Excel/CSV files"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard Builder</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6">
          <GlobalKPICards />
          {showDemoNote && (
            <div className="mt-3 mx-1 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-800">
                <span className="font-semibold">NOTE:</span> All the data in the dashboard is demo data. No real world data is related to this.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className={`transition-all duration-300 ${sidebarCollapsed ? 'col-span-12 lg:col-span-1' : 'col-span-12 lg:col-span-3'}`}>
            {sidebarCollapsed ? (
              <div className="sticky top-6">
                <div className="bg-white rounded-lg shadow-sm p-2 space-y-4">
                  <button
                    onClick={() => { setShowInsights(false); setSidebarCollapsed(false) }}
                    className="w-full flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded"
                    title="Expand Filters"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs text-black">Filters</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="sticky top-6 self-start">
                <div className="max-h-[calc(100vh-6rem)] relative">
                  <CustomScrollbar containerRef={sidebarScrollRef}>
                    <div ref={sidebarScrollRef} className="overflow-y-auto pr-6 space-y-3 sidebar-scroll max-h-[calc(100vh-6rem)]">
                      <ChartGroupSelector />
                      <FilterPresets />
                      <EnhancedFilterPanel />
                    </div>
                  </CustomScrollbar>
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className={`transition-all duration-300 ${
            sidebarCollapsed
              ? showInsights ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:col-span-11'
              : showInsights ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'
          } space-y-6`}>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <nav className="flex items-center -mb-px">
                    <div className="flex gap-1 mr-4 ml-4 py-2">
                      <button onClick={() => setViewMode('tabs')} className={`p-1.5 rounded ${viewMode === 'tabs' ? 'bg-blue-100 text-blue-600' : 'text-black hover:text-black'}`} title="Tab View">
                        <Layers className="h-4 w-4" />
                      </button>
                      <button onClick={() => setViewMode('vertical')} className={`p-1.5 rounded ${viewMode === 'vertical' ? 'bg-blue-100 text-blue-600' : 'text-black hover:text-black'}`} title="Vertical View (All Charts)">
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>

                    {viewMode === 'tabs' && (
                      <>
                        {isChartVisible('grouped-bar') && <button onClick={() => setActiveTab('bar')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Grouped Bar Chart</button>}
                        {isChartVisible('multi-line') && <button onClick={() => setActiveTab('line')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'line' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Line Chart</button>}
                        {isChartVisible('heatmap') && <button onClick={() => setActiveTab('heatmap')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'heatmap' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Heatmap</button>}
                        {isChartVisible('comparison-table') && <button onClick={() => setActiveTab('table')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'table' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Table</button>}
                        {isChartVisible('waterfall') && <button onClick={() => setActiveTab('waterfall')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'waterfall' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Waterfall</button>}
                        {isChartVisible('bubble') && <button onClick={() => setActiveTab('bubble')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bubble' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Bubble Chart</button>}
                        {isChartVisible('customer-intelligence') && <button onClick={() => setActiveTab('customer-intelligence')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'customer-intelligence' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Customer Intelligence</button>}
                        {isChartVisible('distributor-intelligence') && <button onClick={() => setActiveTab('distributor-intelligence')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'distributor-intelligence' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Distributor Intelligence</button>}
                        {isChartVisible('pricing-grouped-bar') && <button onClick={() => setActiveTab('pricing-bar')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing-bar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Pricing Bar</button>}
                        {isChartVisible('pricing-multi-line') && <button onClick={() => setActiveTab('pricing-line')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing-line' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Pricing Line</button>}
                        {isChartVisible('pricing-heatmap') && <button onClick={() => setActiveTab('pricing-heatmap')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing-heatmap' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Pricing Heatmap</button>}
                        {isChartVisible('pricing-comparison-table') && <button onClick={() => setActiveTab('pricing-table')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing-table' ? 'border-blue-500 text-blue-600' : 'border-transparent text-black hover:text-black hover:border-gray-300'}`}>Pricing Table</button>}
                      </>
                    )}
                  </nav>

                  <div className="flex gap-2 px-4">
                    <button
                      onClick={() => { setShowInsights(!showInsights); setSidebarCollapsed(!showInsights) }}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${showInsights ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'text-black hover:text-black hover:bg-gray-100'}`}
                    >
                      <Lightbulb className="h-4 w-4" />
                      Insights
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {viewMode === 'tabs' ? (
                  <>
                    {activeTab === 'bar' && <div id="grouped-bar-chart"><GroupedBarChart title="Comparative Analysis - Grouped Bars" height={450} /></div>}
                    {activeTab === 'line' && <div id="line-chart"><MultiLineChart title="Trend Analysis - Multiple Series" height={450} /></div>}
                    {activeTab === 'heatmap' && <div id="heatmap-chart"><MatrixHeatmap title="Matrix View - Geography x Segment" height={450} /></div>}
                    {activeTab === 'table' && <div id="comparison-table"><ComparisonTable title="Data Comparison Table" height={500} /></div>}
                    {activeTab === 'waterfall' && <div id="waterfall-chart"><WaterfallChart title="Contribution Analysis - Waterfall Chart" height={450} /></div>}
                    {activeTab === 'bubble' && <div id="bubble-chart"><D3BubbleChartIndependent title="Coherent Opportunity Matrix" height={500} /></div>}
                    {activeTab === 'competitive-intelligence' && <div id="competitive-intelligence-chart"><CompetitiveIntelligence height={600} /></div>}
                    {activeTab === 'customer-intelligence' && (
                      <div id="customer-intelligence-chart">
                        <IntelligenceDatabaseViews preferredSource="customer" />
                      </div>
                    )}
                    {activeTab === 'distributor-intelligence' && (
                      <div id="distributor-intelligence-chart">
                        <IntelligenceDatabaseViews preferredSource="distributor" />
                      </div>
                    )}
                    {activeTab === 'pricing-bar' && <div id="pricing-bar-chart"><PricingAnalysisView activeTab="bar" /></div>}
                    {activeTab === 'pricing-line' && <div id="pricing-line-chart"><PricingAnalysisView activeTab="line" /></div>}
                    {activeTab === 'pricing-heatmap' && <div id="pricing-heatmap-chart"><PricingAnalysisView activeTab="heatmap" /></div>}
                    {activeTab === 'pricing-table' && <div id="pricing-table-chart"><PricingAnalysisView activeTab="table" /></div>}
                  </>
                ) : (
                  <div className="space-y-8">
                    {isChartVisible('grouped-bar') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Grouped Bar Chart</h3><GroupedBarChart title="Comparative Analysis - Grouped Bars" height={400} /></div>}
                    {isChartVisible('multi-line') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Line Chart</h3><MultiLineChart title="Trend Analysis - Multiple Series" height={400} /></div>}
                    {isChartVisible('heatmap') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Heatmap</h3><MatrixHeatmap title="Matrix View - Geography x Segment" height={400} /></div>}
                    {isChartVisible('comparison-table') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Data Table</h3><ComparisonTable title="Data Comparison Table" height={400} /></div>}
                    {isChartVisible('waterfall') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Waterfall Chart</h3><WaterfallChart title="Contribution Analysis - Waterfall Chart" height={400} /></div>}
                    {isChartVisible('bubble') && <div className="border-b pb-8"><h3 className="text-lg font-semibold text-black mb-4">Bubble Chart</h3><D3BubbleChartIndependent title="Coherent Opportunity Matrix" height={450} /></div>}
                    {isChartVisible('competitive-intelligence') && <div className="border-b pb-8"><CompetitiveIntelligence height={600} /></div>}
                    {(isChartVisible('customer-intelligence') ||
                      isChartVisible('distributor-intelligence')) && (
                      <div className="border-b pb-8">
                        <IntelligenceDatabaseViews />
                      </div>
                    )}
                    {isChartVisible('pricing-grouped-bar') && <div className="border-b pb-8"><PricingAnalysisView activeTab="bar" /></div>}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Insights Panel */}
          {showInsights && (
            <aside className="col-span-12 lg:col-span-3 transition-all duration-300">
              <div className="sticky top-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Key Insights
                      </h2>
                      <button onClick={() => { setShowInsights(false); setSidebarCollapsed(false) }} className="rounded-md text-black hover:text-black focus:outline-none">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-black mt-1">Auto-generated analysis</p>
                  </div>
                  <div className="px-4 py-3 overflow-y-auto sidebar-scroll" style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto', minHeight: 'auto' }} id="insights-panel">
                    <InsightsPanel />
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <DashboardBuilderDownload />
      <Footer />
    </div>
  )
}
