import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { 
  RestaurantBill, 
  RestaurantBillInsert, 
  RestaurantBillUpdate,
  RestaurantBillWithDetails,
  BillStatus
} from '@/lib/types/restaurant'

const supabase = createClient()

// Query keys
export const restaurantBillKeys = {
  all: ['restaurant-bills'] as const,
  lists: () => [...restaurantBillKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...restaurantBillKeys.lists(), { filters }] as const,
  details: () => [...restaurantBillKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantBillKeys.details(), id] as const,
  byReservation: (reservationId: string) => [...restaurantBillKeys.all, 'reservation', reservationId] as const,
}

// Get all restaurant bills
export function useRestaurantBills(propertyId?: string, status?: BillStatus) {
  return useQuery({
    queryKey: restaurantBillKeys.list({ propertyId, status }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_bills')
        .select(`
          *,
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number, check_out_date)
        `)
        .order('created_at', { ascending: false })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantBillWithDetails[]
    },
  })
}

// Get outstanding bills only
export function useOutstandingRestaurantBills(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantBillKeys.lists(), 'outstanding', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_bills')
        .select(`
          *,
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number, check_out_date)
        `)
        .eq('status', 'outstanding')
        .gt('outstanding_amount', 0)
        .order('created_at', { ascending: false })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantBillWithDetails[]
    },
  })
}

// Get bills for checkout validation
export function useRestaurantBillsForCheckout(reservationId: string) {
  return useQuery({
    queryKey: restaurantBillKeys.byReservation(reservationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_bills')
        .select(`
          *,
        `)
        .eq('reservation_id', reservationId)
        .eq('status', 'outstanding')

      if (error) throw error
      return data as unknown as RestaurantBillWithDetails[]
    },
    enabled: !!reservationId,
  })
}

// Get restaurant bill by ID
export function useRestaurantBill(id: string | null) {
  return useQuery({
    queryKey: restaurantBillKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('restaurant_bills')
        .select(`
          *,
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number, check_out_date)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RestaurantBillWithDetails
    },
    enabled: !!id,
  })
}

// Get bill by reservation ID
export function useRestaurantBillByReservation(reservationId: string | null) {
  return useQuery({
    queryKey: restaurantBillKeys.byReservation(reservationId || ''),
    queryFn: async () => {
      if (!reservationId) return null
      
      const { data, error } = await supabase
        .from('restaurant_bills')
        .select(`
          *,
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number, check_out_date)
        `)
        .eq('reservation_id', reservationId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore "not found" errors
      return data as RestaurantBillWithDetails | null
    },
    enabled: !!reservationId,
  })
}

// Create restaurant bill (usually done automatically by triggers)
export function useCreateRestaurantBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bill: RestaurantBillInsert) => {
      const { data, error } = await supabase
        .from('restaurant_bills')
        .insert(bill)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantBill
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantBillKeys.all })
    },
  })
}

// Update restaurant bill
export function useUpdateRestaurantBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RestaurantBillUpdate }) => {
      const { data, error } = await supabase
        .from('restaurant_bills')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantBill
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantBillKeys.all })
      queryClient.setQueryData(restaurantBillKeys.detail(data.id), data)
    },
  })
}

// Mark bill as paid
export function usePayRestaurantBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payment_amount }: { id: string; payment_amount?: number }) => {
      // First get the current bill to calculate new paid amount
      const { data: currentBill, error: fetchError } = await supabase
        .from('restaurant_bills')
        .select('total_amount, paid_amount')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const newPaidAmount = payment_amount !== undefined 
        ? currentBill.paid_amount + payment_amount
        : currentBill.total_amount

      const status: BillStatus = newPaidAmount >= currentBill.total_amount ? 'paid' : 'outstanding'

      const { data, error } = await supabase
        .from('restaurant_bills')
        .update({ 
          paid_amount: newPaidAmount,
          status 
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantBill
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantBillKeys.all })
      queryClient.setQueryData(restaurantBillKeys.detail(data.id), data)
    },
  })
}

// Void restaurant bill
export function useVoidRestaurantBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('restaurant_bills')
        .update({ status: 'void' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantBill
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantBillKeys.all })
      queryClient.setQueryData(restaurantBillKeys.detail(data.id), data)
    },
  })
}

// Get bills statistics
export function useRestaurantBillsStats(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantBillKeys.all, 'stats', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_bills')
        .select('status, total_amount, paid_amount, outstanding_amount')
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data.reduce((acc, bill) => {
        acc.total++
        acc.byStatus[bill.status] = (acc.byStatus[bill.status] || 0) + 1
        acc.total_billed += bill.total_amount || 0
        acc.total_paid += bill.paid_amount || 0
        acc.total_outstanding += bill.outstanding_amount || 0
        return acc
      }, {
        total: 0,
        byStatus: {} as Record<string, number>,
        total_billed: 0,
        total_paid: 0,
        total_outstanding: 0
      })

      return {
        total_bills: stats.total,
        bills_by_status: stats.byStatus,
        total_billed: stats.total_billed,
        total_paid: stats.total_paid,
        total_outstanding: stats.total_outstanding,
        collection_rate: stats.total_billed > 0 ? (stats.total_paid / stats.total_billed) * 100 : 0,
        outstanding_bills_count: stats.byStatus['outstanding'] || 0
      }
    },
  })
}

// Check if reservation has outstanding bills (for checkout validation)
export function useCheckOutstandingBills(reservationId: string | null) {
  return useQuery({
    queryKey: [...restaurantBillKeys.all, 'check-outstanding', reservationId],
    queryFn: async () => {
      if (!reservationId) return { has_outstanding: false, amount: 0 }
      
      const { data, error } = await supabase
        .from('restaurant_bills')
        .select('outstanding_amount')
        .eq('reservation_id', reservationId)
        .eq('status', 'outstanding')

      if (error) throw error

      const totalOutstanding = data.reduce((sum, bill) => sum + (bill.outstanding_amount || 0), 0)

      return {
        has_outstanding: totalOutstanding > 0,
        amount: totalOutstanding
      }
    },
    enabled: !!reservationId,
  })
}