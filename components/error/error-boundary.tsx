'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    } else {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, you'd send this to your error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') // if available
      }

      // Example: send to your monitoring endpoint
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })

      console.log('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isChunkError = error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isNetworkError ? 'Masalah Koneksi' : 
             isChunkError ? 'Kesalahan Memuat' : 
             'Oops! Terjadi Kesalahan'}
          </CardTitle>
          <CardDescription className="text-lg">
            {isNetworkError ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' :
             isChunkError ? 'Aplikasi sedang diperbarui. Silakan muat ulang halaman.' :
             'Terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Detail Error (Development)
              </summary>
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <strong>Pesan:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Kembali ke Dashboard
            </Button>
            
            {isChunkError && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Jika masalah berlanjut, hubungi tim support atau{' '}
              <button 
                onClick={() => window.location.href = 'mailto:support@innsync.com'}
                className="text-warm-brown-600 hover:underline"
              >
                laporkan bug ini
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    // This will be caught by the nearest error boundary
    throw new Error(`${error.message}${errorInfo ? ` - ${errorInfo}` : ''}`)
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

/**
 * Error boundary specifically for async operations
 */
export function AsyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={resetError} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}