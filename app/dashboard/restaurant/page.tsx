'use client'

import { useState } from 'react'
import { 
  ChefHat, 
  TrendingUp, 
  Clock, 
  Package, 
  AlertTriangle,
  Eye,
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  useRestaurantOrdersStats,
  useActiveRestaurantOrders 
} from '@/lib/hooks/use-restaurant-orders'
import { 
  useRestaurantBillsStats,
  useOutstandingRestaurantBills 
} from '@/lib/hooks/use-restaurant-bills'
import { useRestaurantItemsStats } from '@/lib/hooks/use-restaurant-items'
import { useRestaurantAnalytics } from '@/lib/hooks/use-restaurant-analytics'
import { formatIDR } from '@/lib/utils/currency'
import { useSidebar } from '@/lib/context/sidebar-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Single property setup - hardcoded property ID
const PROPERTY_ID = '571da531-4a8e-4e37-89e9-78667ec52847'

export default function RestaurantPage() {
  const { isCollapsed } = useSidebar()
  const [selectedTimeRange, setSelectedTimeRange] = useState('today')

  // Fetch data
  const { data: orderStats, isLoading: orderStatsLoading } = useRestaurantOrdersStats(PROPERTY_ID)
  const { data: billStats, isLoading: billStatsLoading } = useRestaurantBillsStats(PROPERTY_ID)
  const { data: itemStats, isLoading: itemStatsLoading } = useRestaurantItemsStats(PROPERTY_ID)
  const { data: activeOrders, isLoading: activeOrdersLoading } = useActiveRestaurantOrders(PROPERTY_ID)
  const { data: outstandingBills, isLoading: outstandingBillsLoading } = useOutstandingRestaurantBills(PROPERTY_ID)
  const { data: analytics, isLoading: analyticsLoading } = useRestaurantAnalytics(
    PROPERTY_ID,
    selectedTimeRange === 'today' ? new Date().toISOString().split('T')[0] : undefined,
    selectedTimeRange === 'today' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
  )

  const isLoading = orderStatsLoading || billStatsLoading || itemStatsLoading

  return (
    <div className="bg-white p-6">
      <div className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        isCollapsed 
          ? "max-w-[calc(100vw-6rem)] xl:max-w-[1400px]"
          : "max-w-7xl"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard Restoran</h2>
            <p className="text-gray-600 mt-1">
              Monitor operasional restoran dan pesanan tamu
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard/restaurant/kitchen">
              <Button variant="outline">
                <ChefHat className="w-4 h-4 mr-2" />
                Kitchen Display
              </Button>
            </Link>
            <Link href="/dashboard/restaurant/menu">
              <Button className="bg-blue-400 hover:bg-warm-blue-600">
                <Package className="w-4 h-4 mr-2" />
                Kelola Menu
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pesanan Aktif</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {orderStats?.active_orders || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {orderStats?.today_orders || 0} hari ini
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatIDR(orderStats?.today_revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Rata-rata {formatIDR(orderStats?.average_order_value || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menu Items</p>
                  <p className="text-2xl font-bold">
                    {itemStats?.available || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {itemStats?.total || 0} total, {Math.round(itemStats?.availability_rate || 0)}% tersedia
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Bills</p>
                  <p className="text-2xl font-bold text-red-600">
                    {billStats?.outstanding_bills_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatIDR(billStats?.total_outstanding || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pesanan Aktif</TabsTrigger>
            <TabsTrigger value="bills">Outstanding Bills</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pesanan Aktif</span>
                  <Link href="/dashboard/restaurant/kitchen">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat Kitchen Display
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  Pesanan yang sedang diproses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrdersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Clock className="w-8 h-8 animate-pulse text-warm-brown-600" />
                  </div>
                ) : !activeOrders || activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada pesanan aktif</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">
                              #{order.order_number}
                            </Badge>
                            <span className="font-medium">
                              {order.guest?.first_name} {order.guest?.last_name}
                            </span>
                            {order.room && (
                              <span className="text-sm text-gray-500">
                                Kamar {order.room.room_number}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.items?.length || 0} item • {formatIDR(order.total_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {order.status === 'pending' ? 'Menunggu' :
                             order.status === 'confirmed' ? 'Dikonfirmasi' :
                             order.status === 'preparing' ? 'Disiapkan' : 'Siap'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activeOrders.length > 5 && (
                      <div className="text-center">
                        <Link href="/dashboard/restaurant/orders">
                          <Button variant="outline">
                            Lihat Semua Pesanan ({activeOrders.length})
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outstanding Bills Tab */}
          <TabsContent value="bills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Outstanding Bills</span>
                  <Link href="/dashboard/restaurant/bills">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat Semua Bills
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  Tagihan restoran yang belum dibayar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {outstandingBillsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Clock className="w-8 h-8 animate-pulse text-warm-brown-600" />
                  </div>
                ) : !outstandingBills || outstandingBills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada tagihan outstanding</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outstandingBills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {bill.guest?.first_name} {bill.guest?.last_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {bill.reservation?.confirmation_number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {bill.orders?.length || 0} pesanan
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatIDR(bill.outstanding_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            dari {formatIDR(bill.total_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className='border-0 shadow-lg'>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <BarChart3 className="w-8 h-8 animate-pulse text-warm-brown-600" />
                    </div>
                  ) : !analytics?.popular_items || analytics.popular_items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.popular_items.slice(0, 5).map((item, index) => (
                        <div key={item.item_id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{item.item_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity_sold} terjual</p>
                            <p className="text-xs text-gray-500">
                              {formatIDR(item.revenue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className='border-0 shadow-lg'>
                <CardHeader>
                  <CardTitle>Ringkasan Hari Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Pesanan</span>
                      <span className="font-medium">{analytics?.total_orders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">{formatIDR(analytics?.total_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value</span>
                      <span className="font-medium">{formatIDR(analytics?.average_order_value || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Bills</span>
                      <span className="font-medium text-red-600">
                        {analytics?.outstanding_bills?.count || 0} bill
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="quick-actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/restaurant/menu">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Package className="w-8 h-8 mx-auto mb-3 text-warm-brown-600" />
                    <h3 className="font-medium mb-2">Kelola Menu</h3>
                    <p className="text-sm text-gray-600">
                      Tambah, edit, atau nonaktifkan item menu
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/restaurant/kitchen">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <ChefHat className="w-8 h-8 mx-auto mb-3 text-orange-600" />
                    <h3 className="font-medium mb-2">Kitchen Display</h3>
                    <p className="text-sm text-gray-600">
                      Monitor dan kelola pesanan dapur
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/restaurant/orders">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-medium mb-2">Riwayat Pesanan</h3>
                    <p className="text-sm text-gray-600">
                      Lihat semua pesanan dan statusnya
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/restaurant/bills">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-3 text-green-600" />
                    <h3 className="font-medium mb-2">Billing</h3>
                    <p className="text-sm text-gray-600">
                      Kelola tagihan restoran tamu
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/restaurant/analytics">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                    <h3 className="font-medium mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Laporan dan analisis performa
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/restaurant/guest-ordering">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 mx-auto mb-3 text-teal-600" />
                    <h3 className="font-medium mb-2">Guest Ordering</h3>
                    <p className="text-sm text-gray-600">
                      Interface pemesanan untuk tamu
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}