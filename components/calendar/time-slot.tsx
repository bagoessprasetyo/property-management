'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReservationCard } from './reservation-card'
import { Plus, Clock } from 'lucide-react'

interface TimeSlotProps {
  time: string
  reservations: any[]
  onReservationClick: (reservationId: string) => void
  onCreateReservation: () => void
}

export function TimeSlot({
  time,
  reservations,
  onReservationClick,
  onCreateReservation
}: TimeSlotProps) {
  const hasReservations = reservations.length > 0

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      hasReservations ? 'border-warm-brown-200' : 'border-gray-200'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">{time}</span>
            {hasReservations && (
              <Badge variant="secondary" className="text-xs">
                {reservations.length}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateReservation}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {reservations.length > 0 ? (
            reservations.map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                compact={true}
                onClick={() => onReservationClick(reservation.id)}
                onEdit={(id) => onReservationClick(id)}
                onView={(id) => onReservationClick(id)}
              />
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              Tidak ada reservasi
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}