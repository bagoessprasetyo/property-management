import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

const supabase = createClient()

// Query keys
export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...reservationKeys.lists(), { filters }] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
  calendar: (startDate: string, endDate: string) => [...reservationKeys.all, 'calendar', startDate, endDate] as const,
}

// Get all reservations
export function useReservations(propertyId?: string, filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: reservationKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
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
            property_id
          )
        `)

      if (propertyId) {
        query = query.eq('rooms.property_id', propertyId)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.dateFrom) {
        query = query.gte('check_in_date', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('check_out_date', filters.dateTo)
      }

      const { data, error } = await query
        .order('check_in_date', { ascending: true })

      if (error) throw error

      // Transform data to include guest_name, room_number, and room_type for easier display
      const transformedData = data?.map(reservation => ({
        ...reservation,
        guest_name: reservation.guests 
          ? `${reservation.guests.first_name} ${reservation.guests.last_name}`.trim()
          : 'N/A',
        room_number: reservation.rooms?.room_number || 'N/A',
        room_type: reservation.rooms?.room_type || 'N/A'
      }))
      
      return transformedData
    },
  })
}

// Get reservation by ID
export function useReservation(id: string | null) {
  return useQuery({
    queryKey: reservationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests (
            *
          ),
          rooms (
            *
          ),
          payments (
            *
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Transform data to include guest_name, room_number, and room_type for easier display
      const transformedReservation = {
        ...data,
        guest_name: data.guests 
          ? `${data.guests.first_name} ${data.guests.last_name}`.trim()
          : 'N/A',
        room_number: data.rooms?.room_number || 'N/A',
        room_type: data.rooms?.room_type || 'N/A'
      }
      
      return transformedReservation
    },
    enabled: !!id,
  })
}

// Get calendar data for reservation grid
export function useReservationCalendar(propertyId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: reservationKeys.calendar(startDate, endDate),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          status,
          confirmation_number,
          adults,
          children,
          guests (
            first_name,
            last_name
          ),
          rooms (
            id,
            room_number,
            room_type,
            property_id
          )
        `)
        .eq('rooms.property_id', propertyId)
        .or(`and(check_in_date.gte.${startDate},check_in_date.lte.${endDate}),and(check_out_date.gte.${startDate},check_out_date.lte.${endDate}),and(check_in_date.lte.${startDate},check_out_date.gte.${endDate})`)
        .order('check_in_date', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

// Get dashboard statistics
export function useReservationStats(propertyId?: string) {
  return useQuery({
    queryKey: [...reservationKeys.all, 'stats', propertyId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      let query = supabase.from('reservations').select('status, check_in_date, check_out_date, total_amount, rooms(property_id)')
      
      if (propertyId) {
        query = query.eq('rooms.property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data.reduce((acc, reservation) => {
        // Arrivals today
        if (reservation.check_in_date === today) {
          acc.arrivalsToday++
        }
        
        // Departures today
        if (reservation.check_out_date === today) {
          acc.departuresToday++
        }
        
        // Revenue today (for check-ins)
        if (reservation.check_in_date === today && reservation.status === 'checked_in') {
          acc.revenueToday += reservation.total_amount
        }
        
        // Current occupancy
        if (reservation.check_in_date <= today && reservation.check_out_date > today && reservation.status === 'checked_in') {
          acc.currentOccupancy++
        }
        
        return acc
      }, {
        arrivalsToday: 0,
        departuresToday: 0,
        revenueToday: 0,
        currentOccupancy: 0,
      })

      return stats
    },
  })
}

// Check room availability
export function useCheckAvailability(roomId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: [...reservationKeys.all, 'availability', roomId, checkIn, checkOut],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', roomId)
        .neq('status', 'cancelled')
        .or(`and(check_in_date.lt.${checkOut},check_out_date.gt.${checkIn})`)

      if (error) throw error
      return data.length === 0 // Available if no conflicting reservations
    },
    enabled: !!roomId && !!checkIn && !!checkOut,
  })
}

// Create reservation
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservation: ReservationInsert) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select(`
          *,
          guests (
            first_name,
            last_name,
            email,
            phone
          ),
          rooms (
            room_number,
            room_type
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    },
  })
}

// Update reservation
export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ReservationUpdate }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      queryClient.setQueryData(reservationKeys.detail(data.id), data)
    },
  })
}

// Update reservation status with optimistic updates
export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database['public']['Enums']['booking_status'] }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // Optimistic update
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: reservationKeys.all })

      // Snapshot the previous value
      const previousReservation = queryClient.getQueryData(reservationKeys.detail(id))
      const previousReservations = queryClient.getQueriesData({ queryKey: reservationKeys.lists() })

      // Optimistically update the individual reservation
      if (previousReservation) {
        queryClient.setQueryData(reservationKeys.detail(id), {
          ...previousReservation,
          status,
          updated_at: new Date().toISOString()
        })
      }

      // Optimistically update reservation lists
      previousReservations.forEach(([queryKey, reservations]) => {
        if (Array.isArray(reservations)) {
          const updatedReservations = reservations.map((reservation: any) =>
            reservation.id === id 
              ? { ...reservation, status, updated_at: new Date().toISOString() }
              : reservation
          )
          queryClient.setQueryData(queryKey, updatedReservations)
        }
      })

      // Return context for rollback
      return { previousReservation, previousReservations }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousReservation) {
        queryClient.setQueryData(reservationKeys.detail(variables.id), context.previousReservation)
      }
      if (context?.previousReservations) {
        context.previousReservations.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    },
  })
}

// Cancel reservation
export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    },
  })
}