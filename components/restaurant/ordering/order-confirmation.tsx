'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, ChefHat, Truck, Receipt, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useRestaurantOrder } from '@/lib/hooks/use-restaurant-orders'
import { formatIDR } from '@/lib/utils/currency'
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG } from '@/lib/types/restaurant'
import type { RestaurantOrderWithDetails, OrderStatus } from '@/lib/types/restaurant'

interface OrderConfirmationProps {
  orderId: string
  onClose?: () => void
  onNewOrder?: () => void
}

export function OrderConfirmation({ orderId, onClose, onNewOrder }: OrderConfirmationProps) {
  const { data: order, isLoading, error } = useRestaurantOrder(orderId)
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Track time elapsed since order creation
  useEffect(() => {
    if (!order) return

    const startTime = new Date(order.created_at).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000 / 60) // minutes
      setTimeElapsed(elapsed)
    }, 60000) // Update every minute

    // Initial calculation
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000 / 60)
    setTimeElapsed(elapsed)

    return () => clearInterval(interval)
  }, [order])

  if (isLoading) {
    return (
      <div className="bg-white flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-pulse mx-auto mb-4 text-warm-brown-600" />
          <p className="text-gray-600">Memuat detail pesanan...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <Card className='bg-white'>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Receipt className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pesanan Tidak Ditemukan</h3>
          <p className="text-gray-600 mb-4">
            Maaf, kami tidak dapat menemukan detail pesanan Anda.
          </p>
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status]
  const typeConfig = ORDER_TYPE_CONFIG[order.order_type]
  
  const estimatedReadyTime = order.estimated_ready_time 
    ? new Date(order.estimated_ready_time)
    : null

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pesanan Anda sedang menunggu konfirmasi dari dapur'
      case 'confirmed':
        return 'Pesanan dikonfirmasi dan akan segera disiapkan'
      case 'preparing':
        return 'Pesanan sedang disiapkan di dapur'
      case 'ready':
        return order.order_type === 'room_service' 
          ? 'Pesanan siap dan sedang dalam perjalanan ke kamar Anda'
          : 'Pesanan siap untuk diambil'
      case 'delivered':
        return 'Pesanan telah selesai'
      case 'cancelled':
        return 'Pesanan telah dibatalkan'
      default:
        return 'Status pesanan'
    }
  }

  const getEstimatedTimeMessage = () => {
    if (!estimatedReadyTime) return null
    
    const now = new Date()
    const diffMs = estimatedReadyTime.getTime() - now.getTime()
    const diffMinutes = Math.round(diffMs / 60000)
    
    if (diffMinutes <= 0) {
      return order.status === 'ready' ? 'Pesanan sudah siap!' : 'Estimasi waktu telah terlewati'
    }
    
    if (diffMinutes < 60) {
      return `Estimasi siap dalam ${diffMinutes} menit`
    }
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `Estimasi siap dalam ${hours} jam ${minutes} menit`
  }

  return (
    <div className="bg-white max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Pesanan Berhasil!
          </h2>
          <p className="text-green-700">
            Pesanan #{order.order_number} telah diterima
          </p>
        </CardContent>
      </Card>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status Pesanan</span>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{getStatusDescription(order.status)}</p>
          
          {/* Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Dipesan {timeElapsed} menit yang lalu</span>
            </div>
            
            {estimatedReadyTime && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ChefHat className="w-4 h-4" />
                <span>{getEstimatedTimeMessage()}</span>
              </div>
            )}
          </div>

          {/* Order Type */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            {order.guest && (
              <span className="text-sm text-gray-600">
                untuk {order.guest.first_name} {order.guest.last_name}
              </span>
            )}
            {order.room && (
              <span className="text-sm text-gray-600">
                • Kamar {order.room.room_number}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {order.items?.map((orderItem, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{orderItem.item?.name}</span>
                    <span className="text-gray-500">×{orderItem.quantity}</span>
                  </div>
                  {orderItem.special_instructions && (
                    <p className="text-sm text-gray-600 italic mt-1">
                      "{orderItem.special_instructions}"
                    </p>
                  )}
                </div>
                <span className="font-medium">
                  {formatIDR(orderItem.total_price)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total</span>
            <span className="text-warm-brown-600">{formatIDR(order.total_amount)}</span>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-1">Catatan Khusus:</h4>
              <p className="text-yellow-700 text-sm">{order.special_instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>
              Untuk pertanyaan tentang pesanan, hubungi front desk di ext. 0 atau 
              melalui telepon kamar Anda.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Tutup
        </Button>
        <Button 
          onClick={onNewOrder} 
          className="flex-1 bg-warm-brown-600 hover:bg-warm-brown-700"
        >
          Pesan Lagi
        </Button>
      </div>
    </div>
  )
}