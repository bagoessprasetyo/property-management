'use client'

import { useMemo, memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Clock,
  Timer,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
  Zap,
  Building
} from 'lucide-react'
import { calculateHousekeepingAnalytics, calculateStaffPerformance } from '@/lib/utils/housekeeping-analytics'

interface HousekeepingAnalyticsProps {
  tasks: any[]
}

export const HousekeepingAnalytics = memo(function HousekeepingAnalytics({ tasks }: HousekeepingAnalyticsProps) {
  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        inspectedTasks: 0,
        failedInspectionTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        qualityScore: 0,
        staffProductivity: [],
        taskTypeDistribution: [],
        priorityDistribution: [],
        roomEfficiency: [],
        dailyTrends: [],
        kpis: { efficiency: 0, quality: 0, timeliness: 0, utilization: 0 }
      }
    }
    return calculateHousekeepingAnalytics(tasks)
  }, [tasks])

  const staffPerformance = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalStaff: 0,
        activeStaff: 0,
        averageTasksPerStaff: 0,
        topPerformer: null,
        staffWorkload: []
      }
    }
    return calculateStaffPerformance(tasks)
  }, [tasks])

  const TrendIndicator = useCallback(({ value, isPercentage = false }: { value: number; isPercentage?: boolean }) => {
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
  }, [])

  const StatusIcon = useCallback(({ status }: { status: string }) => {
    const icons = {
      pending: Clock,
      in_progress: Timer,
      completed: CheckCircle,
      inspected: CheckCircle,
      failed_inspection: XCircle
    }
    const colors = {
      pending: 'text-yellow-500',
      in_progress: 'text-blue-500',
      completed: 'text-green-500',
      inspected: 'text-purple-500',
      failed_inspection: 'text-red-500'
    }
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle
    const color = colors[status as keyof typeof colors] || 'text-gray-500'
    
    return <Icon className={`w-6 h-6 ${color}`} />
  }, [])

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Tugas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.totalTasks}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Hari ini</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Tingkat Penyelesaian</p>
                <p className="text-2xl font-semibold text-green-600">
                  {analytics.completionRate.toFixed(1)}%
                </p>
                <TrendIndicator value={5.3} isPercentage />
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Skor Kualitas</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {analytics.qualityScore.toFixed(1)}%
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Award className="w-3 h-3 mr-1" />
                  <span>Lulus inspeksi</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Time */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Waktu Rata-rata</p>
                <p className="text-2xl font-semibold text-amber-600">
                  {analytics.averageCompletionTime}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Timer className="w-3 h-3 mr-1" />
                  <span>menit/tugas</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Timer className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Task Status Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Activity className="w-4 h-4 text-gray-600" />
              Status Tugas
            </CardTitle>
            <CardDescription className="text-sm">Distribusi status saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="pending" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Menunggu</p>
                  <p className="text-xs text-gray-500">Belum dikerjakan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-yellow-600">{analytics.pendingTasks}</p>
                <p className="text-xs text-gray-500">{((analytics.pendingTasks / analytics.totalTasks) * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="in_progress" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Dikerjakan</p>
                  <p className="text-xs text-gray-500">Sedang berlangsung</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">{analytics.inProgressTasks}</p>
                <p className="text-xs text-gray-500">{((analytics.inProgressTasks / analytics.totalTasks) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status="completed" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Selesai</p>
                  <p className="text-xs text-gray-500">Siap inspeksi</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{analytics.completedTasks}</p>
                <p className="text-xs text-gray-500">{((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {analytics.failedInspectionTasks > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusIcon status="failed_inspection" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Perlu Diperbaiki</p>
                    <p className="text-xs text-gray-500">Gagal inspeksi</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{analytics.failedInspectionTasks}</p>
                  <p className="text-xs text-gray-500">{((analytics.failedInspectionTasks / analytics.totalTasks) * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Type Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <PieChart className="w-4 h-4 text-gray-600" />
              Jenis Tugas
            </CardTitle>
            <CardDescription className="text-sm">Distribusi berdasarkan tipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.taskTypeDistribution.slice(0, 5).map((type, index) => (
              <div key={type.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {type.type === 'cleaning' ? 'Pembersihan' :
                       type.type === 'maintenance' ? 'Perbaikan' :
                       type.type === 'inspection' ? 'Inspeksi' :
                       type.type}
                    </span>
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
                {type.averageTime > 0 && (
                  <p className="text-xs text-gray-500">
                    Rata-rata: {type.averageTime} menit
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Users className="w-4 h-4 text-gray-600" />
              Performa Staff
            </CardTitle>
            <CardDescription className="text-sm">Produktivitas dan kinerja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">{staffPerformance.totalStaff}</p>
                <p className="text-xs text-gray-600">Total Staff</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">{staffPerformance.activeStaff}</p>
                <p className="text-xs text-gray-600">Aktif Hari Ini</p>
              </div>
            </div>

            {staffPerformance.topPerformer && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Top Performer</span>
                </div>
                <p className="font-semibold text-gray-900">{staffPerformance.topPerformer.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">{staffPerformance.topPerformer.tasksCompleted} tugas selesai</span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {staffPerformance.topPerformer.score}% efisiensi
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Rata-rata Beban Kerja</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Per staff hari ini</span>
                <span className="text-lg font-bold text-gray-900">{staffPerformance.averageTasksPerStaff} tugas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Activity className="w-4 h-4 text-gray-600" />
            Tren Performa Mingguan
          </CardTitle>
          <CardDescription className="text-sm">Efisiensi penyelesaian tugas 7 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Selesai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Menunggu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Efisiensi</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {analytics.dailyTrends.map((day, index) => {
                const maxValue = Math.max(day.completed, day.pending, 10)
                const maxEfficiency = Math.max(...analytics.dailyTrends.map(d => d.efficiency), 100)
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="w-full bg-gray-100 rounded-sm h-32 flex flex-col justify-end relative group">
                      {/* Completed tasks */}
                      <div 
                        className="w-full bg-green-500 rounded-sm transition-all duration-300 hover:bg-green-600"
                        style={{ height: `${(day.completed / maxValue) * 70}%` }}
                      />
                      {/* Pending tasks */}
                      <div 
                        className="w-full bg-amber-400 transition-all duration-300 hover:bg-amber-500"
                        style={{ height: `${(day.pending / maxValue) * 70}%` }}
                      />
                      
                      {/* Efficiency line indicator */}
                      <div 
                        className="absolute w-full border-t-2 border-blue-500"
                        style={{ 
                          bottom: `${(day.efficiency / maxEfficiency) * 70}%`,
                          opacity: 0.8
                        }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        <div>Selesai: {day.completed}</div>
                        <div>Menunggu: {day.pending}</div>
                        <div>Efisiensi: {day.efficiency}%</div>
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

      {/* KPI Dashboard */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4 text-gray-600" />
            Key Performance Indicators
          </CardTitle>
          <CardDescription className="text-sm">Metrik utama performa housekeeping</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 mx-auto" />
              </div>
              <div>
                <p className="text-xl font-semibold text-blue-600">{analytics.kpis.efficiency}%</p>
                <p className="text-sm text-gray-600">Efisiensi</p>
                <Progress value={analytics.kpis.efficiency} className="h-2 mt-2" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600 mx-auto" />
              </div>
              <div>
                <p className="text-xl font-semibold text-green-600">{analytics.kpis.quality}%</p>
                <p className="text-sm text-gray-600">Kualitas</p>
                <Progress value={analytics.kpis.quality} className="h-2 mt-2" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 mx-auto" />
              </div>
              <div>
                <p className="text-xl font-semibold text-purple-600">{analytics.kpis.timeliness}%</p>
                <p className="text-sm text-gray-600">Ketepatan Waktu</p>
                <Progress value={analytics.kpis.timeliness} className="h-2 mt-2" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600 mx-auto" />
              </div>
              <div>
                <p className="text-xl font-semibold text-orange-600">{analytics.kpis.utilization}%</p>
                <p className="text-sm text-gray-600">Utilisasi</p>
                <Progress value={analytics.kpis.utilization} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})