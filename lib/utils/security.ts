/**
 * Security utilities for production environment
 */

import { logger } from './logger'

/**
 * Input sanitization utilities
 */
export const sanitize = {
  // Remove potentially dangerous HTML/JS
  html: (input: string): string => {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  },

  // Sanitize for SQL-like queries (though we use Supabase with parameterized queries)
  query: (input: string): string => {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .trim()
  },

  // Sanitize phone numbers to Indonesian format
  phone: (input: string): string => {
    if (typeof input !== 'string') return ''
    
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '')
    
    // Handle Indonesian phone number formats
    if (cleaned.startsWith('0')) {
      cleaned = '+62' + cleaned.substring(1)
    } else if (cleaned.startsWith('62')) {
      cleaned = '+' + cleaned
    } else if (!cleaned.startsWith('+62')) {
      cleaned = '+62' + cleaned
    }
    
    return cleaned
  },

  // Sanitize email
  email: (input: string): string => {
    if (typeof input !== 'string') return ''
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@.\-_]/g, '') // Only allow valid email characters
  },

  // General text sanitization
  text: (input: string, maxLength: number = 500): string => {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[\r\n]/g, ' ') // Replace newlines with spaces
      .trim()
      .substring(0, maxLength)
  }
}

/**
 * Data validation and security checks
 */
export const security = {
  // Check if string contains potential XSS
  hasXSS: (input: string): boolean => {
    if (typeof input !== 'string') return false
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  },

  // Check if string contains potential SQL injection
  hasSQLInjection: (input: string): boolean => {
    if (typeof input !== 'string') return false
    
    const sqlPatterns = [
      /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/gi,
      /(;|\||&|'|"|-{2}|\/\*|\*\/)/g,
      /(\b(AND|OR)\b.*(=|>|<|\bLIKE\b))/gi,
      /\b(CAST|CONVERT|ASCII|CHAR|NCHAR|NVARCHAR|VARCHAR)\b/gi
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  },

  // Check for suspicious file uploads
  isValidFileType: (fileName: string, allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']): boolean => {
    if (!fileName) return false
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension) return false
    
    return allowedTypes.includes(extension)
  },

  // Rate limiting check (client-side)
  checkRateLimit: (action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
    const key = `rate_limit_${action}`
    const now = Date.now()
    
    try {
      const stored = localStorage.getItem(key)
      const attempts = stored ? JSON.parse(stored) : []
      
      // Remove old attempts outside the window
      const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs)
      
      if (validAttempts.length >= maxAttempts) {
        logger.warn(`Rate limit exceeded for action: ${action}`, { attempts: validAttempts.length })
        return false
      }
      
      // Add current attempt
      validAttempts.push(now)
      localStorage.setItem(key, JSON.stringify(validAttempts))
      
      return true
    } catch (error) {
      logger.error('Rate limit check failed', error)
      return true // Allow action if check fails
    }
  },

  // Validate Indonesian ID numbers
  validateIndonesianID: (idNumber: string, idType: 'ktp' | 'passport' | 'sim'): boolean => {
    if (!idNumber) return false
    
    switch (idType) {
      case 'ktp':
        // KTP should be 16 digits
        return /^\d{16}$/.test(idNumber)
      
      case 'passport':
        // Indonesian passport: 1 letter + 7 digits or 2 letters + 6 digits
        return /^[A-Z]\d{7}$/.test(idNumber) || /^[A-Z]{2}\d{6}$/.test(idNumber)
      
      case 'sim':
        // SIM should be 12 digits
        return /^\d{12}$/.test(idNumber)
      
      default:
        return false
    }
  },

  // Mask sensitive data for logging
  maskSensitiveData: (data: any): any => {
    if (typeof data !== 'object' || data === null) return data
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'id_number', 'passport', 'credit_card', 'bank_account',
      'ssn', 'social_security'
    ]
    
    const masked = { ...data }
    
    Object.keys(masked).forEach(key => {
      const lowerKey = key.toLowerCase()
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof masked[key] === 'string' && masked[key].length > 4) {
          masked[key] = masked[key].slice(0, 2) + '*'.repeat(masked[key].length - 4) + masked[key].slice(-2)
        } else {
          masked[key] = '***'
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = security.maskSensitiveData(masked[key])
      }
    })
    
    return masked
  }
}

/**
 * Content Security Policy helpers
 */
export const csp = {
  // Generate nonce for inline scripts/styles
  generateNonce: (): string => {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(16)
      window.crypto.getRandomValues(array)
      return btoa(Array.from(array, byte => String.fromCharCode(byte)).join(''))
    }
    // Fallback for environments without crypto
    return Math.random().toString(36).substring(2, 15)
  },

  // Validate external URLs
  isAllowedDomain: (url: string, allowedDomains: string[] = []): boolean => {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.toLowerCase()
      
      // Always allow same origin
      if (domain === window.location.hostname) return true
      
      // Check against allowed domains
      return allowedDomains.some(allowed => 
        domain === allowed || domain.endsWith('.' + allowed)
      )
    } catch {
      return false
    }
  }
}

/**
 * Authentication security helpers
 */
export const auth = {
  // Password strength checker
  checkPasswordStrength: (password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } => {
    const feedback: string[] = []
    let score = 0
    
    if (!password) {
      return { score: 0, feedback: ['Password diperlukan'], isStrong: false }
    }
    
    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('Minimal 8 karakter')
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan huruf besar')
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan huruf kecil')
    }
    
    // Number check
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan angka')
    }
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan karakter khusus')
    }
    
    // Common password check
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', 'dragon'
    ]
    
    if (commonPasswords.includes(password.toLowerCase())) {
      score = Math.max(0, score - 2)
      feedback.push('Jangan gunakan password umum')
    }
    
    return {
      score,
      feedback,
      isStrong: score >= 4 && feedback.length === 0
    }
  },

  // Generate secure session token
  generateSessionToken: (): string => {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(32)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    // Fallback
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  },

  // Check for suspicious login patterns
  detectSuspiciousActivity: (loginAttempts: Array<{ timestamp: number, success: boolean, ip?: string }>): {
    suspicious: boolean
    reasons: string[]
  } => {
    const reasons: string[] = []
    const now = Date.now()
    const lastHour = now - (60 * 60 * 1000)
    
    // Recent failed attempts
    const recentFailed = loginAttempts.filter(attempt => 
      !attempt.success && attempt.timestamp > lastHour
    )
    
    if (recentFailed.length >= 5) {
      reasons.push('Banyak percobaan login gagal dalam 1 jam terakhir')
    }
    
    // Multiple IPs in short time
    const recentIPs = new Set(
      loginAttempts
        .filter(attempt => attempt.timestamp > lastHour && attempt.ip)
        .map(attempt => attempt.ip)
    )
    
    if (recentIPs.size >= 3) {
      reasons.push('Login dari banyak IP dalam waktu singkat')
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    }
  }
}

/**
 * Data encryption utilities (for client-side data)
 */
export const encryption = {
  // Simple obfuscation for non-sensitive client data
  obfuscate: (text: string): string => {
    if (!text) return ''
    
    return btoa(encodeURIComponent(text))
      .split('')
      .reverse()
      .join('')
  },

  deobfuscate: (obfuscated: string): string => {
    if (!obfuscated) return ''
    
    try {
      return decodeURIComponent(
        atob(
          obfuscated
            .split('')
            .reverse()
            .join('')
        )
      )
    } catch {
      return ''
    }
  }
}

/**
 * Security monitoring and reporting
 */
export const monitoring = {
  // Report security incident
  reportIncident: (type: string, details: any) => {
    const incident = {
      type,
      details: security.maskSensitiveData(details),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: 'system'
    }
    
    logger.error(`Security Incident: ${type}`, incident)
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to security endpoint
      // fetch('/api/security/incidents', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(incident)
      // })
    }
  },

  // Check for client-side tampering
  checkIntegrity: (): boolean => {
    try {
      // Check if developer tools are open (basic check)
      const threshold = 160
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        monitoring.reportIncident('dev_tools_detected', {
          outerDimensions: `${window.outerWidth}x${window.outerHeight}`,
          innerDimensions: `${window.innerWidth}x${window.innerHeight}`
        })
      }
      
      // Check for common debugging variables
      if (typeof window !== 'undefined') {
        const suspiciousGlobals = ['webdriver', '__nightmare', '__phantomas', 'callPhantom']
        for (const global of suspiciousGlobals) {
          if ((window as any)[global]) {
            monitoring.reportIncident('automation_detected', { global })
            return false
          }
        }
      }
      
      return true
    } catch (error) {
      logger.warn('Integrity check failed', error)
      return true // Don't block on check failure
    }
  }
}

// Initialize security monitoring
if (typeof window !== 'undefined') {
  // Run integrity check periodically
  setInterval(() => {
    monitoring.checkIntegrity()
  }, 30000) // Every 30 seconds

  // Monitor for suspicious clipboard access
  document.addEventListener('copy', () => {
    logger.debug('Clipboard copy detected')
  })

  document.addEventListener('paste', () => {
    logger.debug('Clipboard paste detected')
  })
}