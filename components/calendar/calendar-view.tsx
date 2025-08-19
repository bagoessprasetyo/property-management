'use client'

import { useState, useMemo } from 'react'
// Removed property context for single property setup
import { useReservations } from '@/lib/hooks/use-reservations'
import { useRooms } from '@/lib/hooks/use-rooms'
import { useCalendarData, useCalendarStats, useRoomAvailability } from '@/lib/hooks/use-calendar'
import { CalendarHeader } from './calendar-header'
import { CalendarGrid } from './calendar-grid'
import { ReservationForm } from '../reservations/reservation-form'
import { RealtimeProvider } from './real-time-provider'
import { Card } from '@/components/ui/card'

export type CalendarViewType = 'day' | 'week' | 'month' | 'timeline'

interface CalendarViewProps {
  defaultView?: CalendarViewType
  onReservationSelect?: (reservationId: string) => void
}

export function CalendarView({ 
  defaultView = 'week',
  onReservationSelect 
}: CalendarViewProps) {
  // Removed currentProperty for single property setup
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<CalendarViewType>(defaultView)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewType) {
      case 'day':
        // Same day
        end.setDate(start.getDate())
        break
      case 'week':
        // Start of week to end of week
        start.setDate(currentDate.getDate() - currentDate.getDay())
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        // Start of month to end of month
        start.setDate(1)
        end.setMonth(start.getMonth() + 1, 0)
        break
      case 'timeline':
        // 30 days from current date
        end.setDate(start.getDate() + 30)
        break
    }

    return { start, end }
  }, [currentDate, viewType])

  // Enhanced data hooks
  const { data: reservations, isLoading: reservationsLoading } = useCalendarData({
    propertyId: '',
    startDate: dateRange.start.toISOString().split('T')[0],
    endDate: dateRange.end.toISOString().split('T')[0]
  })
  
  const { data: rooms } = useRooms()
  const { data: allRooms } = useRooms() // Fallback for when property rooms are empty
  const { data: calendarStats, refetch: refetchStats } = useCalendarStats(
    '',
    dateRange.start.toISOString().split('T')[0],
    dateRange.end.toISOString().split('T')[0]
  )

  // Use appropriate rooms data
  const roomsData = (rooms?.length || 0) > 0 ? rooms : allRooms

  // Filter reservations for current date range (kept for backward compatibility)
  const filteredReservations = useMemo(() => {
    if (!reservations) return []

    return reservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in_date)
      const checkOut = new Date(reservation.check_out_date)
      
      // Check if reservation overlaps with date range
      return checkIn <= dateRange.end && checkOut >= dateRange.start
    })
  }, [reservations, dateRange])

  const handleDateNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)

    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }

    const increment = direction === 'next' ? 1 : -1

    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + increment)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * increment))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + increment)
        break
      case 'timeline':
        newDate.setDate(newDate.getDate() + (30 * increment))
        break
    }

    setCurrentDate(newDate)
  }

  const handleReservationClick = (reservationId: string) => {
    setSelectedReservationId(reservationId)
    onReservationSelect?.(reservationId)
  }

  const handleCreateReservation = (preselectedData?: {
    roomId?: string
    date?: string
    time?: string
  }) => {
    // TODO: Pass preselected data to form
    setShowCreateForm(true)
  }

  const handleRefresh = () => {
    refetchStats()
    // TODO: Refetch reservation data
  }

  if (reservationsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-warm-brown-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Memuat kalender...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <RealtimeProvider propertyId={''}>
      <div className="space-y-4">
        <CalendarHeader
          currentDate={currentDate}
          viewType={viewType}
          onDateNavigate={handleDateNavigate}
          onViewTypeChange={setViewType}
          onCreateReservation={() => handleCreateReservation()}
          onRefresh={handleRefresh}
          stats={calendarStats ? {
            totalReservations: calendarStats.totalReservations,
            checkInsToday: calendarStats.checkInsInPeriod,
            checkOutsToday: calendarStats.checkOutsInPeriod,
            pendingReservations: calendarStats.statusCounts.pending || 0
          } : undefined}
          reservations={reservations}
          dateRange={{
            start: dateRange.start.toISOString().split('T')[0],
            end: dateRange.end.toISOString().split('T')[0]
          }}
        />

        <CalendarGrid
          viewType={viewType}
          currentDate={currentDate}
          dateRange={dateRange}
          rooms={roomsData || []}
          reservations={filteredReservations}
          onReservationClick={handleReservationClick}
          onCreateReservation={handleCreateReservation}
        />

        {/* Reservation Form Dialog */}
        <ReservationForm
          reservation={selectedReservationId ? reservations?.find(r => r.id === selectedReservationId) : undefined}
          open={showCreateForm}
          onOpenChange={(open) => {
            setShowCreateForm(open)
            if (!open) setSelectedReservationId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedReservationId(null)
          }}
        />
      </div>
    </RealtimeProvider>
  )
}