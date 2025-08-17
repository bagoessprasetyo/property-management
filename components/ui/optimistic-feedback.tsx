'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimisticFeedbackProps {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  error?: Error | null
  successMessage?: string
  className?: string
  showDuration?: number
  onDismiss?: () => void
}

export function OptimisticFeedback({
  isLoading = false,
  isSuccess = false,
  isError = false,
  error = null,
  successMessage = 'Berhasil disimpan',
  className,
  showDuration = 3000,
  onDismiss
}: OptimisticFeedbackProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isLoading || isSuccess || isError) {
      setVisible(true)
      setDismissed(false)
    }

    if (isSuccess && showDuration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, showDuration)

      return () => clearTimeout(timer)
    }
  }, [isLoading, isSuccess, isError, showDuration, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    onDismiss?.()
  }

  if (!visible || dismissed) return null

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-right-full',
        {
          'bg-blue-50/90 text-blue-700 border border-blue-200': isLoading,
          'bg-green-50/90 text-green-700 border border-green-200': isSuccess,
          'bg-red-50/90 text-red-700 border border-red-200': isError,
        },
        className
      )}
      role="alert"
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isSuccess && <CheckCircle className="w-4 h-4" />}
      {isError && <AlertCircle className="w-4 h-4" />}
      
      <span className="text-sm font-medium">
        {isLoading && 'Menyimpan...'}
        {isSuccess && successMessage}
        {isError && (error?.message || 'Terjadi kesalahan')}
      </span>

      {(isSuccess || isError) && (
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Tutup notifikasi"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/**
 * Hook for managing optimistic feedback state
 */
export function useOptimisticFeedback() {
  const [feedback, setFeedback] = useState({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null as Error | null,
    successMessage: 'Berhasil disimpan'
  })

  const showLoading = (message?: string) => {
    setFeedback({
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      successMessage: message || 'Berhasil disimpan'
    })
  }

  const showSuccess = (message?: string) => {
    setFeedback({
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      successMessage: message || 'Berhasil disimpan'
    })
  }

  const showError = (error: Error | string) => {
    setFeedback({
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: typeof error === 'string' ? new Error(error) : error,
      successMessage: 'Berhasil disimpan'
    })
  }

  const clear = () => {
    setFeedback({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      successMessage: 'Berhasil disimpan'
    })
  }

  return {
    ...feedback,
    showLoading,
    showSuccess,
    showError,
    clear
  }
}

/**
 * Skeleton loading component for optimistic UI
 */
export function OptimisticSkeleton({ 
  className,
  children,
  isLoading = false
}: { 
  className?: string
  children: React.ReactNode
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 rounded h-4 w-full"></div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Button with optimistic loading state
 */
export function OptimisticButton({
  children,
  isLoading = false,
  isSuccess = false,
  disabled,
  className,
  successIcon = <CheckCircle className="w-4 h-4" />,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
  isSuccess?: boolean
  successIcon?: React.ReactNode
}) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
        'bg-warm-brown-600 hover:bg-warm-brown-700 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-green-600 hover:bg-green-600': isSuccess,
        },
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isSuccess && successIcon}
      {!isLoading && !isSuccess && children}
      {isLoading && 'Menyimpan...'}
      {isSuccess && 'Tersimpan!'}
    </button>
  )
}