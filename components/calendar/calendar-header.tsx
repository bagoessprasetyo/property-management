'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickActions } from './quick-actions'
import { RealtimeNotifications } from './real-time-notifications'
import { ConnectionStatus } from './connection-status'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus,
  Grid3X3,
  Clock,
  CalendarDays,
  Activity
} from 'lucide-react'
import { CalendarViewType } from './calendar-view'

interface CalendarHeaderProps {
  currentDate: Date
  viewType: CalendarViewType
  onDateNavigate: (direction: 'prev' | 'next' | 'today') => void
  onViewTypeChange: (viewType: CalendarViewType) => void
  onCreateReservation: () => void
  onRefresh?: () => void
  stats?: {
    totalReservations: number
    checkInsToday: number
    checkOutsToday: number
    pendingReservations: number
  }
  reservations?: any[]
  dateRange?: { start: string; end: string }
}

export function CalendarHeader({
  currentDate,
  viewType,
  onDateNavigate,
  onViewTypeChange,
  onCreateReservation,
  onRefresh,
  stats,
  reservations,
  dateRange
}: CalendarHeaderProps) {
  
  const formatDateTitle = () => {
    switch (viewType) {
      case 'day':
        return currentDate.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'week':
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        
        return `${startOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      case 'month':
        return currentDate.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long'
        })
      case 'timeline':
        const endOfTimeline = new Date(currentDate)
        endOfTimeline.setDate(currentDate.getDate() + 30)
        return `${currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endOfTimeline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      default:
        return currentDate.toLocaleDateString('id-ID')
    }
  }

  const getViewIcon = (view: CalendarViewType) => {
    switch (view) {
      case 'day':
        return <Clock className="w-4 h-4" />
      case 'week':
        return <Grid3X3 className="w-4 h-4" />
      case 'month':
        return <CalendarDays className="w-4 h-4" />
      case 'timeline':
        return <Activity className="w-4 h-4" />
    }
  }

  const getViewLabel = (view: CalendarViewType) => {
    switch (view) {
      case 'day':
        return 'Hari'
      case 'week':
        return 'Minggu'
      case 'month':
        return 'Bulan'
      case 'timeline':
        return 'Timeline'
    }
  }

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 rounded-t-xl p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6">
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:gap-6 lg:items-center lg:justify-between">
        {/* Left: Title and Navigation */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-1 bg-white rounded-lg border shadow-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateNavigate('prev')}
              className="hover:bg-gray-100 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateNavigate('today')}
              className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium px-2 sm:px-4 text-xs sm:text-sm"
            >
              Hari Ini
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateNavigate('next')}
              className="hover:bg-gray-100 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                {formatDateTitle()}
              </h1>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium"
                >
                  {getViewLabel(viewType)}
                </Badge>
                <ConnectionStatus showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: View Controls and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Statistics Cards */}
          {/* {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-white rounded-lg border shadow-sm p-3 min-w-[100px]">
                <div className="text-xs text-gray-500 font-medium">Total</div>
                <div className="text-lg font-bold text-gray-900">{stats.totalReservations}</div>
              </div>
              <div className="bg-white rounded-lg border shadow-sm p-3 min-w-[100px]">
                <div className="text-xs text-green-600 font-medium">Check-in</div>
                <div className="text-lg font-bold text-green-700">{stats.checkInsToday}</div>
              </div>
              <div className="bg-white rounded-lg border shadow-sm p-3 min-w-[100px]">
                <div className="text-xs text-blue-600 font-medium">Check-out</div>
                <div className="text-lg font-bold text-blue-700">{stats.checkOutsToday}</div>
              </div>
              <div className="bg-white rounded-lg border shadow-sm p-3 min-w-[100px]">
                <div className="text-xs text-yellow-600 font-medium">Pending</div>
                <div className="text-lg font-bold text-yellow-700">{stats.pendingReservations}</div>
              </div>
            </div>
          )} */}

          {/* View Type Selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1 w-full sm:w-auto">
            {(['day', 'week', 'month', 'timeline'] as CalendarViewType[]).map((view) => (
              <Button
                key={view}
                variant={viewType === view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewTypeChange(view)}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 h-auto transition-all duration-200 ${
                  viewType === view 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {getViewIcon(view)}
                <span className="ml-1 sm:ml-1.5 text-xs sm:text-sm font-medium">
                  <span className="sm:hidden">
                    {view === 'day' ? 'H' : view === 'week' ? 'M' : view === 'month' ? 'B' : 'T'}
                  </span>
                  <span className="hidden sm:inline">
                    {getViewLabel(view)}
                  </span>
                </span>
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Real-time Notifications */}
            <RealtimeNotifications />

            {/* Quick Actions */}
            <QuickActions
              currentDate={currentDate}
              onCreateReservation={onCreateReservation}
              onRefresh={onRefresh}
              stats={stats}
              reservations={reservations}
              viewType={viewType}
              dateRange={dateRange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}