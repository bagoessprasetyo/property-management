/**
 * Data backup and recovery utilities for production resilience
 */

import { createClient } from '@/lib/supabase/client'
import { logger } from './logger'
import { security } from './security'

interface BackupData {
  timestamp: string
  version: string
  properties: any[]
  rooms: any[]
  guests: any[]
  reservations: any[]
  payments: any[]
  metadata: {
    totalRecords: number
    dataIntegrity: string
    exportedBy: string
    exportReason: string
  }
}

interface RestoreOptions {
  validateIntegrity: boolean
  createBackupFirst: boolean
  dryRun: boolean
  propertyId?: string
}

export class DataBackupManager {
  private supabase = createClient()
  private readonly BACKUP_VERSION = '1.0'
  private readonly MAX_BACKUP_SIZE = 50 * 1024 * 1024 // 50MB
  
  /**
   * Create a complete data backup
   */
  async createBackup(propertyId?: string, reason: string = 'manual'): Promise<BackupData | null> {
    try {
      logger.info('Starting data backup', { propertyId, reason })
      
      const backup: BackupData = {
        timestamp: new Date().toISOString(),
        version: this.BACKUP_VERSION,
        properties: [],
        rooms: [],
        guests: [],
        reservations: [],
        payments: [],
        metadata: {
          totalRecords: 0,
          dataIntegrity: '',
          exportedBy: 'system',
          exportReason: reason
        }
      }

      // Backup properties
      const { data: properties } = await this.supabase
        .from('properties')
        .select('*')
        .eq(propertyId ? 'id' : 'id', propertyId || 'any')
      
      if (properties) {
        backup.properties = this.sanitizeBackupData(properties)
      }

      // Backup rooms
      let roomsQuery = this.supabase.from('rooms').select('*')
      if (propertyId) {
        roomsQuery = roomsQuery.eq('property_id', propertyId)
      }
      
      const { data: rooms } = await roomsQuery
      if (rooms) {
        backup.rooms = this.sanitizeBackupData(rooms)
      }

      // Backup guests
      let guestsQuery = this.supabase.from('guests').select('*')
      if (propertyId) {
        guestsQuery = guestsQuery.eq('property_id', propertyId)
      }
      
      const { data: guests } = await guestsQuery
      if (guests) {
        backup.guests = this.sanitizeBackupData(guests)
      }

      // Backup reservations
      let reservationsQuery = this.supabase.from('reservations').select('*')
      if (propertyId) {
        reservationsQuery = reservationsQuery.eq('property_id', propertyId)
      }
      
      const { data: reservations } = await reservationsQuery
      if (reservations) {
        backup.reservations = this.sanitizeBackupData(reservations)
      }

      // Backup payments
      let paymentsQuery = this.supabase
        .from('payments')
        .select(`
          *,
          reservations!inner (property_id)
        `)
      
      if (propertyId) {
        paymentsQuery = paymentsQuery.eq('reservations.property_id', propertyId)
      }
      
      const { data: payments } = await paymentsQuery
      if (payments) {
        backup.payments = this.sanitizeBackupData(payments)
      }

      // Calculate metadata
      backup.metadata.totalRecords = 
        backup.properties.length +
        backup.rooms.length +
        backup.guests.length +
        backup.reservations.length +
        backup.payments.length

      backup.metadata.dataIntegrity = this.calculateDataIntegrity(backup)

      // Validate backup size
      const backupSize = new Blob([JSON.stringify(backup)]).size
      if (backupSize > this.MAX_BACKUP_SIZE) {
        throw new Error(`Backup size (${(backupSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size`)
      }

      logger.info('Data backup completed successfully', {
        totalRecords: backup.metadata.totalRecords,
        sizeKB: Math.round(backupSize / 1024),
        propertyId
      })

      return backup
    } catch (error) {
      logger.error('Data backup failed', error)
      return null
    }
  }

  /**
   * Save backup to file
   */
  async downloadBackup(propertyId?: string, reason: string = 'manual'): Promise<boolean> {
    try {
      const backup = await this.createBackup(propertyId, reason)
      if (!backup) return false

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      const propertyName = propertyId ? `property_${propertyId}` : 'all_properties'
      link.download = `innsync_backup_${propertyName}_${timestamp}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      logger.info('Backup downloaded successfully')
      return true
    } catch (error) {
      logger.error('Backup download failed', error)
      return false
    }
  }

  /**
   * Validate backup data integrity
   */
  validateBackup(backup: BackupData): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check version compatibility
    if (backup.version !== this.BACKUP_VERSION) {
      warnings.push(`Backup version (${backup.version}) differs from current version (${this.BACKUP_VERSION})`)
    }

    // Check required fields
    if (!backup.timestamp) {
      errors.push('Missing backup timestamp')
    }

    // Validate data structure
    const requiredTables = ['properties', 'rooms', 'guests', 'reservations', 'payments']
    for (const table of requiredTables) {
      if (!Array.isArray(backup[table as keyof BackupData])) {
        errors.push(`Invalid or missing ${table} data`)
      }
    }

    // Check data integrity hash
    const calculatedIntegrity = this.calculateDataIntegrity(backup)
    if (backup.metadata.dataIntegrity !== calculatedIntegrity) {
      errors.push('Data integrity check failed - backup may be corrupted')
    }

    // Validate relationships
    const propertyIds = new Set(backup.properties.map(p => p.id))
    const roomPropertyIds = backup.rooms.map(r => r.property_id)
    const invalidRooms = roomPropertyIds.filter(id => id && !propertyIds.has(id))
    
    if (invalidRooms.length > 0) {
      warnings.push(`${invalidRooms.length} rooms reference non-existent properties`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(
    backup: BackupData, 
    options: RestoreOptions = {
      validateIntegrity: true,
      createBackupFirst: true,
      dryRun: false
    }
  ): Promise<{
    success: boolean
    restoredRecords: number
    errors: string[]
  }> {
    const errors: string[] = []
    let restoredRecords = 0

    try {
      // Validate backup first
      if (options.validateIntegrity) {
        const validation = this.validateBackup(backup)
        if (!validation.isValid) {
          return {
            success: false,
            restoredRecords: 0,
            errors: validation.errors
          }
        }
        
        if (validation.warnings.length > 0) {
          logger.warn('Backup validation warnings', validation.warnings)
        }
      }

      // Create current backup before restore
      if (options.createBackupFirst && !options.dryRun) {
        logger.info('Creating backup before restore')
        await this.createBackup(options.propertyId, 'pre_restore_backup')
      }

      if (options.dryRun) {
        logger.info('Dry run mode - simulating restore')
        return {
          success: true,
          restoredRecords: backup.metadata.totalRecords,
          errors: []
        }
      }

      // Start transaction-like restore process
      logger.info('Starting data restore', {
        backupTimestamp: backup.timestamp,
        totalRecords: backup.metadata.totalRecords
      })

      // Restore in dependency order: properties -> rooms -> guests -> reservations -> payments
      
      // Restore properties
      if (backup.properties.length > 0) {
        const { error: propError } = await this.supabase
          .from('properties')
          .upsert(backup.properties, { onConflict: 'id' })
        
        if (propError) {
          errors.push(`Properties restore failed: ${propError.message}`)
        } else {
          restoredRecords += backup.properties.length
        }
      }

      // Restore rooms
      if (backup.rooms.length > 0) {
        const { error: roomError } = await this.supabase
          .from('rooms')
          .upsert(backup.rooms, { onConflict: 'id' })
        
        if (roomError) {
          errors.push(`Rooms restore failed: ${roomError.message}`)
        } else {
          restoredRecords += backup.rooms.length
        }
      }

      // Restore guests
      if (backup.guests.length > 0) {
        const { error: guestError } = await this.supabase
          .from('guests')
          .upsert(backup.guests, { onConflict: 'id' })
        
        if (guestError) {
          errors.push(`Guests restore failed: ${guestError.message}`)
        } else {
          restoredRecords += backup.guests.length
        }
      }

      // Restore reservations
      if (backup.reservations.length > 0) {
        const { error: reservationError } = await this.supabase
          .from('reservations')
          .upsert(backup.reservations, { onConflict: 'id' })
        
        if (reservationError) {
          errors.push(`Reservations restore failed: ${reservationError.message}`)
        } else {
          restoredRecords += backup.reservations.length
        }
      }

      // Restore payments
      if (backup.payments.length > 0) {
        const { error: paymentError } = await this.supabase
          .from('payments')
          .upsert(backup.payments, { onConflict: 'id' })
        
        if (paymentError) {
          errors.push(`Payments restore failed: ${paymentError.message}`)
        } else {
          restoredRecords += backup.payments.length
        }
      }

      const success = errors.length === 0
      
      if (success) {
        logger.info('Data restore completed successfully', {
          restoredRecords,
          backupTimestamp: backup.timestamp
        })
      } else {
        logger.error('Data restore completed with errors', { errors, restoredRecords })
      }

      return {
        success,
        restoredRecords,
        errors
      }
    } catch (error) {
      logger.error('Data restore failed', error)
      return {
        success: false,
        restoredRecords,
        errors: [error instanceof Error ? error.message : 'Unknown restore error']
      }
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutoBackup(intervalMinutes: number = 60): () => void {
    logger.info('Scheduling automatic backups', { intervalMinutes })
    
    const intervalId = setInterval(async () => {
      try {
        logger.info('Running scheduled backup')
        await this.createBackup(undefined, 'scheduled')
      } catch (error) {
        logger.error('Scheduled backup failed', error)
      }
    }, intervalMinutes * 60 * 1000)

    // Return cleanup function
    return () => {
      clearInterval(intervalId)
      logger.info('Automatic backup scheduling stopped')
    }
  }

  /**
   * Get backup history from localStorage
   */
  getBackupHistory(): Array<{
    timestamp: string
    propertyId?: string
    reason: string
    recordCount: number
  }> {
    try {
      const history = localStorage.getItem('innSync_backup_history')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }

  /**
   * Clean old backups from localStorage
   */
  cleanupOldBackups(maxAge: number = 30): void {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - maxAge)
      
      const history = this.getBackupHistory()
      const cleanHistory = history.filter(backup => 
        new Date(backup.timestamp) > cutoffDate
      )
      
      localStorage.setItem('innSync_backup_history', JSON.stringify(cleanHistory))
      
      logger.info('Cleaned up old backups', {
        removed: history.length - cleanHistory.length,
        remaining: cleanHistory.length
      })
    } catch (error) {
      logger.error('Backup cleanup failed', error)
    }
  }

  private sanitizeBackupData(data: any[]): any[] {
    return data.map(record => {
      const sanitized = { ...record }
      
      // Remove sensitive fields from backup
      delete sanitized.password_hash
      delete sanitized.auth_token
      delete sanitized.secret_key
      
      // Mask sensitive data
      if (sanitized.id_number) {
        sanitized.id_number = security.maskSensitiveData({ id_number: sanitized.id_number }).id_number
      }
      
      return sanitized
    })
  }

  private calculateDataIntegrity(backup: BackupData): string {
    // Simple hash calculation for data integrity
    const dataString = JSON.stringify({
      properties: backup.properties,
      rooms: backup.rooms,
      guests: backup.guests,
      reservations: backup.reservations,
      payments: backup.payments
    })
    
    // Basic hash using built-in methods
    let hash = 0
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16)
  }

  private recordBackupHistory(backup: BackupData, propertyId?: string): void {
    try {
      const history = this.getBackupHistory()
      history.push({
        timestamp: backup.timestamp,
        propertyId,
        reason: backup.metadata.exportReason,
        recordCount: backup.metadata.totalRecords
      })
      
      // Keep only last 50 backup records
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }
      
      localStorage.setItem('innSync_backup_history', JSON.stringify(history))
    } catch (error) {
      logger.warn('Failed to record backup history', error)
    }
  }
}

// Create singleton instance
export const backupManager = new DataBackupManager()

// Utility functions
export const backup = {
  // Quick backup download
  download: (propertyId?: string) => backupManager.downloadBackup(propertyId, 'user_initiated'),
  
  // Restore from file
  restoreFromFile: async (file: File, options?: RestoreOptions): Promise<{
    success: boolean
    restoredRecords: number
    errors: string[]
  }> => {
    try {
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)
      return await backupManager.restoreFromBackup(backupData, options)
    } catch (error) {
      return {
        success: false,
        restoredRecords: 0,
        errors: [error instanceof Error ? error.message : 'Invalid backup file']
      }
    }
  },
  
  // Emergency backup
  emergency: () => backupManager.createBackup(undefined, 'emergency'),
  
  // Get backup info
  getHistory: () => backupManager.getBackupHistory(),
  
  // Clean old backups
  cleanup: (maxAgeDays: number = 30) => backupManager.cleanupOldBackups(maxAgeDays)
}

// Initialize cleanup on app start
if (typeof window !== 'undefined') {
  // Clean up old backups on page load
  setTimeout(() => {
    backup.cleanup()
  }, 5000)
}