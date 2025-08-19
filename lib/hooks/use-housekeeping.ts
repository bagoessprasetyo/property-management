import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'
import { toast } from 'sonner'

const supabase = createClient()

type HousekeepingTask = Database['public']['Tables']['housekeeping']['Row'] & {
  room_number?: string
  assigned_to_name?: string
}
type HousekeepingInsert = Database['public']['Tables']['housekeeping']['Insert']
type HousekeepingUpdate = Database['public']['Tables']['housekeeping']['Update']

// Query keys
export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  lists: () => [...housekeepingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...housekeepingKeys.lists(), { filters }] as const,
  details: () => [...housekeepingKeys.all, 'detail'] as const,
  detail: (id: string) => [...housekeepingKeys.details(), id] as const,
  schedule: (date: string) => [...housekeepingKeys.all, 'schedule', date] as const,
}

// Get all housekeeping tasks
export function useHousekeepingTasks(propertyId?: string, filters?: {
  status?: string
  priority?: string
  assignee?: string
  date?: string
}) {
  return useQuery({
    queryKey: housekeepingKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      let query = supabase
        .from('housekeeping')
        .select(`
          *,
          rooms (
            room_number
          )
        `)

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', parseInt(filters.priority))
      }

      if (filters?.assignee && filters.assignee !== 'all') {
        query = query.eq('assigned_to', filters.assignee)
      }

      if (filters?.date) {
        query = query.eq('scheduled_date', filters.date)
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true })

      if (error) throw error

      // Transform data to include room_number and assigned_to_name
      const transformedData = data.map(task => ({
        ...task,
        room_number: task.rooms?.room_number || 'N/A',
        assigned_to_name: task.assigned_to || 'Belum ditugaskan'
      }))

      return transformedData
    },
  })
}

// Get housekeeping task by ID
export function useHousekeepingTask(id: string | null) {
  return useQuery({
    queryKey: housekeepingKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('housekeeping')
        .select(`
          *,
          rooms (
            room_number
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Transform data to include room_number and assigned_to_name
      const transformedTask = {
        ...data,
        room_number: data.rooms?.room_number || 'N/A',
        assigned_to_name: data.assigned_to || 'Belum ditugaskan'
      }
      
      return transformedTask
    },
    enabled: !!id,
  })
}

// Get daily schedule
export function useHousekeepingSchedule(propertyId: string, date: string) {
  return useQuery({
    queryKey: housekeepingKeys.schedule(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping')
        .select(`
          *,
          rooms (
            room_number
          )
        `)
        .eq('scheduled_date', date)
        .order('scheduled_time', { ascending: true })

      if (error) throw error

      // Transform data
      const transformedData = data.map(task => ({
        ...task,
        room_number: task.rooms?.room_number || 'N/A',
        assigned_to_name: task.assigned_to || 'Belum ditugaskan'
      }))

      return transformedData
    },
  })
}

// Create housekeeping task
export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: HousekeepingInsert) => {
      const { data, error } = await supabase
        .from('housekeeping')
        .insert(task)
        .select(`
          *,
          rooms (
            room_number
          )
        `)
        .single()

      if (error) throw error

      // Transform data
      const transformedTask = {
        ...data,
        room_number: data.rooms?.room_number || 'N/A',
        assigned_to_name: data.assigned_to || 'Belum ditugaskan'
      }
      
      return transformedTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all })
      toast.success(`Tugas housekeeping untuk kamar ${data.room_number} berhasil dibuat`)
    },
    onError: (error: any) => {
      toast.error(`Gagal membuat tugas: ${error.message || 'Terjadi kesalahan'}`)
    },
  })
}

// Update housekeeping task
export function useUpdateHousekeepingTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: HousekeepingUpdate }) => {
      const { data, error } = await supabase
        .from('housekeeping')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          rooms (
            room_number
          )
        `)
        .single()

      if (error) throw error

      // Transform data
      const transformedTask = {
        ...data,
        room_number: data.rooms?.room_number || 'N/A',
        assigned_to_name: data.assigned_to || 'Belum ditugaskan'
      }
      
      return transformedTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all })
      queryClient.setQueryData(housekeepingKeys.detail(data.id), data)
      toast.success(`Tugas untuk kamar ${data.room_number} berhasil diperbarui`)
    },
    onError: (error: any) => {
      toast.error(`Gagal memperbarui tugas: ${error.message || 'Terjadi kesalahan'}`)
    },
  })
}

// Update task status
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('housekeeping')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all })
      
      const statusLabels = {
        'pending': 'Menunggu',
        'in_progress': 'Sedang Dikerjakan',
        'completed': 'Selesai',
        'inspected': 'Telah Diperiksa',
        'failed_inspection': 'Perlu Diperbaiki'
      }
      
      const statusLabel = statusLabels[data.status as keyof typeof statusLabels] || data.status
      toast.success(`Status tugas berhasil diubah menjadi: ${statusLabel}`)
    },
    onError: (error: any) => {
      toast.error(`Gagal mengubah status: ${error.message || 'Terjadi kesalahan'}`)
    },
  })
}