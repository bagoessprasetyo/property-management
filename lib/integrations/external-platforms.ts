// Integration with external booking platforms and services

export interface ExternalPlatform {
  id: string
  name: string
  type: 'booking_engine' | 'ota' | 'pms' | 'payment' | 'communication'
  enabled: boolean
  config: Record<string, any>
  last_sync: string | null
  sync_status: 'idle' | 'syncing' | 'error' | 'success'
}

export interface BookingPlatformReservation {
  external_id: string
  platform: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  check_in: string
  check_out: string
  adults: number
  children: number
  room_type: string
  total_amount: number
  currency: string
  status: string
  booking_date: string
  special_requests?: string
}

class ExternalIntegrationService {
  private platforms: ExternalPlatform[] = []

  // Register external platform
  registerPlatform(platform: Omit<ExternalPlatform, 'id'>): ExternalPlatform {
    const newPlatform: ExternalPlatform = {
      ...platform,
      id: `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.platforms.push(newPlatform)
    this.savePlatforms()
    return newPlatform
  }

  // Sync reservations from external platforms
  async syncReservations(platformId?: string): Promise<BookingPlatformReservation[]> {
    const platformsToSync = platformId 
      ? this.platforms.filter(p => p.id === platformId && p.enabled)
      : this.platforms.filter(p => p.enabled)

    const allReservations: BookingPlatformReservation[] = []

    for (const platform of platformsToSync) {
      try {
        await this.updateSyncStatus(platform.id, 'syncing')
        
        const reservations = await this.syncFromPlatform(platform)
        allReservations.push(...reservations)
        
        await this.updateSyncStatus(platform.id, 'success')
        platform.last_sync = new Date().toISOString()
      } catch (error) {
        console.error(`Failed to sync from ${platform.name}:`, error)
        await this.updateSyncStatus(platform.id, 'error')
      }
    }

    this.savePlatforms()
    return allReservations
  }

  // Sync from specific platform
  private async syncFromPlatform(platform: ExternalPlatform): Promise<BookingPlatformReservation[]> {
    switch (platform.type) {
      case 'booking_engine':
        return this.syncFromBookingEngine(platform)
      case 'ota':
        return this.syncFromOTA(platform)
      default:
        return []
    }
  }

  // Booking.com integration
  private async syncFromBookingEngine(platform: ExternalPlatform): Promise<BookingPlatformReservation[]> {
    const { api_key, property_id } = platform.config

    if (!api_key || !property_id) {
      throw new Error('Missing API credentials for booking engine')
    }

    // Simulate API call (replace with actual integration)
    const mockReservations: BookingPlatformReservation[] = [
      {
        external_id: 'BE_001',
        platform: platform.name,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '+1234567890',
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        adults: 2,
        children: 0,
        room_type: 'Deluxe',
        total_amount: 750000,
        currency: 'IDR',
        status: 'confirmed',
        booking_date: new Date().toISOString(),
        special_requests: 'Late check-in requested'
      }
    ]

    return mockReservations
  }

  // OTA (Online Travel Agency) integration
  private async syncFromOTA(platform: ExternalPlatform): Promise<BookingPlatformReservation[]> {
    const { api_endpoint, api_key, hotel_id } = platform.config

    if (!api_endpoint || !api_key || !hotel_id) {
      throw new Error('Missing API credentials for OTA')
    }

    // Simulate OTA API integration
    try {
      const response = await fetch(`${api_endpoint}/reservations`, {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`OTA API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform OTA data to our format
      return data.reservations?.map((res: any) => ({
        external_id: res.id,
        platform: platform.name,
        guest_name: `${res.guest.first_name} ${res.guest.last_name}`,
        guest_email: res.guest.email,
        guest_phone: res.guest.phone,
        check_in: res.check_in_date,
        check_out: res.check_out_date,
        adults: res.guests.adults,
        children: res.guests.children,
        room_type: res.room.type,
        total_amount: res.total_price,
        currency: res.currency,
        status: res.status,
        booking_date: res.created_at,
        special_requests: res.special_requests
      })) || []
    } catch (error) {
      console.error('Failed to sync from OTA:', error)
      return []
    }
  }

  // Push reservation to external platform
  async pushReservation(platformId: string, reservation: any): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId)
    if (!platform || !platform.enabled) return false

    try {
      switch (platform.type) {
        case 'booking_engine':
          return await this.pushToBookingEngine(platform, reservation)
        case 'ota':
          return await this.pushToOTA(platform, reservation)
        default:
          return false
      }
    } catch (error) {
      console.error(`Failed to push to ${platform.name}:`, error)
      return false
    }
  }

  private async pushToBookingEngine(platform: ExternalPlatform, reservation: any): Promise<boolean> {
    // Implement booking engine API push
    console.log(`Pushing reservation to ${platform.name}:`, reservation)
    return true
  }

  private async pushToOTA(platform: ExternalPlatform, reservation: any): Promise<boolean> {
    // Implement OTA API push
    console.log(`Pushing reservation to ${platform.name}:`, reservation)
    return true
  }

  // Update sync status
  private async updateSyncStatus(platformId: string, status: ExternalPlatform['sync_status']): Promise<void> {
    const platform = this.platforms.find(p => p.id === platformId)
    if (platform) {
      platform.sync_status = status
      this.savePlatforms()
    }
  }

  // Configure platform settings
  async configurePlatform(platformId: string, config: Record<string, any>): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId)
    if (!platform) return false

    platform.config = { ...platform.config, ...config }
    this.savePlatforms()
    return true
  }

  // Test platform connection
  async testConnection(platformId: string): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId)
    if (!platform) return false

    try {
      // Perform a simple API test
      const testReservations = await this.syncFromPlatform(platform)
      return true
    } catch (error) {
      console.error(`Connection test failed for ${platform.name}:`, error)
      return false
    }
  }

  // Get platform sync history
  getPlatformStatus(platformId: string): ExternalPlatform | null {
    return this.platforms.find(p => p.id === platformId) || null
  }

  // Get all platforms
  getPlatforms(): ExternalPlatform[] {
    return [...this.platforms]
  }

  // Enable/disable platform
  togglePlatform(platformId: string, enabled: boolean): boolean {
    const platform = this.platforms.find(p => p.id === platformId)
    if (!platform) return false

    platform.enabled = enabled
    this.savePlatforms()
    return true
  }

  // Save platforms to storage
  private savePlatforms(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('external_platforms', JSON.stringify(this.platforms))
    }
  }

  // Load platforms from storage
  loadPlatforms(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('external_platforms')
        if (stored) {
          this.platforms = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Failed to load platforms:', error)
        this.platforms = []
      }
    }
  }

  // Auto-sync scheduler
  startAutoSync(intervalMinutes: number = 30): void {
    setInterval(async () => {
      console.log('Starting auto-sync with external platforms...')
      await this.syncReservations()
    }, intervalMinutes * 60 * 1000)
  }
}

// Singleton instance
export const externalIntegrationService = new ExternalIntegrationService()

// Initialize on load
if (typeof window !== 'undefined') {
  externalIntegrationService.loadPlatforms()
}

// Predefined platform templates
export const platformTemplates = {
  booking_com: {
    name: 'Booking.com',
    type: 'ota' as const,
    enabled: false,
    config: {
      api_endpoint: 'https://distribution-xml.booking.com/2.3',
      api_key: '',
      hotel_id: '',
      username: '',
      password: ''
    },
    last_sync: null,
    sync_status: 'idle' as const
  },
  
  airbnb: {
    name: 'Airbnb',
    type: 'ota' as const,
    enabled: false,
    config: {
      api_endpoint: 'https://api.airbnb.com/v2',
      access_token: '',
      listing_id: ''
    },
    last_sync: null,
    sync_status: 'idle' as const
  },
  
  agoda: {
    name: 'Agoda',
    type: 'ota' as const,
    enabled: false,
    config: {
      api_endpoint: 'https://partnerapi.agoda.com',
      api_key: '',
      property_id: ''
    },
    last_sync: null,
    sync_status: 'idle' as const
  },
  
  expedia: {
    name: 'Expedia',
    type: 'ota' as const,
    enabled: false,
    config: {
      api_endpoint: 'https://services.expediapartnercentral.com',
      api_key: '',
      property_id: ''
    },
    last_sync: null,
    sync_status: 'idle' as const
  },

  direct_booking: {
    name: 'Direct Booking Engine',
    type: 'booking_engine' as const,
    enabled: false,
    config: {
      api_key: '',
      property_id: '',
      webhook_secret: ''
    },
    last_sync: null,
    sync_status: 'idle' as const
  }
}