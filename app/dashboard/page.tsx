'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProperty } from '@/lib/context/property-context'
import { useDashboardStats, useRecentActivities, useUpcomingActivities } from '@/lib/hooks/use-dashboard'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Clock,
  LogIn,
  LogOut,
  Home,
  DollarSign,
  Loader2,
  Bed,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Bell,
  MapPin,
  Timer,
  User,
  Calendar as CalendarIcon,
  Settings,
  BarChart3,
  Plus
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { currentProperty } = useProperty()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showBookingForm, setShowBookingForm] = useState(false)
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(currentProperty?.id)
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(currentProperty?.id, 8)
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingActivities(currentProperty?.id)

  const isLoading = statsLoading || activitiesLoading || upcomingLoading

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setLastRefresh(new Date())
    await refetchStats()
  }

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin': return LogIn
      case 'checkout': return LogOut
      case 'booking': return Calendar
      case 'cancellation': return AlertCircle
      case 'housekeeping': return Sparkles
      default: return Bell
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'checkin': return 'bg-blue-100 text-blue-600'
      case 'checkout': return 'bg-orange-100 text-orange-600'
      case 'booking': return 'bg-green-100 text-green-600'
      case 'cancellation': return 'bg-red-100 text-red-600'
      case 'housekeeping': return 'bg-purple-100 text-purple-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Navigation handlers
  const handleNewBooking = () => {
    setShowBookingForm(true)
  }

  const handleCheckIn = () => {
    router.push('/dashboard/reservations?tab=checkin')
  }

  const handleCheckOut = () => {
    router.push('/dashboard/reservations?tab=checkout')
  }

  const handleViewCalendar = () => {
    router.push('/dashboard/reservations')
  }

  const handleHousekeeping = () => {
    router.push('/dashboard/housekeeping')
  }

  const handleReports = () => {
    router.push('/dashboard/reports')
  }

  const handleViewGuests = () => {
    router.push('/dashboard/guests')
  }

  const handleViewRooms = () => {
    router.push('/dashboard/rooms')
  }

  const handleViewPayments = () => {
    router.push('/dashboard/payments')
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with real-time info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">
                {currentProperty?.name || 'Semua Properti'} • {currentTime.toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-warm-brown-600 hover:bg-warm-brown-700"
              onClick={handleNewBooking}
            >
              <Plus className="w-4 h-4 mr-2" />
              Booking Baru
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Occupancy Rate */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleViewRooms}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tingkat Hunian
              </CardTitle>
              <div className={`p-2 rounded-full ${
                (stats?.occupancyTrend || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Bed className={`h-4 w-4 ${
                  (stats?.occupancyTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.occupancyRate || 0}%
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {stats?.occupiedRooms || 0} dari {stats?.totalRooms || 0} kamar
                </p>
                <div className="flex items-center gap-1">
                  {(stats?.occupancyTrend || 0) >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${
                    (stats?.occupancyTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stats?.occupancyTrend || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arrivals Today */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleCheckIn}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Check-in Hari Ini
              </CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <LogIn className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.arrivalsToday || 0}
              </div>
              <p className="text-xs text-gray-600">
                Booking baru: {stats?.newBookingsToday || 0}
              </p>
            </CardContent>
          </Card>

          {/* Departures Today */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleCheckOut}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Check-out Hari Ini
              </CardTitle>
              <div className="p-2 rounded-full bg-orange-100">
                <LogOut className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.departuresToday || 0}
              </div>
              <p className="text-xs text-gray-600">
                Kamar tersedia: {stats?.availableRooms || 0}
              </p>
            </CardContent>
          </Card>

          {/* Revenue Today */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleViewPayments}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendapatan Hari Ini
              </CardTitle>
              <div className={`p-2 rounded-full ${
                (stats?.revenueTrend || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  (stats?.revenueTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatIDR(stats?.revenueToday || 0)}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  ADR: {formatIDR(stats?.avgDailyRate || 0)}
                </p>
                <div className="flex items-center gap-1">
                  {(stats?.revenueTrend || 0) >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${
                    (stats?.revenueTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stats?.revenueTrend || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleHousekeeping}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Housekeeping</p>
                  <p className="text-lg font-semibold">
                    {stats?.tasksCompleted || 0}/{((stats?.tasksCompleted || 0) + (stats?.tasksPending || 0))}
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleViewRooms}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kamar Siap</p>
                  <p className="text-lg font-semibold">{stats?.roomsReady || 0}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleReports}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Bulan Ini</p>
                  <p className="text-lg font-semibold">{formatIDR(stats?.revenueThisMonth || 0)}</p>
                </div>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities">Aktivitas Terbaru</TabsTrigger>
            <TabsTrigger value="upcoming">Agenda Hari Ini</TabsTrigger>
            <TabsTrigger value="actions">Aksi Cepat</TabsTrigger>
          </TabsList>

          {/* Recent Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-warm-brown-600" />
                    Aktivitas Terbaru
                  </div>
                  <Badge variant="outline">
                    Diperbarui {formatTime(lastRefresh.toISOString())}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Aktivitas terkini di properti Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <span className="text-sm text-gray-500">
                                {formatTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                            {activity.roomNumber && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">Kamar {activity.roomNumber}</span>
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={activity.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {activity.status === 'completed' ? 'Selesai' : 
                             activity.status === 'pending' ? 'Menunggu' : 'Dikonfirmasi'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Belum ada aktivitas hari ini</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Activities Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pending Arrivals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-blue-600" />
                    Check-in Tertunda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming?.pendingArrivals && upcoming.pendingArrivals.length > 0 ? (
                    <div className="space-y-2">
                      {upcoming.pendingArrivals.map((arrival: any) => (
                        <div 
                          key={arrival.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={handleCheckIn}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {arrival.guests?.first_name} {arrival.guests?.last_name}
                            </span>
                            <Badge variant="outline">Kamar {arrival.rooms?.room_number}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Tidak ada check-in tertunda</p>
                  )}
                </CardContent>
              </Card>

              {/* Pending Departures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-orange-600" />
                    Check-out Tertunda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming?.pendingDepartures && upcoming.pendingDepartures.length > 0 ? (
                    <div className="space-y-2">
                      {upcoming.pendingDepartures.map((departure: any) => (
                        <div 
                          key={departure.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={handleCheckOut}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {departure.guests?.first_name} {departure.guests?.last_name}
                            </span>
                            <Badge variant="outline">Kamar {departure.rooms?.room_number}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Tidak ada check-out tertunda</p>
                  )}
                </CardContent>
              </Card>

              {/* Pending Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Tugas Tertunda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming?.pendingTasks && upcoming.pendingTasks.length > 0 ? (
                    <div className="space-y-2">
                      {upcoming.pendingTasks.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={handleHousekeeping}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{task.task_type}</span>
                            <Badge variant="outline">Kamar {task.rooms?.room_number}</Badge>
                          </div>
                          {task.scheduled_time && (
                            <div className="flex items-center gap-1 mt-1">
                              <Timer className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{task.scheduled_time}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Tidak ada tugas tertunda</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleNewBooking}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-warm-brown-100">
                      <Users className="w-6 h-6 text-warm-brown-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Booking Baru</h3>
                      <p className="text-sm text-gray-600">Buat reservasi baru</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleCheckIn}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <LogIn className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Check-in Tamu</h3>
                      <p className="text-sm text-gray-600">Proses kedatangan tamu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleCheckOut}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-orange-100">
                      <LogOut className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Check-out Tamu</h3>
                      <p className="text-sm text-gray-600">Proses keberangkatan tamu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleViewCalendar}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <CalendarIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Lihat Kalender</h3>
                      <p className="text-sm text-gray-600">Jadwal reservasi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleHousekeeping}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-purple-100">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Housekeeping</h3>
                      <p className="text-sm text-gray-600">Kelola tugas kebersihan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleReports}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-gray-100">
                      <BarChart3 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Laporan</h3>
                      <p className="text-sm text-gray-600">Analisis & statistik</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Quick Actions */}
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleViewGuests}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-indigo-100">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Data Tamu</h3>
                      <p className="text-sm text-gray-600">Kelola informasi tamu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleViewRooms}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-teal-100">
                      <Bed className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Manajemen Kamar</h3>
                      <p className="text-sm text-gray-600">Status & konfigurasi kamar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleViewPayments}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-emerald-100">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Pembayaran</h3>
                      <p className="text-sm text-gray-600">Transaksi & tagihan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Form Modal */}
        <ReservationForm
          open={showBookingForm}
          onOpenChange={setShowBookingForm}
          onSuccess={() => {
            setShowBookingForm(false)
            // Refresh dashboard data
            refetchStats()
          }}
        />
      </div>
    </div>
  )
}