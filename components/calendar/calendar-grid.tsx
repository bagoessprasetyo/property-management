'use client'

import { useMemo, memo, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { CalendarViewType } from './calendar-view'
import { ReservationCard } from './reservation-card'
import { TimeSlot } from './time-slot'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useCalendarReservationUpdate } from '@/lib/hooks/use-calendar'

interface CalendarGridProps {
  viewType: CalendarViewType
  currentDate: Date
  dateRange: { start: Date; end: Date }
  rooms: any[]
  reservations: any[]
  onReservationClick: (reservationId: string) => void
  onCreateReservation: (data?: { roomId?: string; date?: string; time?: string }) => void
}

export const CalendarGrid = memo(function CalendarGrid({
  viewType,
  currentDate,
  dateRange,
  rooms,
  reservations,
  onReservationClick,
  onCreateReservation
}: CalendarGridProps) {
  const updateReservation = useCalendarReservationUpdate()

  // Generate time slots for day view
  const timeSlots = useMemo(() => {
    if (viewType !== 'day') return []
    
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        time: `${hour.toString().padStart(2, '0')}:00`
      })
    }
    return slots
  }, [viewType])

  // Generate date columns
  const dateColumns = useMemo(() => {
    const dates = []
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    
    switch (viewType) {
      case 'day':
        dates.push(new Date(currentDate))
        break
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(start)
          date.setDate(start.getDate() + i)
          dates.push(date)
        }
        break
      case 'month':
        // Generate all days in month view
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        
        // Start from the first day of the week containing the first day of the month
        const startDate = new Date(firstDayOfMonth)
        startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())
        
        // Generate 6 weeks (42 days) to fill the calendar grid
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          dates.push(date)
        }
        break
      case 'timeline':
        for (let i = 0; i < 30; i++) {
          const date = new Date(start)
          date.setDate(start.getDate() + i)
          dates.push(date)
        }
        break
    }
    
    return dates
  }, [viewType, dateRange, currentDate])

  // Organize reservations by room and date
  const gridData = useMemo(() => {
    const grid: Record<string, Record<string, any[]>> = {}

    // Initialize grid structure
    rooms.forEach(room => {
      grid[room.id] = {}
      dateColumns.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        grid[room.id][dateKey] = []
      })
    })

    // Place reservations in the grid
    reservations.forEach(reservation => {
      if (!reservation.room_id || !grid[reservation.room_id]) return

      const checkInDate = reservation.check_in_date.split('T')[0]
      const checkOutDate = reservation.check_out_date.split('T')[0]

      dateColumns.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        
        if (dateKey >= checkInDate && dateKey < checkOutDate) {
          grid[reservation.room_id][dateKey].push(reservation)
        }
      })
    })

    return grid
  }, [rooms, reservations, dateColumns])

  const handleDragStart = useCallback((start: any) => {
    // Add visual feedback when drag starts
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`) as HTMLElement
    if (draggedElement) {
      draggedElement.style.transform = 'rotate(5deg)'
      draggedElement.style.opacity = '0.8'
    }
  }, [])

  const handleDragEnd = useCallback(async (result: any) => {
    const { destination, source, draggableId } = result

    // Reset visual feedback
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${draggableId}"]`) as HTMLElement
    if (draggedElement) {
      draggedElement.style.transform = ''
      draggedElement.style.opacity = ''
    }

    if (!destination) return

    // No change if dropped in same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Extract room ID and date from droppable ID
    const [, newRoomId, newDate] = destination.droppableId.split('-')
    const [, sourceRoomId, sourceDate] = source.droppableId.split('-')
    const reservationId = draggableId

    // Find the reservation being moved
    const reservation = reservations.find(r => r.id === reservationId)
    if (!reservation) return

    try {
      const updates: any = {}
      
      // Update room if changed
      if (newRoomId !== sourceRoomId) {
        updates.newRoomId = newRoomId
      }
      
      // Update dates if moved to different date
      if (newDate !== sourceDate && newDate) {
        const originalCheckIn = new Date(reservation.check_in_date)
        const originalCheckOut = new Date(reservation.check_out_date)
        const duration = originalCheckOut.getTime() - originalCheckIn.getTime()
        
        updates.newCheckIn = newDate
        updates.newCheckOut = new Date(new Date(newDate).getTime() + duration).toISOString().split('T')[0]
      }

      if (Object.keys(updates).length > 0) {
        await updateReservation.mutateAsync({
          reservationId,
          ...updates
        })
      }
    } catch (error) {
      console.error('Failed to update reservation:', error)
      // TODO: Show user-friendly error message
    }
  }, [updateReservation])

  const renderDayView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Time Schedule */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Jadwal Hari Ini</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {timeSlots.map(slot => (
              <TimeSlot
                key={slot.hour}
                time={slot.label}
                reservations={reservations.filter(r => {
                  const checkInDate = new Date(r.check_in_date)
                  const currentSlotDate = new Date(currentDate)
                  currentSlotDate.setHours(slot.hour, 0, 0, 0)
                  checkInDate.setHours(14, 0, 0, 0) // Default check-in time
                  return checkInDate.toDateString() === currentSlotDate.toDateString() && slot.hour === 14
                })}
                onReservationClick={onReservationClick}
                onCreateReservation={() => onCreateReservation({ 
                  date: currentDate.toISOString().split('T')[0],
                  time: slot.time
                })}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Room Status */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Status Kamar</h3>
          <div className="grid grid-cols-2 gap-2">
            {rooms.map(room => (
              <div
                key={room.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onCreateReservation({ roomId: room.id })}
              >
                <div className="font-medium">{room.room_number}</div>
                <div className="text-sm text-gray-600">{room.room_type}</div>
                <Badge
                  variant={room.status === 'clean' ? 'default' : 'secondary'}
                  className="text-xs mt-1"
                >
                  {room.status === 'clean' ? 'Bersih' : 
                   room.status === 'dirty' ? 'Kotor' : 
                   room.status === 'inspected' ? 'Inspeksi' : 'Maintenance'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderWeekView = () => {
    return (
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              {/* Header */}
              <div className="grid grid-cols-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                <div className="p-2 sm:p-3 lg:p-4 font-semibold text-gray-700 border-r border-gray-200 bg-white/80 backdrop-blur-sm min-w-[100px] sm:min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Kamar
                  </div>
                </div>
                {dateColumns.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-2 sm:p-3 lg:p-4 text-center font-medium border-r border-gray-200 last:border-r-0 relative min-w-[100px] sm:min-w-[120px] ${
                        isToday 
                          ? 'bg-gradient-to-b from-blue-100 to-blue-50 text-blue-800' 
                          : isWeekend 
                          ? 'bg-gradient-to-b from-orange-50 to-orange-25 text-orange-700'
                          : 'bg-white/80 backdrop-blur-sm text-gray-700'
                      }`}
                    >
                      {isToday && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                      )}
                      <div className="text-sm font-semibold">
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date.toLocaleDateString('id-ID', { month: 'short' })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Room rows */}
              {rooms.map((room, roomIndex) => (
                <div key={room.id} className={`grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-25 transition-colors duration-200 ${roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  {/* Room info */}
                  <div className="p-4 border-r border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        room.status === 'clean' ? 'bg-green-400' : 
                        room.status === 'dirty' ? 'bg-red-400' : 
                        room.status === 'inspected' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <div className="font-semibold text-gray-900">{room.room_number}</div>
                        <div className="text-xs text-gray-500 font-medium">{room.room_type}</div>
                        <Badge 
                          variant="outline"
                          className={`mt-1 text-xs border ${
                            room.status === 'clean' ? 'border-green-200 text-green-700 bg-green-50' : 
                            room.status === 'dirty' ? 'border-red-200 text-red-700 bg-red-50' : 
                            room.status === 'inspected' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' : 
                            'border-gray-200 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {room.status === 'clean' ? 'Bersih' : 
                           room.status === 'dirty' ? 'Kotor' : 
                           room.status === 'inspected' ? 'Inspeksi' : 'Maintenance'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Date cells */}
                  {dateColumns.map((date, dateIndex) => {
                    const dateKey = date.toISOString().split('T')[0]
                    const dayReservations = gridData[room.id]?.[dateKey] || []
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    
                    return (
                      <Droppable 
                        key={`${room.id}-${dateKey}`} 
                        droppableId={`room-${room.id}-${dateKey}`}
                      >
                        {(provided, snapshot) => {
                          const isValidDropTarget = true // TODO: Add room availability validation
                          
                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`p-3 min-h-[140px] border-r border-gray-200 last:border-r-0 relative transition-all duration-300 group ${
                                snapshot.isDraggingOver && isValidDropTarget
                                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-inner' 
                                  : snapshot.isDraggingOver && !isValidDropTarget
                                  ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-inner' 
                                  : isToday
                                  ? 'bg-gradient-to-br from-blue-25 to-blue-50'
                                  : isWeekend 
                                  ? 'bg-gradient-to-br from-gray-25 to-gray-50'
                                  : 'bg-white hover:bg-gradient-to-br hover:from-gray-25 hover:to-gray-50'
                              }`}
                            >
                              {/* Today indicator */}
                              {isToday && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                              )}

                              {/* Drop zone indicator */}
                              {snapshot.isDraggingOver && (
                                <div className={`absolute inset-2 flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
                                  isValidDropTarget ? 'border-green-400 bg-green-50/80 backdrop-blur-sm' : 'border-red-400 bg-red-50/80 backdrop-blur-sm'
                                }`}>
                                  <div className={`text-sm font-semibold flex items-center gap-2 ${
                                    isValidDropTarget ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${isValidDropTarget ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {isValidDropTarget ? 'Drop here' : 'Not available'}
                                  </div>
                                </div>
                              )}

                              {dayReservations.map((reservation, index) => (
                                <Draggable
                                  key={reservation.id}
                                  draggableId={reservation.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`mb-2 transition-all duration-200 ${
                                        snapshot.isDragging ? 'z-50 rotate-3 scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:shadow-md'
                                      }`}
                                    >
                                      <ReservationCard
                                        reservation={reservation}
                                        compact={true}
                                        onClick={() => onReservationClick(reservation.id)}
                                        onEdit={(id) => onReservationClick(id)}
                                        onView={(id) => onReservationClick(id)}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              
                              {/* Add reservation button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/80 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md backdrop-blur-sm"
                                onClick={() => onCreateReservation({ 
                                  roomId: room.id, 
                                  date: dateKey 
                                })}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              
                              {/* Empty state indicator */}
                              {dayReservations.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-300">
                                  <div className="text-xs text-gray-400 font-medium">Kosong</div>
                                </div>
                              )}
                              
                              {provided.placeholder}
                            </div>
                          )
                        }}
                      </Droppable>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DragDropContext>
    )
  }

  const renderMonthView = () => (
    <Card className="shadow-lg border-0 bg-white">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Day headers */}
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
            <div key={day} className={`p-2 sm:p-3 text-center font-semibold rounded-lg text-xs sm:text-sm ${
              index === 0 || index === 6 
                ? 'bg-gradient-to-b from-orange-100 to-orange-50 text-orange-700' 
                : 'bg-gradient-to-b from-gray-100 to-gray-50 text-gray-700'
            }`}>
              {day}
            </div>
          ))}
          
          {/* Date cells */}
          {dateColumns.map((date, index) => {
            const dateKey = date.toISOString().split('T')[0]
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === new Date().toDateString()
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            const dayReservations = reservations.filter(r => 
              r.check_in_date.startsWith(dateKey) || 
              (r.check_in_date <= dateKey && r.check_out_date > dateKey)
            )
            
            return (
              <div
                key={index}
                className={`p-2 sm:p-3 min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-2 rounded-xl cursor-pointer transition-all duration-300 group hover:shadow-md hover:scale-[1.02] ${
                  isToday 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 ring-2 ring-blue-400 ring-opacity-50' 
                    : isCurrentMonth 
                    ? isWeekend 
                      ? 'bg-gradient-to-br from-orange-25 to-orange-50 border-orange-200 hover:border-orange-300' 
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-25 hover:to-blue-50'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}
                onClick={() => onCreateReservation({ date: dateKey })}
              >
                <div className={`text-sm sm:text-lg font-bold mb-1 sm:mb-2 ${
                  isToday 
                    ? 'text-blue-800' 
                    : isCurrentMonth 
                    ? 'text-gray-900' 
                    : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayReservations.slice(0, viewType === 'month' ? 1 : 2).map((reservation, idx) => (
                    <div
                      key={reservation.id}
                      className={`text-xs p-1 sm:p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                        reservation.status === 'confirmed' 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300' 
                          : reservation.status === 'checked_in'
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300'
                          : reservation.status === 'pending'
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 hover:from-yellow-200 hover:to-yellow-300'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300'
                      } truncate font-medium`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onReservationClick(reservation.id)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          reservation.status === 'confirmed' ? 'bg-blue-500' :
                          reservation.status === 'checked_in' ? 'bg-green-500' :
                          reservation.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        {reservation.guest_name}
                      </div>
                    </div>
                  ))}
                  
                  {dayReservations.length > (viewType === 'month' ? 1 : 2) && (
                    <div className="text-xs text-gray-500 font-medium bg-gray-100 rounded-lg p-1 text-center">
                      +{dayReservations.length - (viewType === 'month' ? 1 : 2)} lagi
                    </div>
                  )}
                  
                  {dayReservations.length === 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-xs text-gray-400 text-center py-2 border-2 border-dashed border-gray-300 rounded-lg">
                        Klik untuk tambah
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const renderTimelineView = () => (
    <Card>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {dateColumns.map(date => {
              const dateKey = date.toISOString().split('T')[0]
              const dayReservations = reservations.filter(r => 
                r.check_in_date.startsWith(dateKey) || 
                (r.check_in_date <= dateKey && r.check_out_date > dateKey)
              )
              
              return (
                <div
                  key={dateKey}
                  className="flex-shrink-0 w-32 border rounded p-2 hover:bg-gray-50"
                >
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dayReservations.map(reservation => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        compact={true}
                        onClick={() => onReservationClick(reservation.id)}
                        onEdit={(id) => onReservationClick(id)}
                        onView={(id) => onReservationClick(id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </CardContent>
      </Card>
    )

  // Render appropriate view
  switch (viewType) {
    case 'day':
      return renderDayView()
    case 'week':
      return renderWeekView()
    case 'month':
      return renderMonthView()
    case 'timeline':
      return renderTimelineView()
    default:
      return renderWeekView()
  }
})