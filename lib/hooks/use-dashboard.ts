import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface DashboardStats {
  // Core metrics
  occupancyRate: number
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  
  // Today's activities
  arrivalsToday: number
  departuresToday: number
  newBookingsToday: number
  
  // Revenue
  revenueToday: number
  revenueThisMonth: number
  avgDailyRate: number
  
  // Housekeeping
  tasksCompleted: number
  tasksPending: number
  roomsReady: number
  
  // Trends (comparison with yesterday/last month)
  occupancyTrend: number
  revenueTrend: number
}

export interface RecentActivity {
  id: string
  type: 'checkin' | 'checkout' | 'booking' | 'cancellation' | 'housekeeping'
  title: string
  description: string
  guestName?: string
  roomNumber?: string
  timestamp: string
  status: 'completed' | 'pending' | 'confirmed' | 'cancelled'
}

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (propertyId?: string) => [...dashboardKeys.all, 'stats', propertyId] as const,
  activities: (propertyId?: string) => [...dashboardKeys.all, 'activities', propertyId] as const,
  overview: (propertyId?: string) => [...dashboardKeys.all, 'overview', propertyId] as const,
}

// Get dashboard statistics
export function useDashboardStats(propertyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(propertyId),
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)

      // Rooms query
      let roomsQuery = supabase
        .from('rooms')
        .select('status, is_active')
      
      if (propertyId) {
        roomsQuery = roomsQuery.eq('property_id', propertyId)
      }

      // Reservations query
      let reservationsQuery = supabase
        .from('reservations')
        .select('status, check_in_date, check_out_date, total_amount, created_at, rooms(property_id)')
      
      if (propertyId) {
        reservationsQuery = reservationsQuery.eq('rooms.property_id', propertyId)
      }

      // Housekeeping query
      let housekeepingQuery = supabase
        .from('housekeeping')
        .select('status, scheduled_date, completed_at')
      
      if (propertyId) {
        housekeepingQuery = housekeepingQuery.eq('property_id', propertyId)
      }

      // Execute queries in parallel
      const [roomsResult, reservationsResult, housekeepingResult] = await Promise.all([
        roomsQuery,
        reservationsQuery,
        housekeepingQuery
      ])

      if (roomsResult.error) throw roomsResult.error
      if (reservationsResult.error) throw reservationsResult.error
      if (housekeepingResult.error) throw housekeepingResult.error

      const rooms = roomsResult.data || []
      const reservations = reservationsResult.data || []
      const housekeepingTasks = housekeepingResult.data || []

      // Calculate room statistics
      const activeRooms = rooms.filter(room => room.is_active)
      const totalRooms = activeRooms.length
      const occupiedRooms = activeRooms.filter(room => room.status === 'dirty').length
      const availableRooms = activeRooms.filter(room => room.status === 'clean').length
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

      // Calculate daily activities
      const arrivalsToday = reservations.filter(r => r.check_in_date === today).length
      const departuresToday = reservations.filter(r => r.check_out_date === today).length
      const newBookingsToday = reservations.filter(r => 
        r.created_at && r.created_at.startsWith(today)
      ).length

      // Calculate revenue
      const revenueToday = reservations
        .filter(r => r.check_in_date === today && r.status === 'checked_in')
        .reduce((sum, r) => sum + (r.total_amount || 0), 0)

      const revenueThisMonth = reservations
        .filter(r => 
          r.check_in_date && 
          r.check_in_date.startsWith(thisMonth) && 
          r.status === 'checked_in'
        )
        .reduce((sum, r) => sum + (r.total_amount || 0), 0)

      const revenueYesterday = reservations
        .filter(r => r.check_in_date === yesterday && r.status === 'checked_in')
        .reduce((sum, r) => sum + (r.total_amount || 0), 0)

      // Calculate ADR (Average Daily Rate)
      const checkedInReservations = reservations.filter(r => r.status === 'checked_in')
      const avgDailyRate = checkedInReservations.length > 0 
        ? checkedInReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0) / checkedInReservations.length
        : 0

      // Calculate housekeeping stats
      const todayTasks = housekeepingTasks.filter(t => t.scheduled_date === today)
      const tasksCompleted = todayTasks.filter(t => t.status === 'completed').length
      const tasksPending = todayTasks.filter(t => t.status === 'pending').length
      const roomsReady = activeRooms.filter(room => room.status === 'clean').length

      // Calculate trends
      const yesterdayOccupied = reservations.filter(r => 
        r.check_in_date <= yesterday && 
        r.check_out_date > yesterday && 
        r.status === 'checked_in'
      ).length
      const yesterdayOccupancyRate = totalRooms > 0 ? (yesterdayOccupied / totalRooms) * 100 : 0
      const occupancyTrend = occupancyRate - yesterdayOccupancyRate

      const revenueTrend = revenueYesterday > 0 
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 
        : revenueToday > 0 ? 100 : 0

      return {
        occupancyRate,
        totalRooms,
        occupiedRooms,
        availableRooms,
        arrivalsToday,
        departuresToday,
        newBookingsToday,
        revenueToday,
        revenueThisMonth,
        avgDailyRate,
        tasksCompleted,
        tasksPending,
        roomsReady,
        occupancyTrend,
        revenueTrend
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Get recent activities
export function useRecentActivities(propertyId?: string, limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.activities(propertyId),
    queryFn: async (): Promise<RecentActivity[]> => {
      const today = new Date().toISOString().split('T')[0]
      const activities: RecentActivity[] = []

      // Get recent reservations
      let reservationsQuery = supabase
        .from('reservations')
        .select(`
          id,
          status,
          check_in_date,
          check_out_date,
          created_at,
          updated_at,
          guests(first_name, last_name),
          rooms(room_number, property_id)
        `)
        .order('updated_at', { ascending: false })
        .limit(20)
      
      if (propertyId) {
        reservationsQuery = reservationsQuery.eq('rooms.property_id', propertyId)
      }

      // Get recent housekeeping tasks
      let housekeepingQuery = supabase
        .from('housekeeping')
        .select(`
          id,
          status,
          task_type,
          scheduled_date,
          completed_at,
          updated_at,
          assigned_to,
          rooms(room_number)
        `)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      if (propertyId) {
        housekeepingQuery = housekeepingQuery.eq('property_id', propertyId)
      }

      const [reservationsResult, housekeepingResult] = await Promise.all([
        reservationsQuery,
        housekeepingQuery
      ])

      if (reservationsResult.error) throw reservationsResult.error
      if (housekeepingResult.error) throw housekeepingResult.error

      const reservations = reservationsResult.data || []
      const housekeepingTasks = housekeepingResult.data || []

      // Process reservations into activities
      reservations.forEach(reservation => {
        const guestName = reservation.guests 
          ? `${reservation.guests[0].first_name} ${reservation.guests[0].last_name}`.trim()
          : 'Tamu'
        const roomNumber = reservation.rooms?.[0]?.room_number || 'N/A'

        // Check-in activities
        if (reservation.status === 'checked_in' && reservation.check_in_date === today) {
          activities.push({
            id: `checkin-${reservation.id}`,
            type: 'checkin',
            title: 'Check-in Tamu',
            description: `${guestName} telah check-in`,
            guestName,
            roomNumber,
            timestamp: reservation.updated_at || reservation.created_at,
            status: 'completed'
          })
        }

        // Check-out activities
        if (reservation.status === 'checked_out' && reservation.check_out_date === today) {
          activities.push({
            id: `checkout-${reservation.id}`,
            type: 'checkout',
            title: 'Check-out Tamu',
            description: `${guestName} telah check-out`,
            guestName,
            roomNumber,
            timestamp: reservation.updated_at || reservation.created_at,
            status: 'completed'
          })
        }

        // New bookings
        if (reservation.created_at && reservation.created_at.startsWith(today)) {
          activities.push({
            id: `booking-${reservation.id}`,
            type: 'booking',
            title: 'Booking Baru',
            description: `Reservasi baru untuk ${guestName}`,
            guestName,
            roomNumber,
            timestamp: reservation.created_at,
            status: 'confirmed'
          })
        }

        // Cancellations
        if (reservation.status === 'cancelled' && reservation.updated_at?.startsWith(today)) {
          activities.push({
            id: `cancel-${reservation.id}`,
            type: 'cancellation',
            title: 'Pembatalan',
            description: `Reservasi ${guestName} dibatalkan`,
            guestName,
            roomNumber,
            timestamp: reservation.updated_at,
            status: 'cancelled'
          })
        }
      })

      // Process housekeeping into activities
      housekeepingTasks.forEach(task => {
        if (task.completed_at?.startsWith(today)) {
          activities.push({
            id: `housekeeping-${task.id}`,
            type: 'housekeeping',
            title: 'Housekeeping Selesai',
            description: `${task.task_type} selesai oleh ${task.assigned_to || 'Staff'}`,
            roomNumber: task.rooms?.[0]?.room_number || 'N/A',
            timestamp: task.completed_at,
            status: 'completed'
          })
        }
      })

      // Sort by timestamp (newest first) and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Get upcoming activities (arrivals, departures, tasks)
export function useUpcomingActivities(propertyId?: string) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'upcoming', propertyId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get today's arrivals that haven't checked in
      let arrivalsQuery = supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          guests(first_name, last_name),
          rooms(room_number, property_id)
        `)
        .eq('check_in_date', today)
        .eq('status', 'confirmed')
      
      if (propertyId) {
        arrivalsQuery = arrivalsQuery.eq('rooms.property_id', propertyId)
      }

      // Get today's departures that haven't checked out
      let departuresQuery = supabase
        .from('reservations')
        .select(`
          id,
          check_out_date,
          guests(first_name, last_name),
          rooms(room_number, property_id)
        `)
        .eq('check_out_date', today)
        .eq('status', 'checked_in')
      
      if (propertyId) {
        departuresQuery = departuresQuery.eq('rooms.property_id', propertyId)
      }

      // Get pending housekeeping tasks for today
      let tasksQuery = supabase
        .from('housekeeping')
        .select(`
          id,
          task_type,
          priority,
          scheduled_time,
          assigned_to,
          rooms(room_number)
        `)
        .eq('scheduled_date', today)
        .eq('status', 'pending')
      
      if (propertyId) {
        tasksQuery = tasksQuery.eq('property_id', propertyId)
      }

      const [arrivalsResult, departuresResult, tasksResult] = await Promise.all([
        arrivalsQuery,
        departuresQuery,
        tasksQuery
      ])

      if (arrivalsResult.error) throw arrivalsResult.error
      if (departuresResult.error) throw departuresResult.error
      if (tasksResult.error) throw tasksResult.error

      return {
        pendingArrivals: arrivalsResult.data || [],
        pendingDepartures: departuresResult.data || [],
        pendingTasks: tasksResult.data || []
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}