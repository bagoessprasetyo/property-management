// Webhook integration for external services

export interface WebhookEvent {
  id: string
  type: 'reservation.created' | 'reservation.updated' | 'reservation.cancelled' | 'guest.checked_in' | 'guest.checked_out'
  timestamp: string
  data: {
    reservation?: any
    guest?: any
    property?: any
    previous_state?: any
  }
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  created_at: string
  updated_at: string
}

class WebhookService {
  private endpoints: WebhookEndpoint[] = []

  // Register a webhook endpoint
  async registerWebhook(endpoint: Omit<WebhookEndpoint, 'id' | 'created_at' | 'updated_at'>): Promise<WebhookEndpoint> {
    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.endpoints.push(newEndpoint)
    
    // In a real app, this would be stored in the database
    localStorage.setItem('webhook_endpoints', JSON.stringify(this.endpoints))
    
    return newEndpoint
  }

  // Send webhook event to all registered endpoints
  async triggerWebhook(event: WebhookEvent): Promise<void> {
    const relevantEndpoints = this.endpoints.filter(endpoint => 
      endpoint.active && endpoint.events.includes(event.type)
    )

    const promises = relevantEndpoints.map(endpoint => 
      this.sendWebhook(endpoint, event)
    )

    await Promise.allSettled(promises)
  }

  // Send webhook to a specific endpoint
  private async sendWebhook(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    try {
      const payload = {
        ...event,
        webhook_id: endpoint.id,
        signature: endpoint.secret ? await this.generateSignature(event, endpoint.secret) : undefined
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InnSync-Webhook/1.0',
          ...(payload.signature && { 'X-InnSync-Signature': payload.signature })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      console.log(`Webhook sent successfully to ${endpoint.url}`)
    } catch (error) {
      console.error(`Failed to send webhook to ${endpoint.url}:`, error)
      // In a real app, implement retry logic and failure handling
    }
  }

  // Generate HMAC signature for webhook verification
  private async generateSignature(event: WebhookEvent, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(event))
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, data)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Get all registered endpoints
  getEndpoints(): WebhookEndpoint[] {
    return [...this.endpoints]
  }

  // Update webhook endpoint
  async updateWebhook(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const index = this.endpoints.findIndex(endpoint => endpoint.id === id)
    if (index === -1) return null

    this.endpoints[index] = {
      ...this.endpoints[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    localStorage.setItem('webhook_endpoints', JSON.stringify(this.endpoints))
    return this.endpoints[index]
  }

  // Delete webhook endpoint
  async deleteWebhook(id: string): Promise<boolean> {
    const index = this.endpoints.findIndex(endpoint => endpoint.id === id)
    if (index === -1) return false

    this.endpoints.splice(index, 1)
    localStorage.setItem('webhook_endpoints', JSON.stringify(this.endpoints))
    return true
  }

  // Load endpoints from storage
  loadEndpoints(): void {
    try {
      const stored = localStorage.getItem('webhook_endpoints')
      if (stored) {
        this.endpoints = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load webhook endpoints:', error)
      this.endpoints = []
    }
  }

  // Test webhook endpoint
  async testWebhook(id: string): Promise<boolean> {
    const endpoint = this.endpoints.find(e => e.id === id)
    if (!endpoint) return false

    const testEvent: WebhookEvent = {
      id: `test_${Date.now()}`,
      type: 'reservation.created',
      timestamp: new Date().toISOString(),
      data: {
        reservation: {
          id: 'test_reservation',
          guest_name: 'Test Guest',
          room_number: '101',
          check_in_date: new Date().toISOString(),
          check_out_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'confirmed'
        }
      }
    }

    try {
      await this.sendWebhook(endpoint, testEvent)
      return true
    } catch (error) {
      return false
    }
  }
}

// Singleton instance
export const webhookService = new WebhookService()

// Initialize on load
if (typeof window !== 'undefined') {
  webhookService.loadEndpoints()
}

// Helper functions for common webhook events
export async function triggerReservationCreated(reservation: any) {
  await webhookService.triggerWebhook({
    id: `res_created_${Date.now()}`,
    type: 'reservation.created',
    timestamp: new Date().toISOString(),
    data: { reservation }
  })
}

export async function triggerReservationUpdated(reservation: any, previousState?: any) {
  await webhookService.triggerWebhook({
    id: `res_updated_${Date.now()}`,
    type: 'reservation.updated',
    timestamp: new Date().toISOString(),
    data: { reservation, previous_state: previousState }
  })
}

export async function triggerReservationCancelled(reservation: any) {
  await webhookService.triggerWebhook({
    id: `res_cancelled_${Date.now()}`,
    type: 'reservation.cancelled',
    timestamp: new Date().toISOString(),
    data: { reservation }
  })
}

export async function triggerGuestCheckedIn(reservation: any, guest: any) {
  await webhookService.triggerWebhook({
    id: `guest_checkin_${Date.now()}`,
    type: 'guest.checked_in',
    timestamp: new Date().toISOString(),
    data: { reservation, guest }
  })
}

export async function triggerGuestCheckedOut(reservation: any, guest: any) {
  await webhookService.triggerWebhook({
    id: `guest_checkout_${Date.now()}`,
    type: 'guest.checked_out',
    timestamp: new Date().toISOString(),
    data: { reservation, guest }
  })
}