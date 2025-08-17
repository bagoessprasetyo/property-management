'use client'

import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProperty } from '@/lib/context/property-context'
import { useRoomStats } from '@/lib/hooks/use-rooms'
import { useReservationStats } from '@/lib/hooks/use-reservations'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  LogIn,
  LogOut,
  Home,
  DollarSign,
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const { currentProperty } = useProperty()
  const { data: roomStats, isLoading: roomsLoading } = useRoomStats(currentProperty?.id)
  const { data: reservationStats, isLoading: reservationsLoading } = useReservationStats(currentProperty?.id)

  const isLoading = roomsLoading || reservationsLoading

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const occupancyRate = roomStats?.total ? 
    Math.round((roomStats.occupied / roomStats.total) * 100) : 0

  const recentActivities = [
    {
      id: 1,
      type: 'checkin',
      guest: 'Budi Santoso',
      room: '201',
      time: '14:30',
      status: 'completed'
    },
    {
      id: 2,
      type: 'checkout',
      guest: 'Sari Dewi',
      room: '305',
      time: '11:15',
      status: 'completed'
    },
    {
      id: 3,
      type: 'booking',
      guest: 'Ahmad Rahman',
      room: '102',
      time: '09:45',
      status: 'confirmed'
    }
  ]

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Ringkasan aktivitas hotel hari ini
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tingkat Hunian
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {occupancyRate}%
              </div>
              <p className="text-xs text-gray-600">
                {roomStats?.occupied || 0} dari {roomStats?.total || 0} kamar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tamu Datang Hari Ini
              </CardTitle>
              <LogIn className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reservationStats?.arrivalsToday || 0}
              </div>
              <p className="text-xs text-gray-600">
                Check-in mulai 14:00
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tamu Check-out
              </CardTitle>
              <LogOut className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reservationStats?.departuresToday || 0}
              </div>
              <p className="text-xs text-gray-600">
                Selesai hari ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendapatan Hari Ini
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatIDR(reservationStats?.revenueToday || 0)}
              </div>
              <p className="text-xs text-gray-600">
                Pendapatan hari ini
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-warm-brown-600" />
                <span>Aktivitas Terbaru</span>
              </CardTitle>
              <CardDescription>
                Aktivitas terkini di properti Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'checkin' ? 'bg-blue-500' :
                        activity.type === 'checkout' ? 'bg-orange-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.type === 'checkin' ? 'Check-in' :
                           activity.type === 'checkout' ? 'Check-out' :
                           'Booking Baru'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.guest} • Kamar {activity.room}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{activity.time}</p>
                      <p className={`text-xs ${
                        activity.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {activity.status === 'completed' ? 'Selesai' : 'Dikonfirmasi'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-warm-brown-600" />
                <span>Aksi Cepat</span>
              </CardTitle>
              <CardDescription>
                Tugas yang sering dilakukan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-warm-brown-600 hover:bg-warm-brown-700 text-white">
                <Users className="w-4 h-4 mr-2" />
                Booking Baru
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <LogIn className="w-4 h-4 mr-2" />
                Check-in Tamu
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="w-4 h-4 mr-2" />
                Check-out Tamu
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Lihat Kalender
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}