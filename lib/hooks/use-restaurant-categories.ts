import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { 
  RestaurantCategory, 
  RestaurantCategoryInsert, 
  RestaurantCategoryUpdate,
  MenuCategory 
} from '@/lib/types/restaurant'

const supabase = createClient()

// Query keys
export const restaurantCategoryKeys = {
  all: ['restaurant-categories'] as const,
  lists: () => [...restaurantCategoryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...restaurantCategoryKeys.lists(), { filters }] as const,
  details: () => [...restaurantCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantCategoryKeys.details(), id] as const,
}

// Get all restaurant categories
export function useRestaurantCategories(propertyId?: string) {
  return useQuery({
    queryKey: restaurantCategoryKeys.list({ propertyId }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantCategory[]
    },
  })
}

// Get categories with item counts
export function useRestaurantCategoriesWithCounts(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantCategoryKeys.list({ propertyId }), 'with-counts'],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_categories')
        .select(`
          *,
          restaurant_items(count)
        `)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      
      return (data as any[]).map(category => ({
        ...category,
        itemCount: category.restaurant_items?.[0]?.count || 0
      })) as MenuCategory[]
    },
  })
}

// Get active categories only
export function useActiveRestaurantCategories(propertyId?: string) {
  return useQuery({
    queryKey: [...restaurantCategoryKeys.list({ propertyId }), 'active'],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as RestaurantCategory[]
    },
  })
}

// Get restaurant category by ID
export function useRestaurantCategory(id: string | null) {
  return useQuery({
    queryKey: restaurantCategoryKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('restaurant_categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RestaurantCategory
    },
    enabled: !!id,
  })
}

// Create restaurant category
export function useCreateRestaurantCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: RestaurantCategoryInsert) => {
      const { data, error } = await supabase
        .from('restaurant_categories')
        .insert(category)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantCategoryKeys.all })
    },
  })
}

// Update restaurant category
export function useUpdateRestaurantCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RestaurantCategoryUpdate }) => {
      const { data, error } = await supabase
        .from('restaurant_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantCategory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantCategoryKeys.all })
      queryClient.setQueryData(restaurantCategoryKeys.detail(data.id), data)
    },
  })
}

// Delete restaurant category
export function useDeleteRestaurantCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantCategoryKeys.all })
    },
  })
}

// Reorder categories
export function useReorderRestaurantCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('restaurant_categories')
          .update({ display_order })
          .eq('id', id)
      )

      const results = await Promise.all(promises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw errors[0].error
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantCategoryKeys.all })
    },
  })
}

// Toggle category active status
export function useToggleRestaurantCategoryStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('restaurant_categories')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RestaurantCategory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: restaurantCategoryKeys.all })
      queryClient.setQueryData(restaurantCategoryKeys.detail(data.id), data)
    },
  })
}