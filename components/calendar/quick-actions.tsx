'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  MoreVertical,
  Plus,
  Calendar,
  FileDown,
  Printer,
  RefreshCw,
  Filter,
  Search,
  Settings,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Share2,
  Mail,
  Link
} from 'lucide-react'

interface QuickActionsProps {
  currentDate: Date
  onCreateReservation: () => void
  onRefresh?: () => void
  stats?: {
    totalReservations: number
    checkInsToday: number
    checkOutsToday: number
    pendingReservations: number
  }
  reservations?: any[]
  viewType?: string
  dateRange?: { start: string; end: string }
}

export function QuickActions({
  currentDate,
  onCreateReservation,
  onRefresh,
  stats,
  reservations = [],
  viewType = 'week',
  dateRange
}: QuickActionsProps) {
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'ical' | 'pdf') => {
    const { exportFormats } = await import('@/lib/utils/calendar-export')
    
    const exportData = reservations.map(reservation => ({
      id: reservation.id,
      guest_name: reservation.guest_name || 'N/A',
      room_number: reservation.room_number || 'N/A',
      check_in_date: reservation.check_in_date,
      check_out_date: reservation.check_out_date,
      status: reservation.status,
      total_amount: reservation.total_amount || 0,
      confirmation_number: reservation.confirmation_number || '',
      adults: reservation.adults || 1,
      children: reservation.children || 0,
      special_requests: reservation.special_requests
    }))

    exportFormats[format].export(exportData)
    setShowExportMenu(false)
  }, [reservations])

  const handleShare = useCallback(async () => {
    if (!dateRange) return
    
    const { generateCalendarShareLink } = await import('@/lib/utils/calendar-export')
    const shareUrl = generateCalendarShareLink({
      startDate: dateRange.start,
      endDate: dateRange.end,
      viewType
    })

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InnSync Calendar',
          text: 'Lihat kalender reservasi InnSync',
          url: shareUrl
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl)
        alert('Link telah disalin ke clipboard')
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link telah disalin ke clipboard')
    }
  }, [dateRange, viewType])

  const handlePrint = () => {
    window.print()
  }

  const handleSync = () => {
    // TODO: Implement sync functionality
    onRefresh?.()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Quick Stats */}
        {stats && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsDialog(true)}
            className="hidden md:flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">
              {stats.totalReservations} reservasi
            </span>
            {stats.pendingReservations > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {stats.pendingReservations} pending
              </Badge>
            )}
          </Button>
        )}

        {/* Primary Action */}
        <Button 
          onClick={onCreateReservation}
          className="bg-blue-50 text-blue-700 border-blue-200"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Buat Reservasi</span>
          <span className="sm:hidden">Buat</span>
        </Button>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Aksi Cepat</DropdownMenuLabel>
            
            {/* View Actions */}
            <DropdownMenuItem onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Filter className="mr-2 h-4 w-4" />
              Filter Lanjutan
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Search className="mr-2 h-4 w-4" />
              Cari Reservasi
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Export Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuItem className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="left" className="w-40">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  📊 CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  📈 Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('ical')}>
                  📅 Calendar (iCal)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  📄 PDF Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Bagikan Kalender
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Kalender
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Management Actions */}
            <DropdownMenuItem onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sinkronisasi
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowStatsDialog(true)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Lihat Statistik
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan Kalender
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Statistik Kalender</DialogTitle>
            <DialogDescription>
              Ringkasan aktivitas untuk {currentDate.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>
          
          {stats && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.totalReservations}
                  </div>
                  <div className="text-xs text-blue-600">Total Reservasi</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {stats.checkInsToday}
                  </div>
                  <div className="text-xs text-green-600">Check-in Hari Ini</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {stats.checkOutsToday}
                  </div>
                  <div className="text-xs text-purple-600">Check-out Hari Ini</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {stats.pendingReservations}
                  </div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}