'use client'

import { useState } from 'react'
import { useCreateRestaurantOrder } from '@/lib/hooks/use-restaurant-orders'
import { GuestMenu } from './guest-menu'
import { OrderConfirmation } from './order-confirmation'
import { toast } from 'sonner'
import type { Cart, OrderType, CreateOrderFormData } from '@/lib/types/restaurant'

// Single property setup - hardcoded property ID
const PROPERTY_ID = '571da531-4a8e-4e37-89e9-78667ec52847'

interface GuestOrderingPageProps {
  guestId?: string
  roomId?: string
  reservationId?: string
  guestName?: string
  roomNumber?: string
}

export function GuestOrderingPage({
  guestId,
  roomId,
  reservationId,
  guestName,
  roomNumber
}: GuestOrderingPageProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const createOrder = useCreateRestaurantOrder()

  const handleOrderSubmit = async (
    cart: Cart,
    orderData: {
      orderType: OrderType
      specialInstructions?: string
      deliveryTime?: string
    }
  ) => {
    if (cart.items.length === 0) {
      toast.error('Keranjang kosong')
      return
    }

    try {
      // Prepare order data
      const orderFormData: CreateOrderFormData & { property_id: string } = {
        property_id: PROPERTY_ID,
        guest_id: guestId,
        room_id: roomId,
        reservation_id: reservationId,
        order_type: orderData.orderType,
        special_instructions: orderData.specialInstructions,
        delivery_time: orderData.deliveryTime,
        items: cart.items.map(cartItem => ({
          item_id: cartItem.item.id,
          quantity: cartItem.quantity,
          unit_price: cartItem.item.price,
          special_instructions: cartItem.special_instructions
        }))
      }

      const order = await createOrder.mutateAsync(orderFormData)
      
      setCurrentOrderId(order.id)
      setShowConfirmation(true)
      
      toast.success('Pesanan berhasil dibuat!')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Gagal membuat pesanan. Silakan coba lagi.')
    }
  }

  const handleNewOrder = () => {
    setShowConfirmation(false)
    setCurrentOrderId(null)
  }

  const handleCloseConfirmation = () => {
    setShowConfirmation(false)
    setCurrentOrderId(null)
  }

  if (showConfirmation && currentOrderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <OrderConfirmation
            orderId={currentOrderId}
            onClose={handleCloseConfirmation}
            onNewOrder={handleNewOrder}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen bg-gray-50">
      {/* Header Info */}
      {(guestName || roomNumber) && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                {guestName && (
                  <h1 className="text-xl font-semibold text-gray-900">
                    Selamat datang, {guestName}
                  </h1>
                )}
                {roomNumber && (
                  <p className="text-gray-600">Kamar {roomNumber}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Room Service tersedia 24/7</p>
                <p>Estimasi pengiriman: 20-45 menit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <GuestMenu
          propertyId={PROPERTY_ID}
          guestId={guestId}
          roomId={roomId}
          reservationId={reservationId}
          onOrderSubmit={(cart, orderData) => handleOrderSubmit(cart, orderData)}
        />
      </div>
    </div>
  )
}