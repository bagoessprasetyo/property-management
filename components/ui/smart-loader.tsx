'use client'

import { useState, useEffect } from 'react'
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

interface SmartLoaderProps {
  isLoading?: boolean
  hasError?: boolean
  error?: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  errorMessage?: string
  retryFn?: () => void
  className?: string
  children?: React.ReactNode
  loadingMessage?: string
  showNetworkStatus?: boolean
}

export function SmartLoader({
  isLoading = false,
  hasError = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'Tidak ada data tersedia',
  errorMessage,
  retryFn,
  className,
  children,
  loadingMessage = 'Memuat data...',
  showNetworkStatus = true
}: SmartLoaderProps) {
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')
  const [retryCount, setRetryCount] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    if (retryFn) {
      retryFn()
    } else {
      // Fallback: invalidate all queries
      queryClient.invalidateQueries()
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-warm-brown-600" />
          {showNetworkStatus && networkStatus === 'offline' && (
            <WifiOff className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
          )}
        </div>
        
        <p className="mt-4 text-sm text-gray-600">{loadingMessage}</p>
        
        {showNetworkStatus && networkStatus === 'offline' && (
          <p className="mt-2 text-xs text-red-600">
            Koneksi internet terputus
          </p>
        )}
        
        {retryCount > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Percobaan ke-{retryCount + 1}
          </p>
        )}
      </div>
    )
  }

  // Error state
  if (hasError) {
    const displayError = errorMessage || error?.message || 'Terjadi kesalahan saat memuat data'
    
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          {networkStatus === 'offline' ? (
            <WifiOff className="w-6 h-6 text-red-600" />
          ) : (
            <RefreshCw className="w-6 h-6 text-red-600" />
          )}
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {networkStatus === 'offline' ? 'Tidak Ada Koneksi' : 'Gagal Memuat Data'}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 max-w-md">
          {networkStatus === 'offline' 
            ? 'Periksa koneksi internet Anda dan coba lagi'
            : displayError
          }
        </p>
        
        {retryFn && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-warm-brown-600 text-white rounded-md hover:bg-warm-brown-700 transition-colors"
            disabled={networkStatus === 'offline'}
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        )}
        
        {retryCount > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Telah dicoba {retryCount} kali
          </p>
        )}
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <div className="w-6 h-6 rounded bg-gray-300"></div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h3>
        <p className="text-sm text-gray-600 max-w-md">{emptyMessage}</p>
      </div>
    )
  }

  // Success state - render children
  return <>{children}</>
}

/**
 * Skeleton loader for list items during optimistic updates
 */
export function SkeletonList({ 
  count = 3, 
  className,
  itemHeight = 'h-16'
}: { 
  count?: number
  className?: string
  itemHeight?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn('animate-pulse bg-gray-100 rounded-lg', itemHeight)}>
          <div className="flex items-center p-4 space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Card skeleton for dashboard widgets
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-white border rounded-lg p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  )
}

/**
 * Table skeleton for data tables
 */
export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-100 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Network status indicator
 */
export function NetworkStatusIndicator({ className }: { className?: string }) {
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online')
      setShowOfflineMessage(false)
    }
    
    const handleOffline = () => {
      setNetworkStatus('offline')
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (networkStatus === 'online' && !showOfflineMessage) return null

  return (
    <div className={cn(
      'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300',
      {
        'bg-red-50 text-red-700 border border-red-200': networkStatus === 'offline',
        'bg-green-50 text-green-700 border border-green-200': networkStatus === 'online' && showOfflineMessage,
      },
      className
    )}>
      {networkStatus === 'offline' ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Tidak ada koneksi</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Koneksi pulih</span>
        </>
      )}
    </div>
  )
}