// Room analytics and statistics utilities

export interface RoomAnalytics {
  totalRooms: number
  activeRooms: number
  inactiveRooms: number
  cleanRooms: number
  dirtyRooms: number
  inspectedRooms: number
  outOfOrderRooms: number
  averageBaseRate: number
  totalRevenuePotential: number
  occupancyRate: number
  housekeepingEfficiency: number
  roomTypeDistribution: Array<{ type: string; count: number; percentage: number }>
  floorDistribution: Array<{ floor: number; count: number; avgRate: number }>
  amenityPopularity: Array<{ amenity: string; count: number; percentage: number }>
  statusTrend: Array<{ date: string; clean: number; dirty: number; ooo: number }>
  utilizationRate: number
}

export interface RoomUtilization {
  totalCapacity: number
  averageCapacity: number
  largestRoom: number
  smallestRoom: number
  totalArea: number
  averageArea: number
}

export function calculateRoomAnalytics(rooms: any[], reservations?: any[]): RoomAnalytics {
  const totalRooms = rooms.length
  
  // Basic room counts
  const activeRooms = rooms.filter(r => r.is_active).length
  const inactiveRooms = totalRooms - activeRooms
  const cleanRooms = rooms.filter(r => r.status === 'clean').length
  const dirtyRooms = rooms.filter(r => r.status === 'dirty').length
  const inspectedRooms = rooms.filter(r => r.status === 'inspected').length
  const outOfOrderRooms = rooms.filter(r => r.status === 'out_of_order').length

  // Financial metrics
  const totalRevenuePotential = rooms.reduce((sum, room) => sum + (room.base_rate || 0), 0)
  const averageBaseRate = totalRooms > 0 ? totalRevenuePotential / totalRooms : 0

  // Occupancy calculation (simplified - would need actual booking data)
  const occupiedRooms = reservations ? calculateCurrentOccupancy(rooms, reservations) : 0
  const occupancyRate = activeRooms > 0 ? (occupiedRooms / activeRooms) * 100 : 0

  // Housekeeping efficiency (clean + inspected rooms vs total available)
  const readyRooms = cleanRooms + inspectedRooms
  const housekeepingEfficiency = activeRooms > 0 ? (readyRooms / activeRooms) * 100 : 0

  // Room type distribution
  const roomTypeCount = rooms.reduce((acc, room) => {
    const type = room.room_type || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const roomTypeDistribution = Object.entries(roomTypeCount)
    .map(([type, count]) => ({
      type,
      count: count as number,
      percentage: ((count as number) / totalRooms) * 100
    }))
    .sort((a, b) => b.count - a.count)

  // Floor distribution
  const floorStats = rooms.reduce((acc, room) => {
    const floor = room.floor || 0
    if (!acc[floor]) {
      acc[floor] = { count: 0, totalRate: 0 }
    }
    acc[floor].count += 1
    acc[floor].totalRate += room.base_rate || 0
    return acc
  }, {} as Record<number, { count: number; totalRate: number }>)

  const floorDistribution = Object.entries(floorStats)
    .map(([floor, stats]) => ({
      floor: parseInt(floor),
      count: (stats as any).count,
      avgRate: (stats as any).count > 0 ? (stats as any).totalRate / (stats as any).count : 0
    }))
    .sort((a, b) => a.floor - b.floor)

  // Amenity popularity
  const amenityCount = rooms.reduce((acc, room) => {
    if (room.amenities && Array.isArray(room.amenities)) {
      room.amenities.forEach((amenity: string) => {
        acc[amenity] = (acc[amenity] || 0) + 1
      })
    }
    return acc
  }, {} as Record<string, number>)

  const amenityPopularity = Object.entries(amenityCount)
    .map(([amenity, count]) => ({
      amenity,
      count: count as number,
      percentage: ((count as number) / totalRooms) * 100
    }))
    .sort((a, b) => b.count - a.count)

  // Status trend (mock data - would need historical data)
  const statusTrend = generateStatusTrend(rooms)

  // Utilization rate (capacity utilization)
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)
  const utilizationRate = totalCapacity > 0 && reservations 
    ? calculateCapacityUtilization(rooms, reservations) 
    : 0

  return {
    totalRooms,
    activeRooms,
    inactiveRooms,
    cleanRooms,
    dirtyRooms,
    inspectedRooms,
    outOfOrderRooms,
    averageBaseRate,
    totalRevenuePotential,
    occupancyRate,
    housekeepingEfficiency,
    roomTypeDistribution,
    floorDistribution,
    amenityPopularity,
    statusTrend,
    utilizationRate
  }
}

export function calculateRoomUtilization(rooms: any[]): RoomUtilization {
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)
  const averageCapacity = rooms.length > 0 ? totalCapacity / rooms.length : 0
  
  const capacities = rooms.map(r => r.capacity || 0).filter(c => c > 0)
  const largestRoom = capacities.length > 0 ? Math.max(...capacities) : 0
  const smallestRoom = capacities.length > 0 ? Math.min(...capacities) : 0

  const areas = rooms.map(r => r.size_sqm || 0).filter(a => a > 0)
  const totalArea = areas.reduce((sum, area) => sum + area, 0)
  const averageArea = areas.length > 0 ? totalArea / areas.length : 0

  return {
    totalCapacity,
    averageCapacity,
    largestRoom,
    smallestRoom,
    totalArea,
    averageArea
  }
}

function calculateCurrentOccupancy(rooms: any[], reservations: any[]): number {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const currentReservations = reservations.filter(reservation => {
    const checkIn = new Date(reservation.check_in_date)
    const checkOut = new Date(reservation.check_out_date)
    return checkIn <= today && checkOut > today && 
           ['confirmed', 'checked_in'].includes(reservation.status)
  })

  return currentReservations.length
}

function calculateCapacityUtilization(rooms: any[], reservations: any[]): number {
  const today = new Date()
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)
  
  const currentGuests = reservations.filter(reservation => {
    const checkIn = new Date(reservation.check_in_date)
    const checkOut = new Date(reservation.check_out_date)
    return checkIn <= today && checkOut > today && 
           ['confirmed', 'checked_in'].includes(reservation.status)
  }).reduce((sum, reservation) => sum + (reservation.guests || 1), 0)

  return totalCapacity > 0 ? (currentGuests / totalCapacity) * 100 : 0
}

function generateStatusTrend(rooms: any[]): Array<{ date: string; clean: number; dirty: number; ooo: number }> {
  // Generate last 7 days trend (mock data - in real app would use historical data)
  const trend = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Simulate some variation in room status over time
    const cleanRooms = rooms.filter(r => r.status === 'clean').length
    const dirtyRooms = rooms.filter(r => r.status === 'dirty').length  
    const oooRooms = rooms.filter(r => r.status === 'out_of_order').length
    
    // Add some random variation for demo
    const variation = Math.random() * 0.2 - 0.1 // ±10%
    
    trend.push({
      date: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      clean: Math.round(cleanRooms * (1 + variation)),
      dirty: Math.round(dirtyRooms * (1 + variation)),
      ooo: oooRooms
    })
  }
  
  return trend
}

export function getRoomStatusColor(status: string): string {
  const colors = {
    clean: 'text-green-600',
    dirty: 'text-yellow-600', 
    inspected: 'text-blue-600',
    out_of_order: 'text-red-600'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
}

export function getRoomStatusBadgeClass(status: string): string {
  const classes = {
    clean: 'bg-green-100 text-green-800 border-green-200',
    dirty: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inspected: 'bg-blue-100 text-blue-800 border-blue-200', 
    out_of_order: 'bg-red-100 text-red-800 border-red-200'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function formatRoomNumber(roomNumber: string): string {
  // Format room number for display (e.g., pad with zeros)
  if (/^\d+$/.test(roomNumber)) {
    return roomNumber.padStart(3, '0')
  }
  return roomNumber
}

export function calculateRoomRevenue(room: any, occupancyDays: number = 30): number {
  return (room.base_rate || 0) * occupancyDays * (room.occupancy_rate || 0.7)
}

export function getOptimalRoomRate(room: any, seasonalFactor: number = 1): number {
  const baseRate = room.base_rate || 0
  const amenityBonus = (room.amenities?.length || 0) * 0.05 // 5% per amenity
  const capacityFactor = (room.capacity || 2) / 2 // Standard is 2 guests
  
  return Math.round(baseRate * seasonalFactor * (1 + amenityBonus) * capacityFactor)
}