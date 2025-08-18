'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useProperty } from '@/lib/context/property-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { reservationKeys } from './use-reservations'
import { roomKeys } from './use-rooms'
import { guestKeys } from './use-guests'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/**
 * Smart prefetching hook that anticipates user actions and preloads data
 * Based on current page and user patterns
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient()
  const { currentProperty } = useProperty()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!currentProperty?.id) return

    const prefetchBasedOnPage = () => {
      const propertyId = currentProperty.id

      switch (pathname) {
        case '/dashboard':
          // On dashboard, prefetch today's data and commonly accessed pages
          prefetchDashboardData(propertyId)
          prefetchReservationsPage(propertyId)
          prefetchRoomsPage(propertyId)
          break

        case '/dashboard/reservations':
          // On reservations, prefetch guest data and room data for quick editing
          prefetchGuestData(propertyId)
          prefetchRoomData(propertyId)
          prefetchCalendarData(propertyId)
          break

        case '/dashboard/rooms':
          // On rooms page, prefetch housekeeping data and current reservations
          prefetchHousekeepingData(propertyId)
          prefetchActiveReservations(propertyId)
          break

        case '/dashboard/guests':
          // On guests page, prefetch their reservation history
          prefetchGuestReservations(propertyId)
          break

        case '/dashboard/reports':
          // On reports, prefetch recent analytics data
          prefetchReportsData(propertyId)
          break

        default:
          // For other pages, prefetch dashboard data as fallback
          prefetchDashboardData(propertyId)
          break
      }
    }

    // Initial prefetch
    prefetchBasedOnPage()

    // Prefetch on hover events for navigation links
    const handleLinkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href^="/dashboard"]')
      if (link) {
        const href = link.getAttribute('href')
        if (href) {
          prefetchPageData(href, currentProperty.id)
        }
      }
    }

    // Set up hover prefetching
    document.addEventListener('mouseover', handleLinkHover)

    return () => {
      document.removeEventListener('mouseover', handleLinkHover)
    }
  }, [pathname, currentProperty?.id, queryClient])

  // Prefetch functions for different page types
  const prefetchDashboardData = (propertyId: string) => {
    // Prefetch today's key metrics
    const today = new Date().toISOString().split('T')[0]
    
    queryClient.prefetchQuery({
      queryKey: [...reservationKeys.all, 'stats', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select('status, check_in_date, check_out_date, total_amount, rooms(property_id)')
          .eq('rooms.property_id', propertyId)
        return data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    })

    queryClient.prefetchQuery({
      queryKey: [...roomKeys.all, 'stats', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('rooms')
          .select('status, is_active')
          .eq('property_id', propertyId)
        return data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchReservationsPage = (propertyId: string) => {
    queryClient.prefetchQuery({
      queryKey: reservationKeys.list({ propertyId }),
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select(`
            *,
            guests (id, first_name, last_name, email, phone),
            rooms (id, room_number, room_type, property_id)
          `)
          .eq('rooms.property_id', propertyId)
          .order('check_in_date', { ascending: true })
        return data
      },
      staleTime: 3 * 60 * 1000, // 3 minutes
    })
  }

  const prefetchRoomsPage = (propertyId: string) => {
    queryClient.prefetchQuery({
      queryKey: roomKeys.list({ propertyId }),
      queryFn: async () => {
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .eq('property_id', propertyId)
          .order('room_number', { ascending: true })
        return data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchGuestData = (propertyId: string) => {
    queryClient.prefetchQuery({
      queryKey: guestKeys.list({ propertyId }),
      queryFn: async () => {
        // Get guests who have reservations in this property
        const { data } = await supabase
          .from('guests')
          .select(`
            *,
            reservations!inner(rooms!inner(property_id))
          `)
          .eq('reservations.rooms.property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(50) // Limit for performance
        
        // Remove nested reservation data for clean response
        return data?.map(guest => {
          const { reservations, ...cleanGuest } = guest
          return cleanGuest
        })
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchRoomData = (propertyId: string) => {
    queryClient.prefetchQuery({
      queryKey: roomKeys.list({ propertyId }),
      queryFn: async () => {
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .eq('property_id', propertyId)
          .eq('is_active', true)
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchCalendarData = (propertyId: string) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 7) // 1 week before
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 30) // 1 month ahead

    queryClient.prefetchQuery({
      queryKey: reservationKeys.calendar(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ),
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select(`
            id, check_in_date, check_out_date, status, confirmation_number,
            adults, children,
            guests (first_name, last_name),
            rooms (id, room_number, room_type, property_id)
          `)
          .eq('rooms.property_id', propertyId)
          .gte('check_in_date', startDate.toISOString().split('T')[0])
          .lte('check_out_date', endDate.toISOString().split('T')[0])
        return data
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  const prefetchHousekeepingData = (propertyId: string) => {
    // Prefetch housekeeping tasks and room statuses
    queryClient.prefetchQuery({
      queryKey: ['housekeeping', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('rooms')
          .select(`
            *,
            housekeeping (*)
          `)
          .eq('property_id', propertyId)
          .in('status', ['dirty', 'inspected', 'out_of_order'])
        return data
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  const prefetchActiveReservations = (propertyId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    queryClient.prefetchQuery({
      queryKey: [...reservationKeys.all, 'active', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select(`
            *,
            guests (first_name, last_name),
            rooms (room_number, room_type, property_id)
          `)
          .eq('rooms.property_id', propertyId)
          .in('status', ['confirmed', 'checked_in'])
          .lte('check_in_date', today)
          .gte('check_out_date', today)
        return data
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    })
  }

  const prefetchGuestReservations = (propertyId: string) => {
    // Prefetch recent guest reservations for history viewing
    queryClient.prefetchQuery({
      queryKey: [...reservationKeys.all, 'recent', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select(`
            *,
            guests (first_name, last_name, email),
            rooms (room_number, room_type, property_id)
          `)
          .eq('rooms.property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(20)
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchReportsData = (propertyId: string) => {
    // Prefetch basic report data
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    queryClient.prefetchQuery({
      queryKey: ['reports', 'recent', propertyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select('status, check_in_date, total_amount, created_at, rooms(property_id)')
          .eq('rooms.property_id', propertyId)
          .gte('created_at', weekAgo.toISOString())
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchPageData = (href: string, propertyId: string) => {
    // Prefetch data based on hovered link
    switch (href) {
      case '/dashboard/reservations':
        prefetchReservationsPage(propertyId)
        break
      case '/dashboard/rooms':
        prefetchRoomsPage(propertyId)
        break
      case '/dashboard/guests':
        prefetchGuestData(propertyId)
        break
      case '/dashboard/reports':
        prefetchReportsData(propertyId)
        break
      case '/dashboard/housekeeping':
        prefetchHousekeepingData(propertyId)
        break
    }
  }
}

/**
 * Hook to prefetch specific entity details on hover/focus
 */
export function usePrefetchOnHover() {
  const queryClient = useQueryClient()

  const prefetchReservation = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: reservationKeys.detail(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('reservations')
          .select(`
            *,
            guests (*),
            rooms (*),
            payments (*)
          `)
          .eq('id', id)
          .single()
        return data
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  const prefetchRoom = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: roomKeys.detail(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .single()
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchGuest = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: guestKeys.detail(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('guests')
          .select(`
            *,
            reservations (
              *,
              rooms (room_number, room_type)
            )
          `)
          .eq('id', id)
          .single()
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    prefetchReservation,
    prefetchRoom,
    prefetchGuest,
  }
}