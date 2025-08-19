'use client'

import { useMemo, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  Globe, 
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Activity,
  Target,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react'
import { calculateGuestAnalytics, formatGrowthRate, getGrowthColor, getGrowthIcon } from '@/lib/utils/guest-analytics'

interface GuestAnalyticsProps {
  guests: any[]
}

export const GuestAnalytics = memo(function GuestAnalytics({ guests }: GuestAnalyticsProps) {
  const analytics = useMemo(() => {
    return calculateGuestAnalytics(guests)
  }, [guests])

  const GrowthIndicator = ({ rate }: { rate: number }) => {
    const icon = getGrowthIcon(rate)
    const color = getGrowthColor(rate)
    
    return (
      <div className={`flex items-center text-xs ${color}`}>
        {icon === 'up' && <ChevronUp className="w-3 h-3 mr-1" />}
        {icon === 'down' && <ChevronDown className="w-3 h-3 mr-1" />}
        {icon === 'same' && <Minus className="w-3 h-3 mr-1" />}
        <span>{formatGrowthRate(rate)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Guests */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Total Tamu</p>
                <p className="text-3xl font-bold text-blue-900">
                  {analytics.totalGuests}
                </p>
                <GrowthIndicator rate={analytics.guestGrowthRate} />
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local Guests */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Tamu Lokal</p>
                <p className="text-3xl font-bold text-green-900">
                  {analytics.localGuests}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <UserCheck className="w-3 h-3 mr-1" />
                  <span>{((analytics.localGuests / analytics.totalGuests) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Foreign Guests */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Tamu Asing</p>
                <p className="text-3xl font-bold text-purple-900">
                  {analytics.foreignGuests}
                </p>
                <div className="flex items-center text-xs text-purple-600">
                  <Globe className="w-3 h-3 mr-1" />
                  <span>{((analytics.foreignGuests / analytics.totalGuests) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VIP Guests */}
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-700">Tamu VIP</p>
                <p className="text-3xl font-bold text-amber-900">
                  {analytics.vipGuests}
                </p>
                <div className="flex items-center text-xs text-amber-600">
                  <Heart className="w-3 h-3 mr-1 fill-current" />
                  <span>{((analytics.vipGuests / analytics.totalGuests) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white fill-current" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-blue-600" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Minggu Ini</p>
                <p className="text-xl font-bold text-blue-600">{analytics.newGuestsThisWeek}</p>
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Bulan Ini</p>
                <p className="text-xl font-bold text-green-600">{analytics.newGuestsThisMonth}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Rata-rata/Bulan</p>
                <p className="text-xl font-bold text-purple-600">{Math.round(analytics.averageGuestsPerMonth)}</p>
              </div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-green-600" />
              Kota Teratas
            </CardTitle>
            <CardDescription>Asal tamu terbanyak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topCities.length > 0 ? (
              analytics.topCities.map((city, index) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-700">{city.city}</span>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {city.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        {/* Guest Type Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-purple-600" />
              Distribusi Tipe
            </CardTitle>
            <CardDescription>Persentase tipe tamu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.guestTypeDistribution.map((type) => (
              <div key={type.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{type.type}</span>
                  <span className="text-sm text-gray-600">{type.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      type.type === 'Lokal' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      type.type === 'Asing' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                      'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${type.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Registration Trend Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tren Pendaftaran
          </CardTitle>
          <CardDescription>Pendaftaran tamu 12 bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {analytics.registrationTrend.map((month, index) => {
                const maxCount = Math.max(...analytics.registrationTrend.map(m => m.count))
                const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="w-full bg-gray-100 rounded-sm h-20 flex items-end relative group">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {month.count} tamu
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{month.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})