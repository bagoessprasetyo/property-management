/**
 * Production-ready logging and monitoring utilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  context?: string
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
}

interface PerformanceEntry {
  name: string
  duration: number
  timestamp: string
  metadata?: any
}

interface ErrorEntry extends LogEntry {
  stack?: string
  component?: string
  action?: string
  errorBoundary?: boolean
}

class Logger {
  private logLevel: LogLevel
  private sessionId: string
  private userId?: string
  private context?: string
  private logs: LogEntry[] = []
  private performanceLogs: PerformanceEntry[] = []
  private maxLogsInMemory = 100

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG
    this.sessionId = this.generateSessionId()
    
    // Only initialize client-side features in browser
    if (typeof window !== 'undefined') {
      this.initializeErrorHandling()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })

    // Performance observer for monitoring
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 100) { // Log slow operations
              this.performance(entry.name, entry.duration, {
                entryType: entry.entryType,
                startTime: entry.startTime
              })
            }
          })
        })
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
      } catch (error) {
        console.warn('Performance Observer not supported')
      }
    }
  }

  setContext(context: string) {
    this.context = context
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.context,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  }

  private addToMemory(entry: LogEntry) {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory)
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const context = entry.context ? `[${entry.context}]` : ''
    return `${timestamp} ${context} ${entry.message}`
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry = this.createLogEntry(LogLevel.DEBUG, message, data)
    this.addToMemory(entry)
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatConsoleMessage(entry), data)
    }
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry = this.createLogEntry(LogLevel.INFO, message, data)
    this.addToMemory(entry)
    
    if (process.env.NODE_ENV === 'development') {
      console.info(this.formatConsoleMessage(entry), data)
    }

    this.sendToRemote(entry)
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry = this.createLogEntry(LogLevel.WARN, message, data)
    this.addToMemory(entry)
    
    console.warn(this.formatConsoleMessage(entry), data)
    this.sendToRemote(entry)
  }

  error(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry = this.createLogEntry(LogLevel.ERROR, message, data) as ErrorEntry
    
    // Add error-specific data
    if (data instanceof Error) {
      entry.stack = data.stack
      entry.data = {
        name: data.name,
        message: data.message,
        ...(typeof data === 'object' ? data : {})
      }
    }
    
    this.addToMemory(entry)
    console.error(this.formatConsoleMessage(entry), data)
    this.sendToRemote(entry, true)
  }

  fatal(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.FATAL, message, data) as ErrorEntry
    
    if (data instanceof Error) {
      entry.stack = data.stack
    }
    
    this.addToMemory(entry)
    console.error('FATAL:', this.formatConsoleMessage(entry), data)
    this.sendToRemote(entry, true)
  }

  performance(name: string, duration: number, metadata?: any) {
    const entry: PerformanceEntry = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.performanceLogs.push(entry)
    if (this.performanceLogs.length > 50) {
      this.performanceLogs = this.performanceLogs.slice(-50)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }

    // Send slow operations to monitoring
    if (duration > 1000) {
      this.sendToRemote({
        timestamp: entry.timestamp,
        level: LogLevel.WARN,
        message: `Slow Operation: ${name}`,
        data: entry,
        context: 'performance'
      } as LogEntry)
    }
  }

  // Track user actions for analytics
  trackUserAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, {
      action,
      timestamp: Date.now(),
      ...data
    })
  }

  // Track business events
  trackBusinessEvent(event: string, data?: any) {
    this.info(`Business Event: ${event}`, {
      event,
      timestamp: Date.now(),
      ...data
    })
  }

  private async sendToRemote(entry: LogEntry, isError: boolean = false) {
    // Only send to remote in production or for errors
    if (process.env.NODE_ENV !== 'production' && !isError) return

    try {
      // In a real application, you would send to your logging service
      // Examples: DataDog, LogRocket, Sentry, etc.
      
      // Example implementation:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })

      // For demo, we'll just store in localStorage for inspection
      if (typeof window !== 'undefined') {
        const key = isError ? 'innSync_error_logs' : 'innSync_app_logs'
        const existing = localStorage.getItem(key)
        const logs = existing ? JSON.parse(existing) : []
        logs.push(entry)
        
        // Keep only last 100 entries
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100)
        }
        
        localStorage.setItem(key, JSON.stringify(logs))
      }
    } catch (error) {
      console.error('Failed to send log to remote:', error)
    }
  }

  // Get logs for debugging or support
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level)
    }
    return [...this.logs]
  }

  getPerformanceLogs(): PerformanceEntry[] {
    return [...this.performanceLogs]
  }

  // Export logs for support
  exportLogs(): string {
    const exportData = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      logs: this.logs,
      performanceLogs: this.performanceLogs,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // Clear logs (for privacy)
  clearLogs() {
    this.logs = []
    this.performanceLogs = []
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('innSync_app_logs')
      localStorage.removeItem('innSync_error_logs')
    }
  }
}

// Create singleton instance
export const logger = new Logger()

// Utility functions for common logging patterns
export const loggers = {
  auth: {
    login: (userId: string) => logger.trackUserAction('login', { userId }),
    logout: () => logger.trackUserAction('logout'),
    loginFailed: (reason: string) => logger.warn('Login failed', { reason })
  },

  reservation: {
    created: (reservationId: string) => logger.trackBusinessEvent('reservation_created', { reservationId }),
    updated: (reservationId: string, changes: any) => logger.trackBusinessEvent('reservation_updated', { reservationId, changes }),
    cancelled: (reservationId: string, reason?: string) => logger.trackBusinessEvent('reservation_cancelled', { reservationId, reason })
  },

  payment: {
    processed: (paymentId: string, amount: number, method: string) => 
      logger.trackBusinessEvent('payment_processed', { paymentId, amount, method }),
    failed: (amount: number, method: string, error: string) => 
      logger.error('Payment failed', { amount, method, error })
  },

  system: {
    startup: () => logger.info('Application started'),
    apiError: (endpoint: string, error: any) => logger.error(`API Error: ${endpoint}`, error),
    slowQuery: (query: string, duration: number) => logger.performance(`Query: ${query}`, duration)
  }
}

// React hook for component-level logging
export function useLogger(componentName: string) {
  const componentLogger = {
    debug: (message: string, data?: any) => {
      logger.setContext(componentName)
      logger.debug(message, data)
    },
    info: (message: string, data?: any) => {
      logger.setContext(componentName)
      logger.info(message, data)
    },
    warn: (message: string, data?: any) => {
      logger.setContext(componentName)
      logger.warn(message, data)
    },
    error: (message: string, data?: any) => {
      logger.setContext(componentName)
      logger.error(message, data)
    },
    performance: (name: string, duration: number, metadata?: any) => {
      logger.performance(`${componentName}:${name}`, duration, metadata)
    }
  }

  return componentLogger
}

// Performance measurement utilities
export function measurePerformance(name: string) {
  const startTime = performance.now()
  
  return {
    end: (metadata?: any) => {
      const duration = performance.now() - startTime
      logger.performance(name, duration, metadata)
      return duration
    }
  }
}

export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const measurement = measurePerformance(name)
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.finally(() => measurement.end())
      } else {
        measurement.end()
        return result
      }
    } catch (error) {
      measurement.end({ error: true })
      throw error
    }
  }) as T
}