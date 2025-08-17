import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Guest = Database['public']['Tables']['guests']['Row']
type GuestInsert = Database['public']['Tables']['guests']['Insert']
type GuestUpdate = Database['public']['Tables']['guests']['Update']

const supabase = createClient()

// Query keys
export const guestKeys = {
  all: ['guests'] as const,
  lists: () => [...guestKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...guestKeys.lists(), { filters }] as const,
  details: () => [...guestKeys.all, 'detail'] as const,
  detail: (id: string) => [...guestKeys.details(), id] as const,
  search: (query: string) => [...guestKeys.all, 'search', query] as const,
}

// Get all guests with optional search
export function useGuests(searchQuery?: string) {
  return useQuery({
    queryKey: guestKeys.list({ searchQuery }),
    queryFn: async () => {
      let query = supabase
        .from('guests')
        .select('*')

      if (searchQuery && searchQuery.length > 0) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
  })
}

// Get guest by ID
export function useGuest(id: string | null) {
  return useQuery({
    queryKey: guestKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Search guests for autocomplete
export function useSearchGuests(query: string) {
  return useQuery({
    queryKey: guestKeys.search(query),
    queryFn: async () => {
      if (query.length < 2) return []

      const { data, error } = await supabase
        .from('guests')
        .select('id, first_name, last_name, email, phone')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: query.length >= 2,
  })
}

// Get guest reservations
export function useGuestReservations(guestId: string | null) {
  return useQuery({
    queryKey: [...guestKeys.all, 'reservations', guestId],
    queryFn: async () => {
      if (!guestId) return []

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms (
            room_number,
            room_type
          )
        `)
        .eq('guest_id', guestId)
        .order('check_in_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!guestId,
  })
}

// Create guest
export function useCreateGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (guest: GuestInsert) => {
      const { data, error } = await supabase
        .from('guests')
        .insert(guest)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.all })
    },
  })
}

// Update guest
export function useUpdateGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: GuestUpdate }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: guestKeys.all })
      queryClient.setQueryData(guestKeys.detail(data.id), data)
    },
  })
}

// Delete guest
export function useDeleteGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.all })
    },
  })
}

// Validate Indonesian ID (KTP)
export function validateKTP(ktp: string): boolean {
  // Basic KTP validation: 16 digits
  const ktpRegex = /^\d{16}$/
  return ktpRegex.test(ktp)
}

// Validate Indonesian phone number
export function validateIndonesianPhone(phone: string): boolean {
  // Indonesian phone number validation
  const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Format Indonesian phone number
export function formatIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.slice(1)}`
  } else {
    return `+62${cleaned}`
  }
}