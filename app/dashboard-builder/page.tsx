'use client'

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, Eye, Users, Building2, ArrowRight, TrendingUp, DollarSign, LayoutList } from 'lucide-react'
import Image from 'next/image'
import { useDashboardStore } from '@/lib/store'
import type { ComparisonData } from '@/lib/types'
import { IntelligenceDataInput, type IntelligenceMode } from '@/components/dashboard-builder/IntelligenceDataInput'
import { postDashboardSave } from '@/lib/share-upload'
import { AuthStatus } from '@/components/AuthStatus'
import { PreviousDashboards } from '@/components/PreviousDashboards'

function modeToStoreType(m: IntelligenceMode): 'customer' | 'distributor' | 'both' | null {
  if (m.customer && m.distributor) return 'both'
  if (m.customer) return 'customer'
  if (m.distributor) return 'distributor'
  return null
}

export default function DashboardBuilderPage() {
  const router = useRouter()
  const { 
    setData, 
    setLoading, 
    setError, 
    clearData,
    setIntelligenceType,
    setParentHeaders,
    setRawIntelligenceData,
    setProposition2Data,
    setProposition3Data,
    setDistributorRawIntelligenceData,
    setDistributorProposition2Data,
    setDistributorProposition3Data,
    setCompetitiveIntelligenceData,
    setPricingAnalysisData,
    setDashboardName,
    setCurrency,
    setShowDemoNote,
    setDashboardId,
    dashboardName: storedDashboardName,
  } = useDashboardStore()
  
  // Section 1: Market Intelligence
  const [dashboardNameInput, setDashboardNameInput] = useState('India Market Analysis')
  const [currencyInput, setCurrencyInput] = useState<'USD' | 'INR'>('USD')
  const [volumeUnitInput, setVolumeUnitInput] = useState<
    'million-units' | 'units' | 'th-units' | 'tons'
  >('units')
  const [valueFile, setValueFile] = useState<File | null>(null)
  const [volumeFile, setVolumeFile] = useState<File | null>(null)
  const [crossValueFile, setCrossValueFile] = useState<File | null>(null)
  const [crossVolumeFile, setCrossVolumeFile] = useState<File | null>(null)
  const [isProcessingMarket, setIsProcessingMarket] = useState(false)
  const [marketStatus, setMarketStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [marketStatusMessage, setMarketStatusMessage] = useState('')
  const [processedData, setProcessedData] = useState<ComparisonData | null>(null)
  const [showDemoNoteToggle, setShowDemoNoteToggle] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareLinkError, setShareLinkError] = useState<string | null>(null)
  
  // Section 2: Intelligence Data (Optional)
  const [intelMode, setIntelMode] = useState<IntelligenceMode>({ customer: true, distributor: false })
  const [customerIntelFile, setCustomerIntelFile] = useState<File | null>(null)
  const [customerIntelFileData, setCustomerIntelFileData] = useState<{ name: string; data: string } | null>(null)
  const [distributorIntelFile, setDistributorIntelFile] = useState<File | null>(null)
  const [distributorIntelFileData, setDistributorIntelFileData] = useState<{ name: string; data: string } | null>(null)
  const [intelProcessing, setIntelProcessing] = useState<null | 'customer' | 'distributor'>(null)
  const [customerIntelStatus, setCustomerIntelStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [customerIntelStatusMessage, setCustomerIntelStatusMessage] = useState('')
  const [distributorIntelStatus, setDistributorIntelStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [distributorIntelStatusMessage, setDistributorIntelStatusMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'market' | 'intelligence' | 'competitive' | 'pricing' | 'previous'>('market')

  useEffect(() => {
    setIntelligenceType(modeToStoreType(intelMode))
  }, [intelMode, setIntelligenceType])

  const [isDraggingCustomerIntel, setIsDraggingCustomerIntel] = useState(false)
  const [isDraggingDistributorIntel, setIsDraggingDistributorIntel] = useState(false)

  // Section 3: Competitive Intelligence Data
  const [competitiveFile, setCompetitiveFile] = useState<File | null>(null)
  const [isProcessingCompetitive, setIsProcessingCompetitive] = useState(false)
  const [competitiveStatus, setCompetitiveStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [competitiveStatusMessage, setCompetitiveStatusMessage] = useState('')

  // Section 4: Pricing Analysis Data
  const [pricingFile, setPricingFile] = useState<File | null>(null)
  const [isProcessingPricing, setIsProcessingPricing] = useState(false)
  const [pricingStatus, setPricingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [pricingStatusMessage, setPricingStatusMessage] = useState('')

  const handleValueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValueFile(e.target.files[0])
      setMarketStatus('idle')
      setMarketStatusMessage('')
      setProcessedData(null)
    }
  }

  const handleVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVolumeFile(e.target.files[0])
    }
  }

  const handleCrossValueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCrossValueFile(e.target.files[0])
    }
  }

  const handleCrossVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCrossVolumeFile(e.target.files[0])
    }
  }

  const readIntelFileToState = (
    file: File,
    setFile: Dispatch<SetStateAction<File | null>>,
    setFileData: Dispatch<SetStateAction<{ name: string; data: string } | null>>,
    setStatus: Dispatch<SetStateAction<'idle' | 'processing' | 'success' | 'error'>>,
    setStatusMessage: Dispatch<SetStateAction<string>>
  ) => {
    setFile(file)
    setStatus('idle')
    setStatusMessage('Reading file...')

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setFileData({ name: file.name, data: base64 })
            setStatusMessage('')
            console.log('Intelligence file read successfully:', file.name, 'base64 length:', base64.length)
          } else {
            throw new Error('Failed to extract base64 data')
          }
        } else {
          throw new Error('FileReader returned empty result')
        }
      } catch (error: any) {
        console.error('Error processing file:', error)
        setStatus('error')
        setStatusMessage(`Error reading file: ${error.message}`)
        setFileData(null)
      }
    }

    reader.onerror = () => {
      console.error('FileReader error:', reader.error)
      setStatus('error')
      const errorMsg = reader.error?.message || 'Unknown error'
      if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
        setStatusMessage('File cannot be read due to Windows permissions. Please copy the file to your Documents folder and try again.')
      } else {
        setStatusMessage(`Error reading file: ${errorMsg}`)
      }
      setFileData(null)
    }

    reader.readAsDataURL(file)
  }

  const handleCustomerIntelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      readIntelFileToState(f, setCustomerIntelFile, setCustomerIntelFileData, setCustomerIntelStatus, setCustomerIntelStatusMessage)
    }
  }

  const handleDistributorIntelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      readIntelFileToState(
        f,
        setDistributorIntelFile,
        setDistributorIntelFileData,
        setDistributorIntelStatus,
        setDistributorIntelStatusMessage
      )
    }
  }

  const handleCompetitiveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompetitiveFile(e.target.files[0])
      setCompetitiveStatus('idle')
      setCompetitiveStatusMessage('')
    }
  }

  // Drag and drop handlers - these often have different permission handling
  const processDroppedFile = (
    file: File,
    setFile: (f: File) => void,
    setFileData: (d: { name: string; data: string } | null) => void,
    setStatus: (s: 'idle' | 'processing' | 'success' | 'error') => void,
    setStatusMessage: (m: string) => void
  ) => {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValid = validTypes.some(type => fileName.endsWith(type))

    if (!isValid) {
      setStatus('error')
      setStatusMessage('Invalid file type. Please upload CSV, XLSX, or XLS files.')
      return
    }

    setFile(file)
    setStatus('idle')
    setStatusMessage('Reading dropped file...')

    // Read the file immediately using FileReader
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setFileData({ name: file.name, data: base64 })
            setStatusMessage('File ready for upload!')
            console.log('Dropped file read successfully:', file.name, 'base64 length:', base64.length)
          } else {
            throw new Error('Failed to extract base64 data')
          }
        } else {
          throw new Error('FileReader returned empty result')
        }
      } catch (error: any) {
        console.error('Error processing dropped file:', error)
        setStatus('error')
        setStatusMessage(`Error reading file: ${error.message}`)
        setFileData(null)
      }
    }

    reader.onerror = () => {
      console.error('FileReader error for dropped file:', reader.error)
      setStatus('error')
      const errorMsg = reader.error?.message || 'Unknown error'
      if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
        setStatusMessage('File cannot be read. Try copying the file to a different folder (e.g., Documents) first.')
      } else {
        setStatusMessage(`Error reading file: ${errorMsg}`)
      }
      setFileData(null)
    }

    reader.readAsDataURL(file)
  }

  // Intelligence file drop handlers
  const handleCustomerIntelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingCustomerIntel(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFile(
        files[0],
        setCustomerIntelFile,
        setCustomerIntelFileData,
        setCustomerIntelStatus,
        setCustomerIntelStatusMessage
      )
    }
  }

  const handleDistributorIntelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingDistributorIntel(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFile(
        files[0],
        setDistributorIntelFile,
        setDistributorIntelFileData,
        setDistributorIntelStatus,
        setDistributorIntelStatusMessage
      )
    }
  }

  // Generic drag event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  // Generate a shareable permanent link for the current dashboard
  const handleGenerateLink = async () => {
    const storeState = useDashboardStore.getState()
    const {
      data,
      dashboardName: name,
      currency,
      intelligenceType,
      rawIntelligenceData,
      proposition2Data,
      proposition3Data,
      distributorRawIntelligenceData,
      distributorProposition2Data,
      distributorProposition3Data,
      pricingAnalysisData,
      showDemoNote,
    } = storeState

    if (!data && !rawIntelligenceData && !pricingAnalysisData) {
      setShareLinkError('Please process your dashboard data first before generating a link.')
      return
    }

    setIsGeneratingLink(true)
    setShareLinkError(null)

    try {
      const { dashboardId: existingDashboardId } = useDashboardStore.getState()
      const payload = {
        name: name || dashboardNameInput || 'Untitled Dashboard',
        currency: currency || currencyInput,
        dashboardId: existingDashboardId ?? undefined,
        data,
        intelligenceType,
        rawIntelligenceData,
        proposition2Data,
        proposition3Data,
        distributorRawIntelligenceData,
        distributorProposition2Data,
        distributorProposition3Data,
        pricingAnalysisData,
        showDemoNote,
      }

      const serialised = JSON.stringify(payload)
      if (serialised.length > 48 * 1024 * 1024) {
        setShareLinkError(`Dashboard data is too large (~${(serialised.length / 1_048_576).toFixed(0)} MB). Try reducing segments or geographies.`)
        return
      }

      const res = await postDashboardSave(payload)

      let body: any
      try { body = await res.json() } catch { body = {} }

      if (res.status === 401) {
        setShareLinkError('Your session expired. Please sign in again to generate a link.')
        return
      }
      if (!res.ok) {
        throw new Error(body?.error || `Server error (${res.status})`)
      }

      setShareUrl(body.shareUrl)
      // accessCode is only returned for newly-created dashboards. Capture it so
      // the builder can copy it now — it's never retrievable again.
      if (body.accessCode && typeof body.accessCode === 'string') {
        setAccessCode(body.accessCode)
      }
      if (body.id && typeof body.id === 'string') {
        setDashboardId(body.id)
      }
    } catch (err) {
      setShareLinkError(err instanceof Error ? err.message : 'Could not generate link – please try again.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      const el = document.createElement('input')
      el.value = shareUrl
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    }
  }

  // Process Market Intelligence Data
  const handleProcessMarketIntelligence = async () => {
    if (!valueFile) {
      setMarketStatus('error')
      setMarketStatusMessage('Please upload a value file (CSV or Excel)')
      return
    }

    setIsProcessingMarket(true)
    setMarketStatus('processing')
    setMarketStatusMessage('Processing files and generating dashboard preview...')

    try {
      const formData = new FormData()
      formData.append('valueFile', valueFile)
      if (volumeFile) {
        formData.append('volumeFile', volumeFile)
      }
      formData.append('volumeUnit', volumeUnitInput)
      if (crossValueFile) {
        formData.append('crossValueFile', crossValueFile)
      }
      if (crossVolumeFile) {
        formData.append('crossVolumeFile', crossVolumeFile)
      }

      const response = await fetch('/api/process-excel', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to process files')
      }

      const raw = await response.json()
      const { _ingestMetrics, _dashboardId, ...data } = raw as ComparisonData & {
        _ingestMetrics?: Record<string, number>
        _dashboardId?: string
      }
      if (_ingestMetrics) {
        console.log('[process-excel] server metrics:', _ingestMetrics)
      }

      // Clear old data and set new data
      clearData()
      setData(data)
      setLoading(false)
      setError(null)

      // Store the MongoDB dashboard ID so Generate Link doesn't need to re-upload
      if (_dashboardId) {
        setDashboardId(_dashboardId)
      }
      
      // Store dashboard name and currency
      setDashboardName(dashboardNameInput || 'India Market Analysis')
      setCurrency(currencyInput)
      
      // Store processed data
      setProcessedData(data)
      
      // Store context in the store
      const { setDashboardBuilderContext } = useDashboardStore.getState()
      setDashboardBuilderContext({
        valueFile,
        volumeFile,
        projectName: dashboardNameInput || 'market-dashboard'
      })
      
      setMarketStatus('success')
      setMarketStatusMessage('Market intelligence data processed successfully!')
    } catch (error) {
      console.error('Error processing files:', error)
      setMarketStatus('error')
      setMarketStatusMessage(
        error instanceof Error ? error.message : 'An error occurred while processing the files'
      )
    } finally {
      setIsProcessingMarket(false)
    }
  }

  // Helper function to read file as base64 using arrayBuffer (more reliable on Windows)
  const readFileAsBase64 = async (file: File): Promise<string> => {
    // Validate file first
    if (!file) {
      throw new Error('No file provided')
    }
    if (file.size === 0) {
      throw new Error('File is empty')
    }

    console.log('Reading file:', file.name, 'Size:', file.size, 'Type:', file.type)

    try {
      // Use arrayBuffer() which is more reliable than FileReader on Windows
      const arrayBuffer = await file.arrayBuffer()

      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize)
        binary += String.fromCharCode.apply(null, Array.from(chunk))
      }
      const base64 = btoa(binary)

      console.log('File read successfully, base64 length:', base64.length)
      return base64
    } catch (e: any) {
      console.error('Error reading file:', e)
      // Provide helpful error message
      if (e.name === 'NotReadableError') {
        throw new Error('File cannot be read. Please try: (1) Copy the file to your Documents folder, (2) Close Excel if it\'s open, (3) Try a different browser.')
      }
      throw new Error(`Failed to read file: ${e.message}`)
    }
  }

  // Helper function to upload pre-read file data
  const uploadFileData = async (url: string, fileData: { name: string; data: string }, intelligenceType: string): Promise<any> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileData.name,
        fileData: fileData.data,
        intelligenceType: intelligenceType,
        marketName:
          dashboardNameInput?.trim() ||
          storedDashboardName?.trim() ||
          'Global market',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`)
    }

    return response.json()
  }

  const applyIntelligenceApiResult = (
    result: any,
    target: 'customer' | 'distributor',
    onSuccessMessage: (msg: string) => void
  ) => {
    const setP1 = target === 'customer' ? setRawIntelligenceData : setDistributorRawIntelligenceData
    const setP2 = target === 'customer' ? setProposition2Data : setDistributorProposition2Data
    const setP3 = target === 'customer' ? setProposition3Data : setDistributorProposition3Data

    if (
      result.multiPropositionFramework &&
      result.proposition1 &&
      result.proposition2 &&
      result.proposition3
    ) {
      const p1 = result.proposition1
      const p2 = result.proposition2
      const p3 = result.proposition3

      setP1({
        headers: p1.headers || [],
        rows: p1.rows || [],
        parentHeaders: p1.parentHeaders ?? null,
      })
      setP2({
        headers: p2.headers || [],
        rows: p2.rows || [],
        parentHeaders: p2.parentHeaders ?? null,
      })
      setP3({
        headers: p3.headers || [],
        rows: p3.rows || [],
        parentHeaders: p3.parentHeaders ?? null,
      })
      setIntelligenceType(modeToStoreType(intelMode))
      onSuccessMessage(
        `Processed workbook: ${p1.rowCount} rows (${p1.sheetName}), ${p2.rowCount} rows (${p2.sheetName}), ${p3.rowCount} rows (${p3.sheetName})`
      )
      return
    }

    if (!result.data) {
      throw new Error('Invalid response from server')
    }

    const processedData = result.data

    setP1({
      headers: processedData.headers || [],
      rows: processedData.rows || [],
      parentHeaders: processedData.parentHeaders || null,
    })
    setP2(null)
    setP3(null)
    setIntelligenceType(modeToStoreType(intelMode))
    onSuccessMessage(
      `Processed ${processedData.rows?.length || 0} rows${processedData.sheetName ? ` from ${processedData.sheetName}` : ''}`
    )
  }

  const handleProcessIntelligenceForTarget = async (target: 'customer' | 'distributor') => {
    const fileData = target === 'customer' ? customerIntelFileData : distributorIntelFileData
    const setStatus = target === 'customer' ? setCustomerIntelStatus : setDistributorIntelStatus
    const setStatusMessage = target === 'customer' ? setCustomerIntelStatusMessage : setDistributorIntelStatusMessage

    if (!fileData) {
      setStatus('error')
      setStatusMessage(
        'Please select a file to upload. If you already selected a file, try selecting it again.'
      )
      return
    }

    setIntelProcessing(target)
    setStatus('processing')
    setStatusMessage('Uploading file...')

    try {
      if (target === 'customer') {
        setRawIntelligenceData(null)
        setProposition2Data(null)
        setProposition3Data(null)
      } else {
        setDistributorRawIntelligenceData(null)
        setDistributorProposition2Data(null)
        setDistributorProposition3Data(null)
      }

      const apiType = target === 'customer' ? 'customer' : 'distributor'

      const result = await uploadFileData('/api/process-intelligence-file', fileData, apiType)

      if (!result.success) {
        throw new Error('Invalid response from server')
      }

      applyIntelligenceApiResult(result, target, (msg) => {
        setStatus('success')
        setStatusMessage(msg)
      })
    } catch (error: any) {
      console.error('Error processing intelligence file:', error)
      setStatus('error')

      let errorMessage = 'Failed to process intelligence file'
      if (error.message) {
        errorMessage = error.message
      }

      if (errorMessage.includes('Network error') || errorMessage.includes('ERR_ACCESS_DENIED')) {
        errorMessage +=
          '\n\nTroubleshooting:\n• Make sure the file is not open in Excel\n• Try closing and reopening your browser\n• Check if antivirus is blocking the upload'
      }

      setStatusMessage(errorMessage)
    } finally {
      setIntelProcessing(null)
    }
  }

  // Process Competitive Intelligence Data
  const handleProcessCompetitiveIntelligence = async () => {
    if (!competitiveFile) {
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingCompetitive(true)
    setCompetitiveStatus('processing')
    setCompetitiveStatusMessage('Processing competitive intelligence file...')

    try {
      const formData = new FormData()
      formData.append('competitiveFile', competitiveFile)

      const response = await fetch('/api/process-competitive-intelligence', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const processedData = result.data
      
      // Store competitive intelligence data in the store
      setCompetitiveIntelligenceData({
        headers: processedData.headers || [],
        rows: processedData.rows || []
      })
      
      setCompetitiveStatus('success')
      setCompetitiveStatusMessage(`Processed ${processedData.rows?.length || 0} rows successfully`)
    } catch (error: any) {
      console.error('Error processing competitive intelligence file:', error)
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage(error.message || 'Failed to process competitive intelligence file')
    } finally {
      setIsProcessingCompetitive(false)
    }
  }

  // Process Pricing Analysis Data
  const handleProcessPricingAnalysis = async () => {
    if (!pricingFile) {
      setPricingStatus('error')
      setPricingStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingPricing(true)
    setPricingStatus('processing')
    setPricingStatusMessage('Processing pricing analysis file...')

    try {
      const formData = new FormData()
      formData.append('pricingFile', pricingFile)

      const response = await fetch('/api/process-pricing-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      // Store pricing analysis data in the store
      setPricingAnalysisData(result.data)

      setPricingStatus('success')
      const recordCount = result.data?.data?.value?.geography_segment_matrix?.length || 0
      const geoCount = result.data?.dimensions?.geographies?.all_geographies?.length || 0
      setPricingStatusMessage(`Processed ${recordCount} records across ${geoCount} geographies`)
    } catch (error: any) {
      console.error('Error processing pricing analysis file:', error)
      setPricingStatus('error')
      setPricingStatusMessage(error.message || 'Failed to process pricing analysis file')
    } finally {
      setIsProcessingPricing(false)
    }
  }

  const hadIntelligenceUploadSuccess =
    (intelMode.customer && customerIntelStatus === 'success') ||
    (intelMode.distributor && distributorIntelStatus === 'success')

  // Navigate to dashboard
  const handleViewDashboard = () => {
    // If only intelligence data was processed (no market data in this session),
    // clear any existing market data from the store to show intelligence-only view
    if (marketStatus !== 'success' && hadIntelligenceUploadSuccess) {
      console.log('Clearing market data for intelligence-only view')
      clearData() // This clears market data but keeps intelligence data
    }
    router.push('/')
  }

  const statusBlockClass = (status: 'idle' | 'processing' | 'success' | 'error') =>
    status === 'success'
      ? 'builder-status-success'
      : status === 'error'
        ? 'builder-status-error'
        : 'builder-status-warning'

  const renderIntelStatusBlock = (
    status: 'idle' | 'processing' | 'success' | 'error',
    message: string
  ) =>
    message ? (
      <div className={`p-4 rounded-xl flex items-start gap-3 ${statusBlockClass(status)}`}>
        {status === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : status === 'error' ? (
          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        ) : (
          <Loader2 className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5 animate-spin" />
        )}
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    ) : null

  return (
    <div className="builder-page relative flex min-h-screen flex-col overflow-hidden">
      <div className="landing-bg-stack" aria-hidden>
        <div className="landing-bg-noise" />
        <div className="landing-bg-aurora" />
        <div className="landing-bg-grid-dark" />
        <div className="landing-bg-vignette" />
      </div>

      <div className="builder-content">
        {/* Header */}
        <header className="builder-header">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push('/?home=1')}
                className="flex min-w-0 cursor-pointer items-center gap-4 rounded-lg text-left transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                title="Back to home"
              >
                <span className="shrink-0 rounded-lg bg-white px-3 py-2 shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="Coherent Market Insights"
                    width={200}
                    height={48}
                    unoptimized
                    className="h-8 w-auto max-w-[180px] object-contain sm:h-9"
                    priority
                  />
                </span>
                <div className="min-w-0 border-l border-white/10 pl-4">
                  <h1 className="text-xl font-bold text-white">Dashboard Builder</h1>
                  <p className="text-sm text-slate-400">
                    Configure your analytics workspace in three guided steps
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="builder-btn-ghost shrink-0"
                >
                  Back to Dashboard
                </button>
                <AuthStatus />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto flex-1 px-6 py-8">
          <div className="mx-auto max-w-5xl">
            {/* Tabs */}
            <div className="builder-tabs mb-6">
              <div className="flex border-b border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab('market')}
                  className={`builder-tab ${
                    activeTab === 'market' ? 'builder-tab-active' : 'builder-tab-inactive'
                  }`}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  1. Market Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('intelligence')}
                  className={`builder-tab ${
                    activeTab === 'intelligence' ? 'builder-tab-active' : 'builder-tab-inactive'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  2. Customer/Distributor Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className={`builder-tab ${
                    activeTab === 'pricing' ? 'builder-tab-active' : 'builder-tab-inactive'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  3. Pricing Analysis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('previous')}
                  className={`builder-tab ${
                    activeTab === 'previous' ? 'builder-tab-active' : 'builder-tab-inactive'
                  }`}
                >
                  <LayoutList className="h-5 w-5" />
                  Previous Dashboards
                </button>
              </div>
            </div>

          {/* Tab Content */}
          {activeTab === 'market' && (
          <div className="builder-card p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">1. Market Intelligence</h2>
                  <p className="text-sm text-slate-400">Upload your value and volume sheets to build the market analysis dashboard</p>
                </div>
                {/* Demo Note Toggle */}
                <div className="flex items-center gap-3 ml-6 flex-shrink-0">
                  <span className="text-sm text-slate-400 font-medium">Show Demo Note</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showDemoNoteToggle
                      setShowDemoNoteToggle(next)
                      setShowDemoNote(next)
                    }}
                    className={`builder-toggle focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      showDemoNoteToggle ? 'builder-toggle-on' : 'builder-toggle-off'
                    }`}
                    aria-pressed={showDemoNoteToggle}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        showDemoNoteToggle ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dashboard Name */}
              <div>
                <label htmlFor="dashboardName" className="block text-sm font-medium text-slate-200 mb-2">
                  Dashboard Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dashboardName"
                  value={dashboardNameInput}
                  onChange={(e) => setDashboardNameInput(e.target.value)}
                  className="builder-input"
                  placeholder="India Market Analysis"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This name will appear as the subtitle below "Coherent Dashboard"
                </p>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="USD"
                      checked={currencyInput === 'USD'}
                      onChange={() => setCurrencyInput('USD')}
                      className="builder-radio"
                    />
                    <span className="text-sm font-medium text-slate-200">USD ($)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="INR"
                      checked={currencyInput === 'INR'}
                      onChange={() => setCurrencyInput('INR')}
                      className="builder-radio"
                    />
                    <span className="text-sm font-medium text-slate-200">INR (₹)</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select the currency for displaying values throughout the dashboard
                </p>
              </div>

              {/* Value File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Value File (Required) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 builder-upload-zone">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="valueFile"
                        className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                      >
                        <span>Upload a file</span>
                        <input
                          id="valueFile"
                          name="valueFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleValueFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                    {valueFile && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ✓ {valueFile.name} ({(valueFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Volume File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Volume File (Optional)
                </label>
                <div className="mb-3">
                  <span className="block text-sm font-medium text-slate-200 mb-2">Volume units</span>
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="builder-radio"
                        checked={volumeUnitInput === 'million-units'}
                        onChange={() => setVolumeUnitInput('million-units')}
                      />
                      <span className="text-sm text-slate-200">Million units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="builder-radio"
                        checked={volumeUnitInput === 'units'}
                        onChange={() => setVolumeUnitInput('units')}
                      />
                      <span className="text-sm text-slate-200">Units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="builder-radio"
                        checked={volumeUnitInput === 'th-units'}
                        onChange={() => setVolumeUnitInput('th-units')}
                      />
                      <span className="text-sm text-slate-200">Th units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="builder-radio"
                        checked={volumeUnitInput === 'tons'}
                        onChange={() => setVolumeUnitInput('tons')}
                      />
                      <span className="text-sm text-slate-200">Tons</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Select how volume figures in your file should be labeled on charts and KPIs
                  </p>
                </div>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 builder-upload-zone">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="volumeFile"
                        className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                      >
                        <span>Upload a file</span>
                        <input
                          id="volumeFile"
                          name="volumeFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleVolumeFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                    {volumeFile && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ✓ {volumeFile.name} ({(volumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cross Value File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Cross Value File <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  CSV/Excel with columns: Region, Segment, Sub-segment, Sub-segment 1, [years…] — adds a cross-tabulated segment to the dashboard.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 builder-upload-zone">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="crossValueFile"
                        className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                      >
                        <span>Upload a file</span>
                        <input
                          id="crossValueFile"
                          name="crossValueFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCrossValueFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                    {crossValueFile && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ✓ {crossValueFile.name} ({(crossValueFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cross Volume File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Cross Volume File <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Same format as Cross Value but for volume data.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 builder-upload-zone">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="crossVolumeFile"
                        className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                      >
                        <span>Upload a file</span>
                        <input
                          id="crossVolumeFile"
                          name="crossVolumeFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCrossVolumeFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                    {crossVolumeFile && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ✓ {crossVolumeFile.name} ({(crossVolumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {marketStatusMessage && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${statusBlockClass(marketStatus)}`}>
                  {marketStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : marketStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-sm">{marketStatusMessage}</p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessMarketIntelligence}
                disabled={!valueFile || isProcessingMarket}
                className="builder-btn-primary"
              >
                {isProcessingMarket ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Files...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Process Market Intelligence Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'intelligence' && (
          <div className="builder-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">2. Intelligence Data Input</h2>
              <p className="text-sm text-slate-400">Add customer or distributor intelligence data to your dashboard</p>
            </div>

            <IntelligenceDataInput mode={intelMode} onModeChange={setIntelMode} />

            <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">Upload intelligence workbooks</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Each workbook may include three worksheets whose names contain{' '}
                  <span className="font-medium text-slate-200">Proposition 1</span>,{' '}
                  <span className="font-medium text-slate-200">Proposition 2</span>, and{' '}
                  <span className="font-medium text-slate-200">Proposition 3</span>. Basic, Advance, and Premium tables
                  map to those sheets. CSV or single-sheet Excel files use the first sheet as Proposition 1. When{' '}
                  <strong>both</strong> customer and distributor are enabled, upload <strong>two separate files</strong>{' '}
                  and process each one so parsers apply the correct column rules.
                </p>
              </div>

              {intelMode.customer && (
                <div className="builder-panel-nested space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-400/80" />
                    <h4 className="text-sm font-semibold text-slate-100">Customer intelligence workbook</h4>
                  </div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Customer workbook <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingCustomerIntel
                        ? 'builder-upload-zone-active'
                        : 'builder-upload-zone'
                    }`}
                    onDrop={handleCustomerIntelDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingCustomerIntel)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingCustomerIntel)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet
                        className={`mx-auto h-12 w-12 ${isDraggingCustomerIntel ? 'text-sky-400' : 'text-slate-500'}`}
                      />
                      <div className="flex text-sm text-slate-400">
                        <label
                          htmlFor="customerIntelFile"
                          className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                        >
                          <span>Upload a file</span>
                          <input
                            id="customerIntelFile"
                            name="customerIntelFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleCustomerIntelFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingCustomerIntel && (
                        <p className="text-sm text-sky-400 mt-2 font-medium">Drop file here!</p>
                      )}
                      {customerIntelFile && !isDraggingCustomerIntel && (
                        <p className="text-sm text-emerald-400 mt-2">
                          {customerIntelFileData ? '✓' : '⏳'} {customerIntelFile.name} (
                          {(customerIntelFile.size / 1024 / 1024).toFixed(2)} MB)
                          {customerIntelFileData && <span className="text-emerald-300 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderIntelStatusBlock(customerIntelStatus, customerIntelStatusMessage)}
                  <button
                    type="button"
                    onClick={() => handleProcessIntelligenceForTarget('customer')}
                    disabled={!customerIntelFileData || intelProcessing !== null}
                    className="builder-btn-primary"
                  >
                    {intelProcessing === 'customer' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Process Customer Intelligence Data
                      </>
                    )}
                  </button>
                </div>
              )}

              {intelMode.distributor && (
                <div className="builder-panel-nested space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-violet-400/80" />
                    <h4 className="text-sm font-semibold text-slate-100">Distributor intelligence workbook</h4>
                  </div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Distributor workbook <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingDistributorIntel
                        ? 'builder-upload-zone-active'
                        : 'builder-upload-zone'
                    }`}
                    onDrop={handleDistributorIntelDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingDistributorIntel)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingDistributorIntel)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet
                        className={`mx-auto h-12 w-12 ${isDraggingDistributorIntel ? 'text-sky-400' : 'text-slate-500'}`}
                      />
                      <div className="flex text-sm text-slate-400">
                        <label
                          htmlFor="distributorIntelFile"
                          className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                        >
                          <span>Upload a file</span>
                          <input
                            id="distributorIntelFile"
                            name="distributorIntelFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleDistributorIntelFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingDistributorIntel && (
                        <p className="text-sm text-sky-400 mt-2 font-medium">Drop file here!</p>
                      )}
                      {distributorIntelFile && !isDraggingDistributorIntel && (
                        <p className="text-sm text-emerald-400 mt-2">
                          {distributorIntelFileData ? '✓' : '⏳'} {distributorIntelFile.name} (
                          {(distributorIntelFile.size / 1024 / 1024).toFixed(2)} MB)
                          {distributorIntelFileData && <span className="text-emerald-300 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderIntelStatusBlock(distributorIntelStatus, distributorIntelStatusMessage)}
                  <button
                    type="button"
                    onClick={() => handleProcessIntelligenceForTarget('distributor')}
                    disabled={!distributorIntelFileData || intelProcessing !== null}
                    className="builder-btn-primary"
                  >
                    {intelProcessing === 'distributor' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Process Distributor Intelligence Data
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}

          {activeTab === 'pricing' && (
          <div className="builder-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">3. Pricing Analysis</h2>
              <p className="text-sm text-slate-400">Upload pricing analysis CSV/Excel file to display average selling price trends and analysis</p>
            </div>

            <div className="space-y-6">
              {/* Pricing Analysis File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Pricing Analysis File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 builder-upload-zone">
                  <div className="space-y-1 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="pricingFile"
                        className="builder-upload-link focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                      >
                        <span>Upload a file</span>
                        <input
                          id="pricingFile"
                          name="pricingFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPricingFile(e.target.files[0])
                              setPricingStatus('idle')
                              setPricingStatusMessage('')
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV, XLSX, or XLS up to 50MB</p>
                    {pricingFile && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ✓ {pricingFile.name} ({(pricingFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
                <div className="builder-callout-info mt-2">
                  <p>
                    <strong>Expected Format:</strong> The file should include columns: Region, Segment, Sub-segment, and year columns (e.g., 2020, 2021, 2022...) with pricing values. Similar structure to market value/volume data.
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {pricingStatusMessage && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${statusBlockClass(pricingStatus)}`}>
                  {pricingStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : pricingStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-sm">{pricingStatusMessage}</p>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcessPricingAnalysis}
                disabled={!pricingFile || isProcessingPricing}
                className="builder-btn-primary"
              >
                {isProcessingPricing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Pricing Analysis Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'previous' && <PreviousDashboards />}
        </div>

        {/* View Dashboard Button - Shows when any data is processed (hidden on Previous tab) */}
        {activeTab !== 'previous' && (marketStatus === 'success' || hadIntelligenceUploadSuccess || pricingStatus === 'success') && (
          <div className="mt-6 space-y-4">
            {/* View Dashboard */}
            <div className="builder-callout-ready">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-sky-300 mb-1">Ready to View Dashboard</h3>
                  <p className="text-sm text-slate-400">
                    {[
                      marketStatus === 'success' && 'Market',
                      hadIntelligenceUploadSuccess && 'Intelligence',
                      pricingStatus === 'success' && 'Pricing'
                    ].filter(Boolean).join(', ')} data processed. Open your workspace when you are ready.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleViewDashboard}
                  className="builder-btn-primary w-auto shrink-0 px-6"
                >
                  <Eye className="h-5 w-5" />
                  View Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Generate Shareable Link */}
            <div className="builder-callout-share">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generate Shareable Link
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Create a permanent link to share this dashboard with your client. The link works on any browser and never expires.
                  </p>

                  {shareLinkError && (
                    <div className="flex items-start gap-2 p-2.5 mb-3 builder-status-error rounded-lg">
                      <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs">{shareLinkError}</p>
                    </div>
                  )}

                  {shareUrl ? (
                    <div className="space-y-3">
                    {accessCode && (
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                        <p className="text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
                          🔒 Access code (share with the recipient — shown only once)
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-lg tracking-widest text-amber-100 bg-black/20 rounded px-3 py-1.5 select-all">
                            {accessCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(accessCode)}
                            className="builder-btn-ghost text-amber-200 border-amber-500/30 text-sm px-3 py-1.5"
                          >
                            Copy Code
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-200/70 mt-1.5">
                          The recipient must enter this code to open the link. Save it now — it can&apos;t be retrieved later.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="builder-input flex-1 min-w-[200px] font-mono text-sm select-all"
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          linkCopied
                            ? 'bg-emerald-600 text-white'
                            : 'builder-btn-ghost text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShareUrl(null); setAccessCode(null); setLinkCopied(false); setShareLinkError(null) }}
                        className="builder-btn-ghost text-emerald-300 border-emerald-500/30"
                        title="Generate a new link"
                      >
                        New Link
                      </button>
                    </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Dashboard…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Generate Shareable Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
