import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

const supabase = createClient()

type Payment = Database['public']['Tables']['payments']['Row'] & {
  reservation_number?: string
  guest_name?: string
  guest_email?: string
}
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...paymentKeys.lists(), { filters }] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  stats: (propertyId?: string) => [...paymentKeys.all, 'stats', propertyId] as const,
}

// Get all payments
export function usePayments(propertyId?: string, filters?: {
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: paymentKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          reservations (
            confirmation_number,
            guest_id,
            rooms (
              property_id
            ),
            guests (
              first_name,
              last_name,
              email
            )
          )
        `)

      if (propertyId) {
        query = query.eq('reservations.rooms.property_id', propertyId)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.method && filters.method !== 'all') {
        query = query.eq('payment_method', filters.method)
      }

      if (filters?.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('payment_date', filters.dateTo)
      }

      const { data, error } = await query.order('payment_date', { ascending: false })

      if (error) throw error

      // Transform data to include reservation_number, guest_name, and guest_email
      const transformedData = data.map(payment => ({
        ...payment,
        reservation_number: payment.reservations?.confirmation_number || 'N/A',
        guest_name: payment.reservations?.guests 
          ? `${payment.reservations.guests.first_name} ${payment.reservations.guests.last_name}`.trim()
          : 'N/A',
        guest_email: payment.reservations?.guests?.email || 'N/A'
      }))

      return transformedData
    },
  })
}

// Get payment by ID
export function usePayment(id: string | null) {
  return useQuery({
    queryKey: paymentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          reservations (
            confirmation_number,
            guest_id,
            guests (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Transform data to include reservation_number, guest_name, and guest_email
      const transformedPayment = {
        ...data,
        reservation_number: data.reservations?.confirmation_number || 'N/A',
        guest_name: data.reservations?.guests 
          ? `${data.reservations.guests.first_name} ${data.reservations.guests.last_name}`.trim()
          : 'N/A',
        guest_email: data.reservations?.guests?.email || 'N/A'
      }
      
      return transformedPayment
    },
    enabled: !!id,
  })
}

// Get payment statistics
export function usePaymentStats(propertyId?: string) {
  return useQuery({
    queryKey: paymentKeys.stats(propertyId),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)
      
      let query = supabase
        .from('payments')
        .select(`
          amount, 
          payment_method, 
          status, 
          payment_date,
          reservations (
            rooms (
              property_id
            )
          )
        `)
      
      if (propertyId) {
        query = query.eq('reservations.rooms.property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data.reduce((acc, payment) => {
        acc.total_transactions++
        
        if (payment.status === 'completed') {
          acc.total_revenue += payment.amount
        }
        
        if (payment.status === 'pending') {
          acc.pending_amount += payment.amount
        }
        
        // Today's transactions
        if (payment.payment_date && payment.payment_date.startsWith(today)) {
          acc.today_transactions++
          if (payment.status === 'completed') {
            acc.today_revenue += payment.amount
          }
        }
        
        // This month's transactions
        if (payment.payment_date && payment.payment_date.startsWith(thisMonth)) {
          acc.month_transactions++
          if (payment.status === 'completed') {
            acc.month_revenue += payment.amount
          }
        }
        
        // Payment methods breakdown
        if (payment.status === 'completed') {
          acc.payment_methods[payment.payment_method] = 
            (acc.payment_methods[payment.payment_method] || 0) + payment.amount
        }
        
        // Status breakdown
        acc.status_breakdown[payment.status] = 
          (acc.status_breakdown[payment.status] || 0) + 1
        
        return acc
      }, {
        total_transactions: 0,
        total_revenue: 0,
        pending_amount: 0,
        today_transactions: 0,
        today_revenue: 0,
        month_transactions: 0,
        month_revenue: 0,
        payment_methods: {} as Record<string, number>,
        status_breakdown: {} as Record<string, number>
      })

      return stats
    },
  })
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payment: PaymentInsert) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select(`
          *,
          reservations (
            confirmation_number,
            guest_id,
            guests (
              first_name,
              last_name,
              email
            )
          )
        `)
        .single()

      if (error) throw error

      // Transform data
      const transformedPayment = {
        ...data,
        reservation_number: data.reservations?.confirmation_number || 'N/A',
        guest_name: data.reservations?.guests 
          ? `${data.reservations.guests.first_name} ${data.reservations.guests.last_name}`.trim()
          : 'N/A',
        guest_email: data.reservations?.guests?.email || 'N/A'
      }
      
      return transformedPayment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PaymentUpdate }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          reservations (
            confirmation_number,
            guest_id,
            guests (
              first_name,
              last_name,
              email
            )
          )
        `)
        .single()

      if (error) throw error

      // Transform data
      const transformedPayment = {
        ...data,
        reservation_number: data.reservations?.confirmation_number || 'N/A',
        guest_name: data.reservations?.guests 
          ? `${data.reservations.guests.first_name} ${data.reservations.guests.last_name}`.trim()
          : 'N/A',
        guest_email: data.reservations?.guests?.email || 'N/A'
      }
      
      return transformedPayment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.setQueryData(paymentKeys.detail(data.id), data)
    },
  })
}

// Update payment status
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database['public']['Enums']['payment_status'] }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

// Process refund
export function useProcessRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount, reason }: { id: string; amount?: number; reason?: string }) => {
      // Update payment status to refunded and add refund details
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'refunded',
          description: reason ? `Dikembalikan: ${reason}` : 'Dikembalikan',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}