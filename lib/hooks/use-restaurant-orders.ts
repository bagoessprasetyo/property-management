import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { 
  RestaurantOrder, 
  RestaurantOrderInsert, 
  RestaurantOrderUpdate,
  RestaurantOrderWithDetails,
  RestaurantOrderItem,
  RestaurantOrderItemInsert,
  CreateOrderFormData,
  OrderFilters,
  OrderStatus,
  KitchenOrder
} from '@/lib/types/restaurant'

const supabase = createClient()

// Query keys
export const restaurantOrderKeys = {
  all: ['restaurant-orders'] as const,
  lists: () => [...restaurantOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...restaurantOrderKeys.lists(), { filters }] as const,
  details: () => [...restaurantOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantOrderKeys.details(), id] as const,
  kitchen: () => [...restaurantOrderKeys.all, 'kitchen'] as const,
}

// Get all restaurant orders
export function useRestaurantOrders(propertyId?: string, filters?: OrderFilters) {
  return useQuery({
    queryKey: restaurantOrderKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_orders')
        .select(`
          *,
          items:restaurant_order_items(
            *,
            item:restaurant_items(*)
          ),
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number)
        `)
        .order('created_at', { ascending: false })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters?.order_type?.length) {
        query = query.in('order_type', filters.order_type)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters?.guest_name) {
        query = query.or(`guest.first_name.ilike.%${filters.guest_name}%,guest.last_name.ilike.%${filters.guest_name}%`)
      }

      if (filters?.room_number) {
        query = query.eq('room.room_number', filters.room_number)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantOrderWithDetails[]
    },
  })
}

// Get active orders (not delivered or cancelled)
export function useActiveRestaurantOrders(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantOrderKeys.lists(), 'active', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_orders')
        .select(`
          *,
          items:restaurant_order_items(
            *,
            item:restaurant_items(*)
          ),
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number)
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantOrderWithDetails[]
    },
  })
}

// Get kitchen orders (for kitchen display)
export function useKitchenOrders(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantOrderKeys.kitchen(), propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_orders')
        .select(`
          *,
          items:restaurant_order_items(
            *,
            item:restaurant_items(name, preparation_time)
          ),
          guest:guests(first_name, last_name),
        `)
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform to kitchen order format
      return (data as any[]).map(order => {
        const items = order.items.map((item: any) => ({
          id: item.id,
          item_name: item.item.name,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
          preparation_time: item.item.preparation_time || 15
        }))

        const total_prep_time = Math.max(
          ...items.map((item: any) => item.preparation_time),
          15
        )

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          order_type: order.order_type,
          items,
          guest_name: order.guest ? `${order.guest.first_name} ${order.guest.last_name}` : 'Walk-in',
          room_number: order.room?.room_number,
          special_instructions: order.special_instructions,
          estimated_ready_time: order.estimated_ready_time,
          created_at: order.created_at,
          total_prep_time
        }
      }) as KitchenOrder[]
    },
    refetchInterval: 30000, // Refresh every 30 seconds for kitchen display
  })
}

// Get restaurant order by ID
export function useRestaurantOrder(id: string | null) {
  return useQuery({
    queryKey: restaurantOrderKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select(`
          *,
          items:restaurant_order_items(
            *,
            item:restaurant_items(*)
          ),
          guest:guests(id, first_name, last_name, phone),
          reservation:reservations(id, confirmation_number)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RestaurantOrderWithDetails
    },
    enabled: !!id,
  })
}

// Create restaurant order with items
export function useCreateRestaurantOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: CreateOrderFormData & { property_id: string }) => {
      const { items, ...orderInfo } = orderData
      
      // Calculate total amount
      const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('restaurant_orders')
        .insert({
          ...orderInfo,
          total_amount,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems: RestaurantOrderItemInsert[] = items.map(item => ({
        order_id: order.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        special_instructions: item.special_instructions,
      }))

      const { error: itemsError } = await supabase
        .from('restaurant_order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return order as RestaurantOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantOrderKeys.all })
    },
  })
}

// Update restaurant order
export function useUpdateRestaurantOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RestaurantOrderUpdate }) => {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantOrder
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantOrderKeys.all })
      queryClient.setQueryData(restaurantOrderKeys.detail(data.id), data)
    },
  })
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, estimated_ready_time }: { 
      id: string; 
      status: OrderStatus;
      estimated_ready_time?: string;
    }) => {
      const updates: any = { status }
      
      if (status === 'confirmed' && estimated_ready_time) {
        updates.estimated_ready_time = estimated_ready_time
      }
      
      if (status === 'delivered' || status === 'cancelled') {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('restaurant_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantOrder
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantOrderKeys.all })
      queryClient.setQueryData(restaurantOrderKeys.detail(data.id), data)
    },
  })
}

// Cancel restaurant order
export function useCancelRestaurantOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantOrder
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantOrderKeys.all })
      queryClient.setQueryData(restaurantOrderKeys.detail(data.id), data)
    },
  })
}

// Get orders statistics
export function useRestaurantOrdersStats(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantOrderKeys.all, 'stats', propertyId],
    queryFn: async () => {
      let query = supabase.from('restaurant_orders').select('status, total_amount, created_at')
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const today = new Date().toISOString().split('T')[0]
      const todayOrders = data.filter(order => 
        order.created_at.startsWith(today)
      )

      const stats = data.reduce((acc, order) => {
        acc.total++
        acc.byStatus[order.status] = (acc.byStatus[order.status] || 0) + 1
        acc.total_revenue += order.total_amount || 0
        return acc
      }, {
        total: 0,
        byStatus: {} as Record<string, number>,
        total_revenue: 0
      })

      const todayStats = todayOrders.reduce((acc, order) => {
        acc.total++
        acc.total_revenue += order.total_amount || 0
        return acc
      }, {
        total: 0,
        total_revenue: 0
      })

      return {
        total_orders: stats.total,
        orders_by_status: stats.byStatus,
        total_revenue: stats.total_revenue,
        today_orders: todayStats.total,
        today_revenue: todayStats.total_revenue,
        active_orders: (stats.byStatus['pending'] || 0) + 
                      (stats.byStatus['confirmed'] || 0) + 
                      (stats.byStatus['preparing'] || 0) + 
                      (stats.byStatus['ready'] || 0),
        average_order_value: stats.total > 0 ? stats.total_revenue / stats.total : 0
      }
    },
  })
}