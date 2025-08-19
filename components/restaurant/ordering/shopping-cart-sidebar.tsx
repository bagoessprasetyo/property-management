'use client'

import { useState } from 'react'
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  X, 
  MessageSquare,
  Send,
  Clock,
  User,
  MapPin
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatIDR } from '@/lib/utils/currency'
import type { Cart, CartItem, OrderType } from '@/lib/types/restaurant'

interface ShoppingCartSidebarProps {
  cart: Cart
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateItem: (itemId: string, quantity: number, specialInstructions?: string) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  onSubmitOrder: (orderData: {
    orderType: OrderType
    specialInstructions?: string
    deliveryTime?: string
  }) => void
  guestId?: string
  roomId?: string
  reservationId?: string
}

export function ShoppingCartSidebar({
  cart,
  open,
  onOpenChange,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  guestId,
  roomId,
  reservationId
}: ShoppingCartSidebarProps) {
  const [orderType, setOrderType] = useState<OrderType>('room_service')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(item.item.id)
    } else {
      onUpdateItem(item.item.id, newQuantity, item.special_instructions)
    }
  }

  const handleSpecialInstructionsChange = (item: CartItem, instructions: string) => {
    onUpdateItem(item.item.id, item.quantity, instructions)
  }

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmitOrder({
        orderType,
        specialInstructions,
        deliveryTime: deliveryTime || undefined
      })
      // Reset form
      setSpecialInstructions('')
      setDeliveryTime('')
      onClearCart()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate estimated total preparation time
  const estimatedPrepTime = cart.items.reduce((max, item) => {
    const itemPrepTime = item.item.preparation_time || 15
    return Math.max(max, itemPrepTime)
  }, 0)

  const generateDeliveryTimeOptions = () => {
    const options = []
    const now = new Date()
    
    // Add 30 minutes from now as minimum
    const minTime = new Date(now.getTime() + 30 * 60000)
    
    for (let i = 0; i < 24; i++) { // Next 12 hours in 30-minute intervals
      const time = new Date(minTime.getTime() + i * 30 * 60000)
      const timeString = time.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      const dateString = time.toLocaleDateString('id-ID')
      const label = time.toDateString() === now.toDateString() 
        ? `Hari ini, ${timeString}`
        : `${dateString}, ${timeString}`
      
      options.push({
        value: time.toISOString(),
        label
      })
    }
    
    return options
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-white w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Keranjang Belanja
          </SheetTitle>
          <SheetDescription>
            {cart.itemCount} item | Total: {formatIDR(cart.total)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                <p>Keranjang kosong</p>
                <p className="text-sm">Tambah item dari menu untuk mulai pesan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((cartItem) => (
                  <CartItemCard
                    key={cartItem.item.id}
                    item={cartItem}
                    onQuantityChange={(quantity) => handleQuantityChange(cartItem, quantity)}
                    onSpecialInstructionsChange={(instructions) => 
                      handleSpecialInstructionsChange(cartItem, instructions)
                    }
                    onRemove={() => onRemoveItem(cartItem.item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Configuration */}
          {cart.items.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              {/* Order Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Jenis Pesanan
                </label>
                <Select value={orderType} onValueChange={(value: OrderType) => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room_service">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Room Service
                      </div>
                    </SelectItem>
                    <SelectItem value="dine_in">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Dine In
                      </div>
                    </SelectItem>
                    <SelectItem value="takeaway">
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Takeaway
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Time */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Waktu Pengiriman (Opsional)
                </label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Secepatnya" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Secepatnya</SelectItem>
                    {generateDeliveryTimeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!deliveryTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Estimasi {estimatedPrepTime} menit
                  </p>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Catatan Khusus
                </label>
                <Textarea
                  placeholder="Contoh: Tidak pakai es, level pedas sedang, dll"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.itemCount} item)</span>
                  <span>{formatIDR(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Biaya Layanan</span>
                  <span>Gratis</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-warm-brown-600">{formatIDR(cart.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="gap-2 sm:gap-0">
          {cart.items.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={onClearCart}
                disabled={isSubmitting}
              >
                Kosongkan
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-warm-brown-600 hover:bg-warm-brown-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pesan Sekarang
                  </>
                )}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Cart Item Card Component
interface CartItemCardProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onSpecialInstructionsChange: (instructions: string) => void
  onRemove: () => void
}

function CartItemCard({ 
  item, 
  onQuantityChange, 
  onSpecialInstructionsChange, 
  onRemove 
}: CartItemCardProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start space-x-3">
          {/* Item image */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
            {item.item.image_url ? (
              <img 
                src={item.item.image_url} 
                alt={item.item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          {/* Item details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{item.item.name}</h4>
                <p className="text-sm text-gray-600">{formatIDR(item.item.price)}</p>
                
                {item.item.preparation_time && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.item.preparation_time} min
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(item.quantity - 1)}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(item.quantity + 1)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-sm font-semibold text-warm-brown-600">
                {formatIDR(item.subtotal)}
              </div>
            </div>

            {/* Special instructions */}
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                className="h-6 p-0 text-xs text-gray-500"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                {item.special_instructions ? 'Edit catatan' : 'Tambah catatan'}
              </Button>
              
              {showInstructions && (
                <div className="mt-2">
                  <Input
                    placeholder="Catatan khusus untuk item ini"
                    value={item.special_instructions || ''}
                    onChange={(e) => onSpecialInstructionsChange(e.target.value)}
                    className="text-xs"
                    // size="sm"
                  />
                </div>
              )}
              
              {item.special_instructions && !showInstructions && (
                <p className="text-xs text-gray-600 mt-1 italic">
                  "{item.special_instructions}"
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}