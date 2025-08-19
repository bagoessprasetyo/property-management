'use client'

import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
// Removed property context for single property setup
import { useReservations, useUpdateReservation } from '@/lib/hooks/use-reservations'
import { useRooms } from '@/lib/hooks/use-rooms'
import { formatDateShort } from '@/lib/utils/date'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  ChevronLeft, 
  ChevronRight,
  Plus,
  Users,
  Clock,
  MapPin
} from 'lucide-react'
import { ReservationForm } from './reservation-form'

interface ReservationGridProps {
  startDate?: Date
  endDate?: Date
}

export function ReservationGrid({ 
  startDate = new Date(), 
  endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
}: ReservationGridProps) {
  // Removed currentProperty for single property setup
  const { data: reservations } = useReservations()
  const { data: rooms, error: roomsError, isLoading: roomsLoading } = useRooms()
  // Load ALL rooms as fallback when property rooms are empty
  const { data: allRooms } = useRooms()
  const updateReservation = useUpdateReservation()
  
  // Start from a week ago to show more reservations
  const defaultStartDate = new Date()
  defaultStartDate.setDate(defaultStartDate.getDate() - 7)
  const [currentWeekStart, setCurrentWeekStart] = useState(defaultStartDate)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Generate date columns for the grid (7 days)
  const dateColumns = useMemo(() => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [currentWeekStart])

  // Filter and organize reservations by room and date
  const gridData = useMemo(() => {
    // Use allRooms as fallback if property-specific rooms are empty
    const roomsToUse = (rooms?.length || 0) > 0 ? rooms : allRooms
    
    if (!roomsToUse || !reservations) {
      return {}
    }


    const grid: Record<string, Record<string, any[]>> = {}

    // Initialize grid structure
    roomsToUse.forEach(room => {
      grid[room.id] = {}
      dateColumns.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        grid[room.id][dateKey] = []
      })
    })

    // Place reservations in the grid
    reservations.forEach(reservation => {
      if (!reservation.room_id) {
        console.warn('Reservation missing room_id:', reservation.id)
        return
      }

      if (!grid[reservation.room_id]) {
        console.warn('Room not found in grid:', reservation.room_id)
        return
      }

      const checkInStr = reservation.check_in_date
      const checkOutStr = reservation.check_out_date
      
      if (!checkInStr || !checkOutStr) {
        console.warn('Reservation missing dates:', reservation.id)
        return
      }

      // Use date strings for comparison to avoid timezone issues
      const checkInDate = checkInStr.split('T')[0] // Get YYYY-MM-DD part
      const checkOutDate = checkOutStr.split('T')[0]
      
      
      // Check if reservation overlaps with our date range
      let placed = false
      dateColumns.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        
        // Check if this date falls within the reservation period
        // More inclusive logic: show reservation if it overlaps with any part of this date
        const isWithinRange = dateKey >= checkInDate && dateKey < checkOutDate
        const isCheckInDay = dateKey === checkInDate
        const isCheckOutDay = dateKey === checkOutDate
        const isSpanningDay = checkInDate < dateKey && dateKey < checkOutDate
        
        if (isWithinRange || isCheckInDay) {
          grid[reservation.room_id][dateKey].push(reservation)
          placed = true
        }
      })
      
    })


    return grid
  }, [rooms, allRooms, reservations, dateColumns])

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination || !source) return

    // If dropped in the same position, do nothing
    if (destination.droppableId === source.droppableId) return

    // Extract room ID from droppable ID (format: "room-{roomId}-{date}")
    const destinationRoomId = destination.droppableId.split('-')[1]
    const reservationId = draggableId

    try {
      // Update reservation with new room
      await updateReservation.mutateAsync({
        id: reservationId,
        updates: {
          room_id: destinationRoomId
        }
      })
    } catch (error) {
      console.error('Failed to update reservation:', error)
      // In a real app, show a toast notification here
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'checked_in':
        return 'bg-green-100 text-green-800'
      case 'checked_out':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Use rooms or allRooms for display
  const roomsToDisplay = (rooms?.length || 0) > 0 ? rooms : allRooms
  
  if (!roomsToDisplay) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Grid Reservasi</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {formatDateShort(dateColumns[0])} - {formatDateShort(dateColumns[6])}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentWeekStart(new Date())}
          >
            Hari Ini
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const futureDate = new Date()
              futureDate.setDate(futureDate.getDate() + 7)
              setCurrentWeekStart(futureDate)
            }}
          >
            Minggu Depan
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newStart = new Date()
              newStart.setDate(newStart.getDate() - 30)
              setCurrentWeekStart(newStart)
            }}
          >
            30 Hari Lalu
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Set to show the reservations date range
              const reservationDate = new Date('2025-08-18')
              setCurrentWeekStart(reservationDate)
            }}
          >
            Show Reservations
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Reservasi Baru
          </Button>
        </div>
      </div>

      {/* Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="border rounded-lg overflow-hidden">
          {/* Date header */}
          <div className="grid grid-cols-8 bg-gray-50 border-b">
            <div className="p-3 font-medium border-r">Kamar</div>
            {dateColumns.map((date, index) => (
              <div key={index} className="p-3 text-center font-medium border-r last:border-r-0">
                <div className="text-sm">{date.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                <div className="text-xs text-gray-600">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {roomsToDisplay.map((room) => (
            <div key={room.id} className="grid grid-cols-8 border-b last:border-b-0">
              {/* Room info */}
              <div className="p-3 border-r bg-gray-50">
                <div className="font-medium">{room.room_number}</div>
                <div className="text-xs text-gray-600">{room.room_type}</div>
                <Badge 
                  variant={room.status === 'clean' ? 'default' : 'secondary'}
                  className="mt-1 text-xs"
                >
                  {room.status === 'clean' ? 'Bersih' : 
                   room.status === 'dirty' ? 'Kotor' : 
                   room.status === 'inspected' ? 'Inspeksi' : 'Maintenance'}
                </Badge>
              </div>

              {/* Date cells */}
              {dateColumns.map((date, dateIndex) => {
                const dateKey = date.toISOString().split('T')[0]
                const dayReservations = gridData[room.id]?.[dateKey] || []
                
                return (
                  <Droppable 
                    key={`${room.id}-${dateKey}`} 
                    droppableId={`room-${room.id}-${dateKey}`}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 min-h-[120px] border-r last:border-r-0 ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {dayReservations.map((reservation, index) => (
                          <Draggable
                            key={reservation.id}
                            draggableId={reservation.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <CardContent className="p-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Badge className={getStatusColor(reservation.status)}>
                                        {reservation.status === 'confirmed' ? 'Dikonfirmasi' :
                                         reservation.status === 'checked_in' ? 'Check-in' :
                                         reservation.status === 'checked_out' ? 'Check-out' :
                                         'Dibatalkan'}
                                      </Badge>
                                    </div>
                                    <div className="text-sm font-medium">
                                      {reservation.guest_name || 'Nama tidak tersedia'}
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {reservation.adults}
                                        {reservation.children > 0 && ` +${reservation.children} anak`}
                                      </div>
                                      <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDateShort(new Date(reservation.check_in_date))} - 
                                        {formatDateShort(new Date(reservation.check_out_date))}
                                      </div>
                                      {/* {reservation.total_amount && (
                                        <div className="text-green-600 font-medium">
                                          {formatIDR(reservation.total_amount)}
                                        </div>
                                      )} */}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Reservation Form Dialog */}
      <ReservationForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => setShowCreateForm(false)}
      />
    </div>
  )
}