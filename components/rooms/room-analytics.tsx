'use client'

import { useMemo, memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bed, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronUp,
  ChevronDown,
  Minus,
  Sparkles
} from 'lucide-react'
import { calculateRoomAnalytics, calculateRoomUtilization } from '@/lib/utils/room-analytics'
import { formatIDR } from '@/lib/utils/currency'

interface RoomAnalyticsProps {
  rooms: any[]
  reservations?: any[]
}

export const RoomAnalytics = memo(function RoomAnalytics({ rooms, reservations }: RoomAnalyticsProps) {
  const analytics = useMemo(() => {
    return calculateRoomAnalytics(rooms, reservations)
  }, [rooms, reservations])

  const utilization = useMemo(() => {
    return calculateRoomUtilization(rooms)
  }, [rooms])

  const TrendIndicator = memo(({ value, isPercentage = false }: { value: number; isPercentage?: boolean }) => {
    const isPositive = value > 0
    const isNegative = value < 0
    const isNeutral = value === 0

    return (
      <div className={`flex items-center text-xs ${
        isPositive ? 'text-green-600' : 
        isNegative ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {isPositive && <ChevronUp className="w-3 h-3 mr-1" />}
        {isNegative && <ChevronDown className="w-3 h-3 mr-1" />}
        {isNeutral && <Minus className="w-3 h-3 mr-1" />}
        <span>{Math.abs(value).toFixed(1)}{isPercentage ? '%' : ''}</span>
      </div>
    )
  })

  const StatusIcon = memo(({ status }: { status: string }) => {
    const icons = {
      clean: CheckCircle,
      dirty: AlertTriangle, 
      inspected: CheckCircle,
      out_of_order: XCircle
    }
    const colors = {
      clean: 'text-green-500',
      dirty: 'text-yellow-500',
      inspected: 'text-blue-500', 
      out_of_order: 'text-red-500'
    }
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle
    const color = colors[status as keyof typeof colors] || 'text-gray-500'
    
    return <Icon className={`w-6 h-6 ${color}`} />
  })

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Rooms */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Total Kamar</p>
                <p className="text-3xl font-bold text-blue-900">
                  {analytics.totalRooms}
                </p>
                <div className="flex items-center text-xs text-blue-600">
                  <Building className="w-3 h-3 mr-1" />
                  <span>{analytics.activeRooms} aktif</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Bed className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clean Rooms */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Kamar Bersih</p>
                <p className="text-3xl font-bold text-green-900">
                  {analytics.cleanRooms}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Siap dihuni</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Tingkat Hunian</p>
                <p className="text-3xl font-bold text-purple-900">
                  {analytics.occupancyRate.toFixed(1)}%
                </p>
                <TrendIndicator value={5.2} isPercentage />
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Potential */}
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-700">Potensi Pendapatan</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatIDR(analytics.totalRevenuePotential)}
                </p>
                <div className="flex items-center text-xs text-amber-600">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span>Per malam</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Housekeeping Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-blue-600" />
              Status Housekeeping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="clean" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Bersih</p>
                  <p className="text-xs text-gray-500">Siap untuk tamu</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{analytics.cleanRooms}</p>
                <p className="text-xs text-gray-500">{((analytics.cleanRooms / analytics.totalRooms) * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="dirty" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Perlu Dibersihkan</p>
                  <p className="text-xs text-gray-500">Menunggu housekeeping</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-yellow-600">{analytics.dirtyRooms}</p>
                <p className="text-xs text-gray-500">{((analytics.dirtyRooms / analytics.totalRooms) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="out_of_order" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Perbaikan</p>
                  <p className="text-xs text-gray-500">Tidak tersedia</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-600">{analytics.outOfOrderRooms}</p>
                <p className="text-xs text-gray-500">{((analytics.outOfOrderRooms / analytics.totalRooms) * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Efisiensi Housekeeping</span>
                <span className="text-lg font-bold text-blue-900">{analytics.housekeepingEfficiency.toFixed(1)}%</span>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.housekeepingEfficiency}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Type Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-green-600" />
              Distribusi Tipe Kamar
            </CardTitle>
            <CardDescription>Persentase berdasarkan tipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.roomTypeDistribution.slice(0, 5).map((type, index) => (
              <div key={type.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{type.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({type.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      index === 1 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      index === 2 ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                      index === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${type.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Metrik Utama
            </CardTitle>
            <CardDescription>Statistik operasional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Tarif Rata-rata</p>
                  <p className="text-xs text-gray-500">Per kamar/malam</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{formatIDR(analytics.averageBaseRate)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Kapasitas Total</p>
                  <p className="text-xs text-gray-500">Maksimal tamu</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{utilization.totalCapacity}</p>
                <p className="text-xs text-gray-500">~{utilization.averageCapacity.toFixed(1)}/kamar</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Utilisasi</p>
                  <p className="text-xs text-gray-500">Efisiensi kamar</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">{analytics.utilizationRate.toFixed(1)}%</p>
              </div>
            </div>

            {utilization.totalArea > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Luas Total</p>
                    <p className="text-xs text-gray-500">Area kamar</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{utilization.totalArea.toLocaleString()} m²</p>
                  <p className="text-xs text-gray-500">~{utilization.averageArea.toFixed(1)} m²/kamar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Trend Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tren Status Kamar
          </CardTitle>
          <CardDescription>Status housekeeping 7 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Bersih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Kotor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Perbaikan</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {analytics.statusTrend.map((day, index) => {
                const maxValue = Math.max(day.clean, day.dirty, day.ooo, 1)
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="w-full bg-gray-100 rounded-sm h-32 flex flex-col justify-end relative group">
                      {/* Clean rooms */}
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-sm transition-all duration-300 hover:from-green-600 hover:to-green-500"
                        style={{ height: `${(day.clean / maxValue) * 70}%` }}
                      />
                      {/* Dirty rooms */}
                      <div 
                        className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-300 hover:from-yellow-600 hover:to-yellow-500"
                        style={{ height: `${(day.dirty / maxValue) * 70}%` }}
                      />
                      {/* Out of order */}
                      <div 
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 transition-all duration-300 hover:from-red-600 hover:to-red-500"
                        style={{ height: `${(day.ooo / maxValue) * 70}%` }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <div>Bersih: {day.clean}</div>
                        <div>Kotor: {day.dirty}</div>
                        <div>Perbaikan: {day.ooo}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{day.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Amenities */}
      {analytics.amenityPopularity.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Fasilitas Populer
            </CardTitle>
            <CardDescription>Fasilitas yang paling banyak tersedia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.amenityPopularity.slice(0, 8).map((amenity, index) => (
                <div key={amenity.amenity} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {amenity.amenity.replace('_', ' ')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {amenity.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {amenity.count} dari {analytics.totalRooms} kamar
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})