'use client'

import { useState, useEffect } from 'react'
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Bell,
  Users,
  MapPin,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  useKitchenOrders, 
  useUpdateOrderStatus, 
  useRestaurantOrdersStats 
} from '@/lib/hooks/use-restaurant-orders'
import { formatIDR } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { KitchenOrder, OrderStatus } from '@/lib/types/restaurant'
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG } from '@/lib/types/restaurant'

// Single property setup - hardcoded property ID
const PROPERTY_ID = '571da531-4a8e-4e37-89e9-78667ec52847'

interface KitchenDisplayProps {}

export function KitchenDisplay({}: KitchenDisplayProps) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  
  const { data: orders, isLoading, refetch } = useKitchenOrders(PROPERTY_ID)
  const { data: stats } = useRestaurantOrdersStats(PROPERTY_ID)
  const updateOrderStatus = useUpdateOrderStatus()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, refetch])

  // Sound notification for new orders
  useEffect(() => {
    if (!soundEnabled || !orders) return

    const pendingOrders = orders.filter(order => order.status === 'pending')
    if (pendingOrders.length > 0) {
      // In a real app, you'd play a sound here
      console.log('🔔 New pending orders detected')
    }
  }, [orders, soundEnabled])

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      let estimatedReadyTime: string | undefined

      if (status === 'confirmed') {
        // Set estimated ready time based on preparation time
        const order = orders?.find(o => o.id === orderId)
        if (order) {
          const prepTime = order.total_prep_time || 30
          const readyTime = new Date(Date.now() + prepTime * 60000)
          estimatedReadyTime = readyTime.toISOString()
        }
      }

      await updateOrderStatus.mutateAsync({
        id: orderId,
        status,
        estimated_ready_time: estimatedReadyTime
      })

      toast.success(`Pesanan ${status === 'confirmed' ? 'dikonfirmasi' : 
                                 status === 'preparing' ? 'mulai disiapkan' :
                                 status === 'ready' ? 'siap' : 'diperbarui'}`)
    } catch (error) {
      toast.error('Gagal memperbarui status pesanan')
    }
  }

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 60) {
      return `${diffMinutes} menit lalu`
    }
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}j ${minutes}m lalu`
  }

  const getUrgencyLevel = (order: KitchenOrder) => {
    const now = new Date()
    const created = new Date(order.created_at)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    if (diffMinutes > 45) return 'critical'
    if (diffMinutes > 30) return 'warning'
    if (diffMinutes > 15) return 'attention'
    return 'normal'
  }

  // Group orders by status
  const groupedOrders = orders?.reduce((groups, order) => {
    const status = order.status
    if (!groups[status]) groups[status] = []
    groups[status].push(order)
    return groups
  }, {} as Record<string, KitchenOrder[]>) || {}

  if (isLoading) {
    return (
      <div className="bg-whiteflex items-center justify-center h-96">
        <div className="text-center">
          <ChefHat className="w-12 h-12 animate-pulse mx-auto mb-4 text-warm-brown-600" />
          <p className="text-gray-600">Memuat pesanan dapur...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Kitchen Display</h2>
          <p className="text-gray-600 mt-1">Monitor dan kelola pesanan restoran</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell className={`w-4 h-4 mr-2 ${soundEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            {soundEnabled ? 'Suara ON' : 'Suara OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <PauseCircle className="w-4 h-4 mr-2" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pesanan Aktif</p>
                <p className="text-2xl font-bold">{stats?.active_orders || 0}</p>
              </div>
              <ChefHat className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {groupedOrders.pending?.length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sedang Disiapkan</p>
                <p className="text-2xl font-bold text-blue-600">
                  {groupedOrders.preparing?.length || 0}
                </p>
              </div>
              <ChefHat className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siap Antar</p>
                <p className="text-2xl font-bold text-green-600">
                  {groupedOrders.ready?.length || 0}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
            Menunggu Konfirmasi ({groupedOrders.pending?.length || 0})
          </h3>
          
          {groupedOrders.pending?.map(order => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              urgencyLevel={getUrgencyLevel(order)}
              timeElapsed={getTimeElapsed(order.created_at)}
              onStatusUpdate={handleStatusUpdate}
              isSelected={selectedOrder === order.id}
              onSelect={() => setSelectedOrder(order.id)}
            />
          ))}
          
          {(!groupedOrders.pending || groupedOrders.pending.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada pesanan menunggu</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preparing Orders */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ChefHat className="w-5 h-5 mr-2 text-blue-500" />
            Sedang Disiapkan ({groupedOrders.preparing?.length || 0})
          </h3>
          
          {groupedOrders.preparing?.map(order => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              urgencyLevel={getUrgencyLevel(order)}
              timeElapsed={getTimeElapsed(order.created_at)}
              onStatusUpdate={handleStatusUpdate}
              isSelected={selectedOrder === order.id}
              onSelect={() => setSelectedOrder(order.id)}
            />
          ))}
          
          {(!groupedOrders.preparing || groupedOrders.preparing.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada pesanan sedang disiapkan</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ready Orders */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Siap Antar ({groupedOrders.ready?.length || 0})
          </h3>
          
          {groupedOrders.ready?.map(order => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              urgencyLevel={getUrgencyLevel(order)}
              timeElapsed={getTimeElapsed(order.created_at)}
              onStatusUpdate={handleStatusUpdate}
              isSelected={selectedOrder === order.id}
              onSelect={() => setSelectedOrder(order.id)}
            />
          ))}
          
          {(!groupedOrders.ready || groupedOrders.ready.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada pesanan siap antar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Kitchen Order Card Component
interface KitchenOrderCardProps {
  order: KitchenOrder
  urgencyLevel: 'normal' | 'attention' | 'warning' | 'critical'
  timeElapsed: string
  onStatusUpdate: (orderId: string, status: OrderStatus) => void
  isSelected: boolean
  onSelect: () => void
}

function KitchenOrderCard({ 
  order, 
  urgencyLevel, 
  timeElapsed, 
  onStatusUpdate, 
  isSelected, 
  onSelect 
}: KitchenOrderCardProps) {
  const urgencyColors = {
    normal: 'border-gray-200',
    attention: 'border-yellow-200 bg-yellow-50',
    warning: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed'
      case 'confirmed': return 'preparing'
      case 'preparing': return 'ready'
      case 'ready': return 'delivered'
      default: return null
    }
  }

  const getStatusButtonText = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case 'pending': return 'Konfirmasi'
      case 'confirmed': return 'Mulai Masak'
      case 'preparing': return 'Siap'
      case 'ready': return 'Kirim'
      default: return 'Update'
    }
  }

  const nextStatus = getNextStatus(order.status)
  const typeConfig = ORDER_TYPE_CONFIG[order.order_type]

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        urgencyColors[urgencyLevel],
        isSelected && 'ring-2 ring-warm-brown-500'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{order.order_number}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            {urgencyLevel === 'critical' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{order.guest_name}</span>
          </div>
          {order.room_number && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Kamar {order.room_number}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex-1">
                <span className="font-medium">{item.item_name}</span>
                {item.special_instructions && (
                  <p className="text-xs text-gray-600 italic mt-1">
                    "{item.special_instructions}"
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>×{item.quantity}</span>
                {item.preparation_time && (
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{item.preparation_time}m</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">{order.special_instructions}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{timeElapsed}</span>
            <span>•</span>
            <span>{order.total_prep_time}m est.</span>
          </div>
          
          {nextStatus && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(order.id, nextStatus)
              }}
              className="bg-warm-brown-600 hover:bg-warm-brown-700"
            >
              {getStatusButtonText(order.status)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}