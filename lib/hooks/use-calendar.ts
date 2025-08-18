import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMemo } from 'react'
import { reservationKeys } from './use-reservations'

const supabase = createClient()

interface CalendarFilters {
  propertyId?: string
  startDate: string
  endDate: string
  roomIds?: string[]
  statuses?: string[]
}

// Enhanced calendar data hook with performance optimizations
export function useCalendarData(filters: CalendarFilters) {
  return useQuery({
    queryKey: [...reservationKeys.all, 'calendar', filters],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          status,
          confirmation_number,
          adults,
          children,
          total_amount,
          special_requests,
          room_id,
          guest_id,
          guests (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          rooms (
            id,
            room_number,
            room_type,
            property_id,
            status
          )
        `)

      // Apply property filter
      if (filters.propertyId) {
        query = query.eq('rooms.property_id', filters.propertyId)
      }

      // Apply date range filter - reservations that overlap with the date range
      query = query.or(`and(check_in_date.gte.${filters.startDate},check_in_date.lte.${filters.endDate}),and(check_out_date.gte.${filters.startDate},check_out_date.lte.${filters.endDate}),and(check_in_date.lte.${filters.startDate},check_out_date.gte.${filters.endDate})`)

      // Apply room filter
      if (filters.roomIds && filters.roomIds.length > 0) {
        query = query.in('room_id', filters.roomIds)
      }

      // Apply status filter
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      const { data, error } = await query.order('check_in_date', { ascending: true })

      if (error) throw error

      // Transform data for easier usage
      return data?.map(reservation => ({
        ...reservation,
        guest_name: reservation.guests 
          ? `${(reservation.guests as any).first_name} ${(reservation.guests as any).last_name}`.trim()
          : 'N/A',
        room_number: (reservation.rooms as any)?.room_number || 'N/A',
        room_type: (reservation.rooms as any)?.room_type || 'N/A',
        room_status: (reservation.rooms as any)?.status || 'unknown'
      })) || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - longer stale time for better performance
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
    refetchInterval: 1000 * 60 * 10, // Auto-refresh every 10 minutes (reduced frequency)
    refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
    refetchOnMount: false, // Only refetch if data is stale
  })
}

// Hook for room availability within a date range
export function useRoomAvailability(propertyId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['room-availability', propertyId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return []

      // Get all rooms for the property
      let roomsQuery = supabase.from('rooms').select('*')
      if (propertyId) {
        roomsQuery = roomsQuery.eq('property_id', propertyId)
      }

      const { data: rooms, error: roomsError } = await roomsQuery

      if (roomsError) throw roomsError

      // Get reservations that overlap with the date range
      let reservationsQuery = supabase
        .from('reservations')
        .select('room_id, check_in_date, check_out_date, status')
        .neq('status', 'cancelled')

      if (propertyId) {
        reservationsQuery = reservationsQuery.eq('rooms.property_id', propertyId)
      }

      reservationsQuery = reservationsQuery.or(`and(check_in_date.lt.${endDate},check_out_date.gt.${startDate})`)

      const { data: reservations, error: reservationsError } = await reservationsQuery

      if (reservationsError) throw reservationsError

      // Calculate availability for each room
      const availability = rooms?.map(room => {
        const roomReservations = reservations?.filter(r => r.room_id === room.id) || []
        
        return {
          ...room,
          isAvailable: roomReservations.length === 0,
          reservationCount: roomReservations.length,
          conflictingReservations: roomReservations
        }
      }) || []

      return availability
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Hook for calendar statistics
export function useCalendarStats(propertyId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['calendar-stats', propertyId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null

      let query = supabase
        .from('reservations')
        .select(`
          status,
          check_in_date,
          check_out_date,
          total_amount,
          adults,
          children,
          rooms (property_id)
        `)

      if (propertyId) {
        query = query.eq('rooms.property_id', propertyId)
      }

      // Get reservations in the date range
      query = query.or(`and(check_in_date.gte.${startDate},check_in_date.lte.${endDate}),and(check_out_date.gte.${startDate},check_out_date.lte.${endDate}),and(check_in_date.lte.${startDate},check_out_date.gte.${endDate})`)

      const { data, error } = await query

      if (error) throw error

      // Calculate statistics
      const stats = data?.reduce((acc, reservation) => {
        // Count by status
        acc.statusCounts[reservation.status] = (acc.statusCounts[reservation.status] || 0) + 1

        // Revenue calculation
        if (reservation.total_amount && reservation.status !== 'cancelled') {
          acc.totalRevenue += reservation.total_amount
        }

        // Guest count
        acc.totalGuests += (reservation.adults || 0) + (reservation.children || 0)

        // Check-ins and check-outs in period
        const checkInDate = reservation.check_in_date
        const checkOutDate = reservation.check_out_date

        if (checkInDate >= startDate && checkInDate <= endDate) {
          acc.checkInsInPeriod++
        }

        if (checkOutDate >= startDate && checkOutDate <= endDate) {
          acc.checkOutsInPeriod++
        }

        return acc
      }, {
        statusCounts: {} as Record<string, number>,
        totalRevenue: 0,
        totalGuests: 0,
        checkInsInPeriod: 0,
        checkOutsInPeriod: 0,
        totalReservations: data?.length || 0
      })

      return stats
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Hook for optimized calendar grid data
export function useCalendarGrid(propertyId?: string, startDate?: string, endDate?: string, viewType?: string) {
  const { data: reservations, isLoading } = useCalendarData({
    propertyId: propertyId || '',
    startDate: startDate || '',
    endDate: endDate || ''
  })

  const gridData = useMemo(() => {
    if (!reservations || !startDate || !endDate) return {}

    const grid: Record<string, Record<string, any[]>> = {}

    // Generate date range
    const dates: Date[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date))
    }

    // Group reservations by room and date
    reservations.forEach(reservation => {
      if (!reservation.room_id) return

      if (!grid[reservation.room_id]) {
        grid[reservation.room_id] = {}
      }

      const checkIn = new Date(reservation.check_in_date)
      const checkOut = new Date(reservation.check_out_date)

      dates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        
        if (!grid[reservation.room_id][dateKey]) {
          grid[reservation.room_id][dateKey] = []
        }

        // Check if reservation spans this date
        if (date >= checkIn && date < checkOut) {
          grid[reservation.room_id][dateKey].push({
            ...reservation,
            isCheckIn: date.toDateString() === checkIn.toDateString(),
            isCheckOut: date.toDateString() === checkOut.toDateString(),
            isStayover: date > checkIn && date < checkOut
          })
        }
      })
    })

    return { grid, dates }
  }, [reservations, startDate, endDate])

  return {
    ...gridData,
    reservations,
    isLoading
  }
}

// Hook for real-time calendar updates
export function useRealtimeCalendar(propertyId?: string) {
  const queryClient = useQueryClient()

  // Enhanced auto-refresh with optimistic updates
  const refreshCalendarData = () => {
    queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    queryClient.invalidateQueries({ queryKey: ['calendar-stats'] })
    queryClient.invalidateQueries({ queryKey: ['room-availability'] })
  }

  // Optimistic update for better UX
  const optimisticUpdate = (reservationId: string, updates: any) => {
    // Update cached data immediately for better perceived performance
    queryClient.setQueriesData(
      { queryKey: reservationKeys.lists() },
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData
        
        return oldData.map((reservation: any) =>
          reservation.id === reservationId
            ? { ...reservation, ...updates, updated_at: new Date().toISOString() }
            : reservation
        )
      }
    )
  }
  
  return {
    isConnected: true,
    lastUpdate: new Date(),
    refreshCalendarData,
    optimisticUpdate
  }
}

// Mutation for drag and drop updates with optimistic updates
export function useCalendarReservationUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      newRoomId, 
      newCheckIn, 
      newCheckOut 
    }: {
      reservationId: string
      newRoomId?: string
      newCheckIn?: string
      newCheckOut?: string
    }) => {
      const updates: any = {}
      
      if (newRoomId) updates.room_id = newRoomId
      if (newCheckIn) updates.check_in_date = newCheckIn
      if (newCheckOut) updates.check_out_date = newCheckOut

      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', reservationId)
        .select(`
          *,
          guests (first_name, last_name),
          rooms (room_number, room_type)
        `)
        .single()

      if (error) throw error
      return data
    },
    // Optimistic update for immediate UI feedback
    onMutate: async ({ reservationId, newRoomId, newCheckIn, newCheckOut }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: reservationKeys.all })

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: reservationKeys.lists() })

      // Optimistically update
      const optimisticUpdates: any = {}
      if (newRoomId) optimisticUpdates.room_id = newRoomId
      if (newCheckIn) optimisticUpdates.check_in_date = newCheckIn
      if (newCheckOut) optimisticUpdates.check_out_date = newCheckOut

      queryClient.setQueriesData(
        { queryKey: reservationKeys.lists() },
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData
          
          return oldData.map((reservation: any) =>
            reservation.id === reservationId
              ? { ...reservation, ...optimisticUpdates, updated_at: new Date().toISOString() }
              : reservation
          )
        }
      )

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] })
      queryClient.invalidateQueries({ queryKey: ['room-availability'] })
    },
  })
}