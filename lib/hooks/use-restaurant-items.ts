import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { 
  RestaurantItem, 
  RestaurantItemInsert, 
  RestaurantItemUpdate,
  RestaurantItemWithCategory,
  ItemFilters
} from '@/lib/types/restaurant'

const supabase = createClient()

// Query keys
export const restaurantItemKeys = {
  all: ['restaurant-items'] as const,
  lists: () => [...restaurantItemKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...restaurantItemKeys.lists(), { filters }] as const,
  details: () => [...restaurantItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantItemKeys.details(), id] as const,
}

// Get all restaurant items
export function useRestaurantItems(propertyId?: string, filters?: ItemFilters) {
  return useQuery({
    queryKey: restaurantItemKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_items')
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      // Apply filters
      if (filters?.category_id?.length) {
        query = query.in('category_id', filters.category_id)
      }

      if (filters?.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available)
      }

      if (filters?.dietary_info?.length) {
        query = query.contains('dietary_info', filters.dietary_info)
      }

      if (filters?.price_min !== undefined) {
        query = query.gte('price', filters.price_min)
      }

      if (filters?.price_max !== undefined) {
        query = query.lte('price', filters.price_max)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantItemWithCategory[]
    },
  })
}

// Get items by category
export function useRestaurantItemsByCategory(categoryId: string, propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantItemKeys.lists(), 'by-category', categoryId, propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_items')
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .eq('category_id', categoryId)
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantItemWithCategory[]
    },
    enabled: !!categoryId,
  })
}

// Get available items only
export function useAvailableRestaurantItems(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantItemKeys.lists(), 'available', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_items')
        .select(`
          *,
          category:restaurant_categories!inner(*)
        `)
        .eq('is_available', true)
        .eq('category.is_active', true)
        .order('category.display_order', { ascending: true })
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantItemWithCategory[]
    },
  })
}

// Get restaurant item by ID
export function useRestaurantItem(id: string | null) {
  return useQuery({
    queryKey: restaurantItemKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('restaurant_items')
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RestaurantItemWithCategory
    },
    enabled: !!id,
  })
}

// Get popular items (based on order frequency)
export function usePopularRestaurantItems(propertyId?: string, limit = 10) {
  return useQuery({
    queryKey: [...restaurantItemKeys.lists(), 'popular', propertyId, limit],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_items')
        .select(`
          *,
          category:restaurant_categories(*),
          restaurant_order_items(quantity)
        `)
        .eq('is_available', true)
        .limit(limit)

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Calculate popularity based on total quantity ordered
      const itemsWithPopularity = (data as any[]).map(item => {
        const totalOrdered = item.restaurant_order_items?.reduce(
          (sum: number, orderItem: any) => sum + (orderItem.quantity || 0), 
          0
        ) || 0
        
        return {
          ...item,
          totalOrdered,
        }
      })

      // Sort by popularity and return top items
      return itemsWithPopularity
        .sort((a, b) => b.totalOrdered - a.totalOrdered)
        .slice(0, limit) as (RestaurantItemWithCategory & { totalOrdered: number })[]
    },
  })
}

// Create restaurant item
export function useCreateRestaurantItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: RestaurantItemInsert) => {
      const { data, error } = await supabase
        .from('restaurant_items')
        .insert(item)
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .single()

      if (error) throw error
      return data as RestaurantItemWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantItemKeys.all })
    },
  })
}

// Update restaurant item
export function useUpdateRestaurantItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RestaurantItemUpdate }) => {
      const { data, error } = await supabase
        .from('restaurant_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .single()

      if (error) throw error
      return data as RestaurantItemWithCategory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantItemKeys.all })
      queryClient.setQueryData(restaurantItemKeys.detail(data.id), data)
    },
  })
}

// Delete restaurant item
export function useDeleteRestaurantItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantItemKeys.all })
    },
  })
}

// Toggle item availability
export function useToggleRestaurantItemAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { data, error } = await supabase
        .from('restaurant_items')
        .update({ is_available })
        .eq('id', id)
        .select(`
          *,
          category:restaurant_categories(*)
        `)
        .single()

      if (error) throw error
      return data as RestaurantItemWithCategory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantItemKeys.all })
      queryClient.setQueryData(restaurantItemKeys.detail(data.id), data)
    },
  })
}

// Bulk update item availability
export function useBulkUpdateRestaurantItemAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, is_available }: { ids: string[]; is_available: boolean }) => {
      const { data, error } = await supabase
        .from('restaurant_items')
        .update({ is_available })
        .in('id', ids)
        .select()

      if (error) throw error
      return data as RestaurantItem[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantItemKeys.all })
    },
  })
}

// Get items statistics
export function useRestaurantItemsStats(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantItemKeys.all, 'stats', propertyId],
    queryFn: async () => {
      let query = supabase.from('restaurant_items').select('is_available')
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data.reduce((acc, item) => {
        acc.total++
        if (item.is_available) {
          acc.available++
        } else {
          acc.unavailable++
        }
        return acc
      }, {
        total: 0,
        available: 0,
        unavailable: 0
      })

      return {
        ...stats,
        availability_rate: stats.total > 0 ? (stats.available / stats.total) * 100 : 0
      }
    },
  })
}