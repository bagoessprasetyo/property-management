'use client'

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  renderTime: number
  loadTime: number
  timestamp: number
}

/**
 * Hook to monitor component performance and track optimization effectiveness
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>()
  const mountTime = useRef<number>()

  useEffect(() => {
    // Track component mount time
    mountTime.current = performance.now()
    
    return () => {
      // Track component unmount and calculate total lifecycle time
      if (mountTime.current) {
        const totalTime = performance.now() - mountTime.current
        logPerformanceMetric(componentName, 'lifecycle', totalTime)
      }
    }
  }, [componentName])

  const startRender = () => {
    renderStartTime.current = performance.now()
  }

  const endRender = () => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current
      logPerformanceMetric(componentName, 'render', renderTime)
      renderStartTime.current = undefined
    }
  }

  return { startRender, endRender }
}

/**
 * Hook to monitor query performance and cache effectiveness
 */
export function useQueryPerformanceMonitor() {
  useEffect(() => {
    // Monitor React Query cache hit rates
    const checkCacheHitRate = () => {
      const queryCache = (window as any).__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryClient?.getQueryCache()
      if (queryCache) {
        const queries = queryCache.getAll()
        const totalQueries = queries.length
        const cachedQueries = queries.filter((query: { state: { dataUpdatedAt: number; fetchStatus: string } }) => 
          query.state.dataUpdatedAt > 0 && 
          query.state.fetchStatus === 'idle'
        ).length
        
        const hitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cache Hit Rate: ${hitRate.toFixed(1)}% (${cachedQueries}/${totalQueries})`)
        }
      }
    }

    // Check cache performance every minute in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkCacheHitRate, 60000)
      return () => clearInterval(interval)
    }
  }, [])
}

/**
 * Hook to monitor page load performance
 */
export function usePageLoadMonitor(pageName: string) {
  useEffect(() => {
    const measurePageLoad = () => {
      // Use Navigation Timing API to measure page load performance
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: getFirstPaint(),
            firstContentfulPaint: getFirstContentfulPaint(),
            timeToInteractive: estimateTimeToInteractive(navigation)
          }

          logPageLoadMetrics(pageName, metrics)
        }
      }
    }

    // Measure on page load completion
    if (document.readyState === 'complete') {
      measurePageLoad()
    } else {
      window.addEventListener('load', measurePageLoad, { once: true })
    }
  }, [pageName])
}

/**
 * Hook to monitor user interaction performance
 */
export function useInteractionMonitor() {
  useEffect(() => {
    const measureUserInteraction = (eventType: string) => (event: Event) => {
      const startTime = performance.now()
      
      // Measure the time until the next frame
      requestAnimationFrame(() => {
        const endTime = performance.now()
        const interactionTime = endTime - startTime
        
        // Log slow interactions (>16ms for 60fps)
        if (interactionTime > 16) {
          logPerformanceMetric('user-interaction', eventType, interactionTime)
        }
      })
    }

    // Monitor critical user interactions
    const events = ['click', 'keydown', 'scroll']
    const handlers = events.map(event => {
      const handler = measureUserInteraction(event)
      document.addEventListener(event, handler, { passive: true })
      return { event, handler }
    })

    return () => {
      handlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler)
      })
    }
  }, [])
}

// Helper functions
function getFirstPaint(): number {
  const paintEntries = performance.getEntriesByType('paint')
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
  return firstPaint ? firstPaint.startTime : 0
}

function getFirstContentfulPaint(): number {
  const paintEntries = performance.getEntriesByType('paint')
  const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
  return firstContentfulPaint ? firstContentfulPaint.startTime : 0
}

function estimateTimeToInteractive(navigation: PerformanceNavigationTiming): number {
  // Simplified TTI estimation
  return navigation.domContentLoadedEventEnd - navigation.startTime
}

function logPerformanceMetric(component: string, metric: string, value: number) {
  if (process.env.NODE_ENV === 'development') {
    const threshold = getPerformanceThreshold(metric)
    const status = value > threshold ? '🔥 SLOW' : '✅ FAST'
    
    console.log(`[Performance] ${status} ${component}.${metric}: ${value.toFixed(2)}ms`)
    
    // Store metrics for analysis
    storePerformanceMetric(component, metric, value)
  }
}

function logPageLoadMetrics(pageName: string, metrics: Record<string, number>) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[Page Load] ${pageName}`)
    Object.entries(metrics).forEach(([key, value]) => {
      const threshold = getPerformanceThreshold(key)
      const status = value > threshold ? '🔥' : '✅'
      console.log(`${status} ${key}: ${value.toFixed(2)}ms`)
    })
    console.groupEnd()
  }
}

function getPerformanceThreshold(metric: string): number {
  const thresholds: Record<string, number> = {
    render: 16, // 60fps threshold
    lifecycle: 100,
    domContentLoaded: 1000,
    loadComplete: 2000,
    firstPaint: 1000,
    firstContentfulPaint: 1500,
    timeToInteractive: 3000,
    click: 100,
    keydown: 50,
    scroll: 16
  }
  
  return thresholds[metric] || 100
}

function storePerformanceMetric(component: string, metric: string, value: number) {
  try {
    const key = 'innSync_performance_metrics'
    const stored = localStorage.getItem(key)
    const metrics = stored ? JSON.parse(stored) : {}
    
    if (!metrics[component]) {
      metrics[component] = {}
    }
    
    if (!metrics[component][metric]) {
      metrics[component][metric] = []
    }
    
    metrics[component][metric].push({
      value,
      timestamp: Date.now()
    })
    
    // Keep only last 100 measurements per metric
    if (metrics[component][metric].length > 100) {
      metrics[component][metric] = metrics[component][metric].slice(-100)
    }
    
    localStorage.setItem(key, JSON.stringify(metrics))
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Hook to get performance insights and suggestions
 */
export function usePerformanceInsights() {
  const getInsights = () => {
    try {
      const key = 'innSync_performance_metrics'
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const metrics = JSON.parse(stored)
      const insights: string[] = []
      
      // Analyze metrics and provide suggestions
      Object.entries(metrics).forEach(([component, componentMetrics]: [string, any]) => {
        Object.entries(componentMetrics).forEach(([metric, values]: [string, any]) => {
          if (Array.isArray(values) && values.length > 10) {
            const average = values.reduce((sum: number, item: any) => sum + item.value, 0) / values.length
            const threshold = getPerformanceThreshold(metric)
            
            if (average > threshold * 1.5) {
              insights.push(`${component}.${metric} is consistently slow (${average.toFixed(1)}ms avg)`)
            }
          }
        })
      })
      
      return insights
    } catch (error) {
      return null
    }
  }

  return { getInsights }
}