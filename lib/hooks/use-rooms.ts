import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Room = Database['public']['Tables']['rooms']['Row']
type RoomInsert = Database['public']['Tables']['rooms']['Insert']
type RoomUpdate = Database['public']['Tables']['rooms']['Update']

const supabase = createClient()

// Query keys
export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...roomKeys.lists(), { filters }] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
}

// Get all rooms
export function useRooms(propertyId?: string) {
  return useQuery({
    queryKey: roomKeys.list({ propertyId }),
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select('*')

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query.order('room_number', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

// Get room by ID
export function useRoom(id: string | null) {
  return useQuery({
    queryKey: roomKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Get room statistics
export function useRoomStats(propertyId?: string) {
  return useQuery({
    queryKey: [...roomKeys.all, 'stats', propertyId],
    queryFn: async () => {
      let query = supabase.from('rooms').select('status, is_active')
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data.reduce((acc, room) => {
        if (!room.is_active) return acc
        
        acc.total++
        acc.byStatus[room.status] = (acc.byStatus[room.status] || 0) + 1
        
        return acc
      }, {
        total: 0,
        byStatus: {} as Record<string, number>
      })

      return {
        total: stats.total,
        available: stats.byStatus.clean || 0,
        occupied: stats.byStatus.dirty || 0, // Assuming dirty means occupied
        maintenance: stats.byStatus.out_of_order || 0,
        cleaning: stats.byStatus.inspected || 0,
      }
    },
  })
}

// Create room
export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (room: RoomInsert) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert(room)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}

// Update room
export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoomUpdate }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
      queryClient.setQueryData(roomKeys.detail(data.id), data)
    },
  })
}

// Update room status with optimistic updates
export function useUpdateRoomStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database['public']['Enums']['room_status'] }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // Optimistic update for instant feedback
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: roomKeys.all })

      // Snapshot previous values
      const previousRoom = queryClient.getQueryData(roomKeys.detail(id))
      const previousRooms = queryClient.getQueriesData({ queryKey: roomKeys.lists() })
      const previousStats = queryClient.getQueryData([...roomKeys.all, 'stats'])

      // Optimistically update individual room
      if (previousRoom) {
        queryClient.setQueryData(roomKeys.detail(id), {
          ...previousRoom,
          status,
          updated_at: new Date().toISOString()
        })
      }

      // Optimistically update room lists
      previousRooms.forEach(([queryKey, rooms]) => {
        if (Array.isArray(rooms)) {
          const updatedRooms = rooms.map((room: any) =>
            room.id === id 
              ? { ...room, status, updated_at: new Date().toISOString() }
              : room
          )
          queryClient.setQueryData(queryKey, updatedRooms)
        }
      })

      // Return context for rollback
      return { previousRoom, previousRooms, previousStats }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRoom) {
        queryClient.setQueryData(roomKeys.detail(variables.id), context.previousRoom)
      }
      if (context?.previousRooms) {
        context.previousRooms.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousStats) {
        queryClient.setQueryData([...roomKeys.all, 'stats'], context.previousStats)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}

// Delete room
export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}