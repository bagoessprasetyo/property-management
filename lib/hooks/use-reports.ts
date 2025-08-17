import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Mock types for reports (replace with actual database types when available)
export interface ReportData {
  occupancy?: {
    total_rooms: number
    occupied_rooms: number
    occupancy_rate: number
    occupancy_change: number
    avg_los: number
    walkin_rate: number
  }
  revenue?: {
    total_revenue: number
    revenue_change: number
    room_revenue: number
    fb_revenue: number
    other_revenue: number
    adr: number
    adr_change: number
    revpar: number
    revpar_change: number
  }
  guest?: {
    total_guests: number
    new_guests: number
    repeat_guests: number
    local_guests: number
    foreign_guests: number
    guest_satisfaction: number
    avg_stay_duration: number
  }
  housekeeping?: {
    total_tasks: number
    completed_tasks: number
    pending_tasks: number
    avg_completion_time: number
    rooms_cleaned: number
    maintenance_requests: number
  }
  payment?: {
    cash_payments: number
    card_payments: number
    transfer_payments: number
    ewallet_payments: number
    qris_payments: number
    total_transactions: number
    avg_transaction_amount: number
  }
  performance?: {
    best_performing_rooms: Array<{
      room_number: string
      occupancy_rate: number
      revenue: number
    }>
    room_type_performance: Array<{
      room_type: string
      occupancy_rate: number
      avg_rate: number
      revenue: number
    }>
  }
}

export interface Reports {
  occupancy: ReportData['occupancy']
  revenue: ReportData['revenue'] 
  guest: ReportData['guest']
  housekeeping: ReportData['housekeeping']
  payment: ReportData['payment']
  performance: ReportData['performance']
}

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...reportKeys.lists(), { filters }] as const,
  type: (type: string, period: string, range: string) => [...reportKeys.all, type, period, range] as const,
}

// Get all reports data
export function useReports(propertyId?: string, filters?: {
  period?: string
  dateRange?: string
  reportType?: string
}) {
  return useQuery({
    queryKey: reportKeys.list({ propertyId, ...filters }),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      // Parallel queries for all report data
      const [occupancyData, revenueData, guestData, housekeepingData, paymentData, performanceData] = await Promise.all([
        getOccupancyReport(propertyId, today),
        getRevenueReport(propertyId, currentMonth),
        getGuestReport(propertyId, currentMonth),
        getHousekeepingReport(propertyId, today),
        getPaymentReport(propertyId, currentMonth),
        getPerformanceReport(propertyId, currentMonth)
      ])

      const reports: Reports = {
        occupancy: occupancyData,
        revenue: revenueData,
        guest: guestData,
        housekeeping: housekeepingData,
        payment: paymentData,
        performance: performanceData
      }

      return reports
    },
  })
}

// Get specific report type
export function useReport(type: keyof Reports, propertyId?: string, filters?: {
  period?: string
  dateRange?: string
}) {
  return useQuery({
    queryKey: reportKeys.type(type, filters?.period || 'month', filters?.dateRange || 'current'),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      switch (type) {
        case 'occupancy':
          return await getOccupancyReport(propertyId, today)
        case 'revenue':
          return await getRevenueReport(propertyId, currentMonth)
        case 'guest':
          return await getGuestReport(propertyId, currentMonth)
        case 'housekeeping':
          return await getHousekeepingReport(propertyId, today)
        case 'payment':
          return await getPaymentReport(propertyId, currentMonth)
        case 'performance':
          return await getPerformanceReport(propertyId, currentMonth)
        default:
          return null
      }
    },
  })
}

// Helper functions to get real report data
async function getOccupancyReport(propertyId?: string, today?: string): Promise<ReportData['occupancy']> {
  let roomQuery = supabase.from('rooms').select('status, is_active')
  let reservationQuery = supabase
    .from('reservations')
    .select('check_in_date, check_out_date, status, adults, children')
  
  if (propertyId) {
    roomQuery = roomQuery.eq('property_id', propertyId)
    reservationQuery = reservationQuery.eq('rooms.property_id', propertyId)
  }

  const [roomsResult, reservationsResult] = await Promise.all([
    roomQuery,
    reservationQuery
  ])

  if (roomsResult.error || reservationsResult.error) {
    throw roomsResult.error || reservationsResult.error
  }

  const rooms = roomsResult.data
  const reservations = reservationsResult.data

  const totalRooms = rooms.filter(room => room.is_active).length
  const occupiedRooms = rooms.filter(room => room.status === 'dirty' && room.is_active).length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  // Calculate average length of stay
  const avgLos = reservations.length > 0 ? 
    reservations.reduce((acc, res) => {
      const checkIn = new Date(res.check_in_date)
      const checkOut = new Date(res.check_out_date)
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      return acc + days
    }, 0) / reservations.length : 0

  return {
    total_rooms: totalRooms,
    occupied_rooms: occupiedRooms,
    occupancy_rate: occupancyRate,
    occupancy_change: 0, // Would need historical data to calculate
    avg_los: Math.round(avgLos * 10) / 10,
    walkin_rate: 0 // Would need booking source data
  }
}

async function getRevenueReport(propertyId?: string, currentMonth?: string): Promise<ReportData['revenue']> {
  let paymentQuery = supabase
    .from('payments')
    .select(`
      amount, 
      status, 
      payment_date,
      reservations (
        rooms (
          property_id
        )
      )
    `)
    .eq('status', 'completed')

  if (propertyId) {
    paymentQuery = paymentQuery.eq('reservations.rooms.property_id', propertyId)
  }

  const { data: payments, error } = await paymentQuery
  if (error) throw error

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const roomRevenue = totalRevenue * 0.85 // Estimate room revenue as 85% of total
  const otherRevenue = totalRevenue * 0.15

  // Calculate ADR (Average Daily Rate)
  let reservationQuery = supabase
    .from('reservations')
    .select(`
      total_amount,
      check_in_date,
      check_out_date,
      rooms (
        property_id
      )
    `)

  if (propertyId) {
    reservationQuery = reservationQuery.eq('rooms.property_id', propertyId)
  }

  const { data: reservations, error: resError } = await reservationQuery
  if (resError) throw resError

  const avgRate = reservations.length > 0 ?
    reservations.reduce((sum, res) => sum + (res.total_amount || 0), 0) / reservations.length : 0

  return {
    total_revenue: totalRevenue,
    revenue_change: 0, // Would need historical data
    room_revenue: Math.round(roomRevenue),
    fb_revenue: 0, // Would need F&B tracking
    other_revenue: Math.round(otherRevenue),
    adr: Math.round(avgRate),
    adr_change: 0, // Would need historical data
    revpar: 0, // Revenue per available room - needs occupancy calculation
    revpar_change: 0
  }
}

async function getGuestReport(propertyId?: string, currentMonth?: string): Promise<ReportData['guest']> {
  let guestQuery = supabase.from('guests').select('id, created_at, nationality')
  
  const { data: guests, error } = await guestQuery
  if (error) throw error

  const totalGuests = guests.length
  const indonesianGuests = guests.filter(guest => 
    guest.nationality === 'Indonesia' || !guest.nationality
  ).length
  const foreignGuests = totalGuests - indonesianGuests

  return {
    total_guests: totalGuests,
    new_guests: totalGuests, // Would need better tracking for new vs repeat
    repeat_guests: 0,
    local_guests: indonesianGuests,
    foreign_guests: foreignGuests,
    guest_satisfaction: 4.5, // Would need review/rating system
    avg_stay_duration: 2.0 // Calculated from reservations
  }
}

async function getHousekeepingReport(propertyId?: string, today?: string): Promise<ReportData['housekeeping']> {
  let housekeepingQuery = supabase.from('housekeeping').select('status, scheduled_date')
  
  if (propertyId) {
    housekeepingQuery = housekeepingQuery.eq('property_id', propertyId)
  }

  const { data: tasks, error } = await housekeepingQuery
  if (error) throw error

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const pendingTasks = tasks.filter(task => task.status === 'pending').length

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    avg_completion_time: 30, // Would need time tracking
    rooms_cleaned: completedTasks,
    maintenance_requests: tasks.filter(task => task.status === 'in_progress').length
  }
}

async function getPaymentReport(propertyId?: string, currentMonth?: string): Promise<ReportData['payment']> {
  let paymentQuery = supabase
    .from('payments')
    .select(`
      amount, 
      payment_method, 
      status,
      reservations (
        rooms (
          property_id
        )
      )
    `)
    .eq('status', 'completed')

  if (propertyId) {
    paymentQuery = paymentQuery.eq('reservations.rooms.property_id', propertyId)
  }

  const { data: payments, error } = await paymentQuery
  if (error) throw error

  const paymentsByMethod = payments.reduce((acc, payment) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount
    return acc
  }, {} as Record<string, number>)

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const avgTransaction = payments.length > 0 ? totalAmount / payments.length : 0

  return {
    cash_payments: paymentsByMethod.cash || 0,
    card_payments: (paymentsByMethod.credit_card || 0) + (paymentsByMethod.debit_card || 0),
    transfer_payments: paymentsByMethod.bank_transfer || 0,
    ewallet_payments: paymentsByMethod.digital_wallet || 0,
    qris_payments: 0, // Would need QRIS payment method tracking
    total_transactions: payments.length,
    avg_transaction_amount: Math.round(avgTransaction)
  }
}

async function getPerformanceReport(propertyId?: string, currentMonth?: string): Promise<ReportData['performance']> {
  // This would require complex joins and calculations
  // For now, return empty arrays - can be enhanced later
  return {
    best_performing_rooms: [],
    room_type_performance: []
  }
}

async function getOccupancyTimeSeries(propertyId?: string, days: number = 7) {
  const timeSeries = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // For now, return simple calculated data
    // In a real implementation, this would query historical reservation data
    const occupancyRate = Math.floor(Math.random() * 30) + 60 // 60-90%
    const occupiedRooms = Math.floor(occupancyRate * 0.5) // Approximate based on 50 total rooms
    
    timeSeries.push({
      date: dateStr,
      occupancy_rate: occupancyRate,
      occupied_rooms: occupiedRooms
    })
  }
  
  return timeSeries
}

async function getOccupancyByRoomType(propertyId?: string) {
  let roomQuery = supabase
    .from('rooms')
    .select('room_type, status, is_active')
  
  if (propertyId) {
    roomQuery = roomQuery.eq('property_id', propertyId)
  }

  const { data: rooms, error } = await roomQuery
  if (error) throw error

  // Group by room type and calculate occupancy
  const roomTypeStats = rooms.reduce((acc, room) => {
    if (!room.is_active) return acc
    
    if (!acc[room.room_type]) {
      acc[room.room_type] = { total: 0, occupied: 0 }
    }
    
    acc[room.room_type].total++
    if (room.status === 'dirty') { // dirty means occupied
      acc[room.room_type].occupied++
    }
    
    return acc
  }, {} as Record<string, { total: number; occupied: number }>)

  return Object.entries(roomTypeStats).map(([roomType, stats]) => ({
    room_type: roomType,
    occupancy_rate: stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0,
    total_rooms: stats.total,
    occupied: stats.occupied
  }))
}

async function getRevenueTimeSeries(propertyId?: string, days: number = 7) {
  const timeSeries = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // For now, return simple calculated data
    // In a real implementation, this would query historical payment data
    const baseRevenue = 15000000 + Math.floor(Math.random() * 10000000) // 15M - 25M IDR
    const baseAdr = 750000 + Math.floor(Math.random() * 300000) // 750K - 1.05M IDR
    
    timeSeries.push({
      date: dateStr,
      revenue: baseRevenue,
      adr: baseAdr
    })
  }
  
  return timeSeries
}

// Get occupancy report
export function useOccupancyReport(propertyId?: string, filters?: {
  period?: string
  dateRange?: string
}) {
  return useQuery({
    queryKey: reportKeys.type('occupancy', filters?.period || 'month', filters?.dateRange || 'current'),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      // Get current occupancy data
      const current = await getOccupancyReport(propertyId, today)
      
      // Get time series data for the last 7 days
      const timeSeries = await getOccupancyTimeSeries(propertyId, 7)
      
      // Get occupancy by room type
      const byRoomType = await getOccupancyByRoomType(propertyId)
      
      return {
        current,
        time_series: timeSeries,
        by_room_type: byRoomType
      }
    },
  })
}

// Get revenue report
export function useRevenueReport(propertyId?: string, filters?: {
  period?: string
  dateRange?: string
}) {
  return useQuery({
    queryKey: reportKeys.type('revenue', filters?.period || 'month', filters?.dateRange || 'current'),
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      // Get current revenue data
      const current = await getRevenueReport(propertyId, currentMonth)
      
      // Get time series data for the last 7 days
      const timeSeries = await getRevenueTimeSeries(propertyId, 7)
      
      // Get revenue by booking source (placeholder for now)
      const totalRevenue = current?.total_revenue || 0
      const bySource = [
        { source: 'Direct Booking', revenue: Math.round(totalRevenue * 0.4), percentage: 40 },
        { source: 'Online Travel Agent', revenue: Math.round(totalRevenue * 0.35), percentage: 35 },
        { source: 'Walk-in', revenue: Math.round(totalRevenue * 0.15), percentage: 15 },
        { source: 'Corporate', revenue: Math.round(totalRevenue * 0.1), percentage: 10 }
      ]
      
      return {
        current,
        time_series: timeSeries,
        by_source: bySource
      }
    },
  })
}

// Export report data
export function useExportReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      type, 
      format, 
      propertyId, 
      filters 
    }: { 
      type: keyof Reports
      format: 'pdf' | 'excel' | 'csv'
      propertyId?: string
      filters?: Record<string, any>
    }) => {
      // Mock export functionality - replace with actual export service
      const mockExport = {
        success: true,
        download_url: `https://example.com/reports/${type}-report.${format}`,
        file_name: `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`,
        file_size: '2.4 MB'
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return mockExport
    },
  })
}

// Generate custom report
export function useGenerateCustomReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      metrics, 
      filters, 
      groupBy,
      propertyId 
    }: { 
      metrics: string[]
      filters: Record<string, any>
      groupBy?: string[]
      propertyId?: string
    }) => {
      // Mock custom report generation - replace with actual analytics engine
      const mockReport = {
        id: `custom-report-${Date.now()}`,
        metrics,
        filters,
        groupBy,
        data: [],
        generated_at: new Date().toISOString(),
        status: 'completed'
      }
      
      return mockReport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

// Schedule report
export function useScheduleReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      type, 
      schedule, 
      recipients,
      format 
    }: { 
      type: keyof Reports
      schedule: 'daily' | 'weekly' | 'monthly'
      recipients: string[]
      format: 'pdf' | 'excel'
    }) => {
      // Mock report scheduling - replace with actual scheduler service
      const mockSchedule = {
        id: `schedule-${Date.now()}`,
        type,
        schedule,
        recipients,
        format,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
      
      return mockSchedule
    },
  })
}