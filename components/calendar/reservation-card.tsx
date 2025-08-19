'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatIDR } from '@/lib/utils/currency'
import { ReservationContextMenu } from './reservation-context-menu'
import { 
  Users, 
  Clock, 
  CreditCard,
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface ReservationCardProps {
  reservation: any
  compact?: boolean
  showDetails?: boolean
  onClick?: () => void
  onEdit?: (reservationId: string) => void
  onView?: (reservationId: string) => void
  onDuplicate?: (reservationId: string) => void
}

export const ReservationCard = memo(function ReservationCard({ 
  reservation, 
  compact = false,
  showDetails = false,
  onClick,
  onEdit,
  onView,
  onDuplicate
}: ReservationCardProps) {
  
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'Menunggu', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock 
      },
      confirmed: { 
        label: 'Dikonfirmasi', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle 
      },
      checked_in: { 
        label: 'Check-in', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle 
      },
      checked_out: { 
        label: 'Check-out', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle 
      },
      cancelled: { 
        label: 'Dibatalkan', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle 
      },
      no_show: { 
        label: 'Tidak Datang', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle 
      }
    }
    
    return configs[status as keyof typeof configs] || configs.pending
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600'
      case 'partial':
        return 'text-yellow-600'
      case 'unpaid':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const calculateNights = () => {
    const checkIn = new Date(reservation.check_in_date)
    const checkOut = new Date(reservation.check_out_date)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const statusConfig = getStatusConfig(reservation.status)
  const StatusIcon = statusConfig.icon

  if (compact) {
    return (
      <ReservationContextMenu
        reservation={reservation}
        onEdit={onEdit || (() => {})}
        onView={onView || (() => {})}
        onDuplicate={onDuplicate}
      >
        <Card 
          className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 bg-gradient-to-r from-white to-gray-25 hover:from-white hover:to-blue-25 group ${
            reservation.status === 'checked_in' ? 'border-l-green-500 hover:border-l-green-400' :
            reservation.status === 'confirmed' ? 'border-l-blue-500 hover:border-l-blue-400' :
            reservation.status === 'pending' ? 'border-l-yellow-500 hover:border-l-yellow-400' :
            'border-l-gray-500 hover:border-l-gray-400'
          } hover:scale-[1.02] hover:-translate-y-1`}
          onClick={onClick}
        >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex flex-col items-start space-y-2 justify-between">
              <Badge className={`${statusConfig.color} text-xs transition-all duration-200 group-hover:scale-105`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {reservation.total_amount && (
                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  {formatIDR(reservation.total_amount)}
                </div>
              )}
            </div>
            
            <div className="text-sm font-semibold truncate text-gray-900 group-hover:text-gray-700 transition-colors">
              {reservation.guest_name || 'Nama tidak tersedia'}
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                <Users className="w-3 h-3 mr-1.5 text-blue-500" />
                <span className="font-medium">
                  {reservation.adults}
                  {reservation.children > 0 && ` +${reservation.children}`}
                </span>
              </div>
              
              {reservation.room_number && (
                <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                  <MapPin className="w-3 h-3 mr-1.5 text-green-500" />
                  <span className="font-medium">{reservation.room_number}</span>
                </div>
              )}
              
              <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                <Clock className="w-3 h-3 mr-1.5 text-orange-500" />
                <span className="font-medium">14:00 - 12:00</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </ReservationContextMenu>
    )
  }

  return (
    <ReservationContextMenu
      reservation={reservation}
      onEdit={onEdit || (() => {})}
      onView={onView || (() => {})}
      onDuplicate={onDuplicate}
    >
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
          reservation.status === 'checked_in' ? 'border-l-green-500' :
          reservation.status === 'confirmed' ? 'border-l-blue-500' :
          reservation.status === 'pending' ? 'border-l-yellow-500' :
          'border-l-gray-500'
        }`}
        onClick={onClick}
      >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {reservation.confirmation_number && (
              <div className="text-xs text-gray-500 font-mono">
                #{reservation.confirmation_number}
              </div>
            )}
          </div>

          {/* Guest Information */}
          <div>
            <div className="font-semibold text-gray-900">
              {reservation.guest_name || 'Nama tidak tersedia'}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {reservation.adults} dewasa
                {reservation.children > 0 && `, ${reservation.children} anak`}
              </div>
              {reservation.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {reservation.phone}
                </div>
              )}
            </div>
          </div>

          {/* Room and Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {reservation.room_number || 'Belum ditentukan'}
                </span>
              </div>
              {reservation.room_type && (
                <div className="text-xs text-gray-500 ml-5">
                  {reservation.room_type}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {calculateNights()} malam
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-5">
                {new Date(reservation.check_in_date).toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'short' 
                })} - {new Date(reservation.check_out_date).toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </div>
            </div>
          </div>

          {/* Times */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                Check-in: 14:00 WIB
              </span>
            </div>
            <div className="text-gray-600">
              Check-out: 12:00 WIB
            </div>
          </div>

          {/* Payment Information */}
          {reservation.total_amount && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1 text-gray-600" />
                <span className="text-sm text-gray-600">Total:</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatIDR(reservation.total_amount)}
                </div>
                {reservation.payment_status && (
                  <div className={`text-xs ${getPaymentStatusColor(reservation.payment_status)}`}>
                    {reservation.payment_status === 'paid' ? 'Lunas' : 
                     reservation.payment_status === 'partial' ? 'Sebagian' : 'Belum bayar'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {showDetails && reservation.special_requests && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>Permintaan khusus:</strong> {reservation.special_requests}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </ReservationContextMenu>
  )
})