'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { reservationKeys } from '@/lib/hooks/use-reservations'

interface RealtimeNotification {
  id: string
  type: 'reservation_created' | 'reservation_updated' | 'reservation_cancelled' | 'status_changed'
  title: string
  message: string
  data?: any
  timestamp: Date
}

interface RealtimeContextType {
  isConnected: boolean
  notifications: RealtimeNotification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
  propertyId?: string
}

export function RealtimeProvider({ children, propertyId }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const queryClient = useQueryClient()
  const supabase = createClient()

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep only last 50 notifications
  }, [])

  // Debounced query invalidation to prevent excessive re-fetching
  const invalidateQueries = useCallback(() => {
    // Batch invalidations together to reduce network requests
    Promise.all([
      queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['room-availability'] })
    ]).catch(console.error)
  }, [queryClient])

  // Debounce invalidation to prevent excessive calls
  const debouncedInvalidateQueries = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(invalidateQueries, 500) // Wait 500ms before invalidating
    }
  }, [invalidateQueries])

  useEffect(() => {
    if (!propertyId) return

    setConnectionStatus('connecting')

    // Subscribe to reservation changes
    const reservationChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `rooms.property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('Reservation change received:', payload)
          
          const { eventType, new: newRecord, old: oldRecord } = payload
          
          switch (eventType) {
            case 'INSERT':
              addNotification({
                type: 'reservation_created',
                title: 'Reservasi Baru',
                message: `Reservasi baru telah dibuat untuk ${newRecord.guest_name || 'tamu'}`,
                data: newRecord
              })
              break
              
            case 'UPDATE':
              // Check if status changed
              if (oldRecord?.status !== newRecord?.status) {
                const statusLabels = {
                  pending: 'Menunggu',
                  confirmed: 'Dikonfirmasi',
                  checked_in: 'Check-in',
                  checked_out: 'Check-out',
                  cancelled: 'Dibatalkan',
                  no_show: 'Tidak Datang'
                }
                
                addNotification({
                  type: 'status_changed',
                  title: 'Status Diperbarui',
                  message: `Status reservasi berubah menjadi ${statusLabels[newRecord.status as keyof typeof statusLabels] || newRecord.status}`,
                  data: newRecord
                })
              } else {
                addNotification({
                  type: 'reservation_updated',
                  title: 'Reservasi Diperbarui',
                  message: `Reservasi ${newRecord.confirmation_number || ''} telah diperbarui`,
                  data: newRecord
                })
              }
              break
              
            case 'DELETE':
              addNotification({
                type: 'reservation_cancelled',
                title: 'Reservasi Dihapus',
                message: `Reservasi ${oldRecord.confirmation_number || ''} telah dihapus`,
                data: oldRecord
              })
              break
          }
          
          // Invalidate related queries with debouncing
          debouncedInvalidateQueries()
        }
      )
      .subscribe((status) => {
        console.log('Reservation subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionStatus('connected')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setConnectionStatus('disconnected')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionStatus('error')
        }
      })

    // Subscribe to room status changes
    const roomChannel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('Room change received:', payload)
          
          const { new: newRecord, old: oldRecord } = payload
          
          if (oldRecord?.status !== newRecord?.status) {
            const statusLabels = {
              clean: 'Bersih',
              dirty: 'Kotor',
              inspected: 'Inspeksi',
              out_of_order: 'Maintenance'
            }
            
            addNotification({
              type: 'reservation_updated',
              title: 'Status Kamar Diperbarui',
              message: `Kamar ${newRecord.room_number} status berubah menjadi ${statusLabels[newRecord.status as keyof typeof statusLabels] || newRecord.status}`,
              data: newRecord
            })
          }
          
          // Invalidate room-related queries
          queryClient.invalidateQueries({ queryKey: ['rooms'] })
          queryClient.invalidateQueries({ queryKey: ['room-availability'] })
        }
      )
      .subscribe()

    return () => {
      reservationChannel.unsubscribe()
      roomChannel.unsubscribe()
    }
  }, [propertyId, addNotification, invalidateQueries, supabase, queryClient])

  // Auto-refresh data periodically as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        invalidateQueries()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, invalidateQueries])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !('read' in n) || !n.read).length

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        connectionStatus
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}