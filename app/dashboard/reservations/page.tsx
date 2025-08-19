'use client'

import { useState } from 'react'
// Removed property context for single property setup
import { useReservations } from '@/lib/hooks/use-reservations'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarView } from '@/components/calendar/calendar-view'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { ReservationDetail } from '@/components/reservations/reservation-detail'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Calendar,
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Clock,
  Users,
  MapPin,
  CreditCard,
  Loader2,
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid3X3,
  List
} from 'lucide-react'

export default function ReservationsPage() {
  // Removed currentProperty for single property setup
  const { data: reservations, isLoading } = useReservations()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [showReservationDetail, setShowReservationDetail] = useState(false)

  // Filter reservations based on search and filters
  const filteredReservations = reservations?.filter(reservation => {
    const matchesSearch = 
      reservation.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.confirmation_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const today = new Date()
      const checkIn = new Date(reservation.check_in_date)
      const checkOut = new Date(reservation.check_out_date)
      
      switch (dateFilter) {
        case 'today':
          matchesDate = checkIn.toDateString() === today.toDateString() || 
                       checkOut.toDateString() === today.toDateString()
          break
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          matchesDate = checkIn <= weekFromNow && checkOut >= today
          break
        case 'month':
          matchesDate = checkIn.getMonth() === today.getMonth() && 
                       checkIn.getFullYear() === today.getFullYear()
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  }) || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      },
      confirmed: { 
        label: 'Dikonfirmasi', 
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle 
      },
      checked_in: { 
        label: 'Check-in', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      checked_out: { 
        label: 'Check-out', 
        color: 'bg-gray-100 text-gray-800',
        icon: CheckCircle 
      },
      cancelled: { 
        label: 'Dibatalkan', 
        color: 'bg-red-100 text-red-800',
        icon: XCircle 
      },
      no_show: { 
        label: 'Tidak Datang', 
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle 
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleViewReservation = (reservationId: string) => {
    setSelectedReservationId(reservationId)
    setShowReservationDetail(true)
  }

  const handleEditReservation = (reservationId: string) => {
    setSelectedReservationId(reservationId)
    setShowCreateForm(true)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data reservasi...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Manajemen Reservasi</h2>
            <p className="text-gray-600 mt-1">
              Kelola reservasi tamu dan jadwal kamar
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3"
              >
                <List className="w-4 h-4 mr-1" />
                Tabel
              </Button>
            </div>
            <Button 
              className="bg-warm-brown-600 hover:bg-warm-brown-700"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Reservasi
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reservasi</p>
                  <p className="text-2xl font-bold">{reservations?.length || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-in Hari Ini</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reservations?.filter(r => {
                      const today = new Date().toISOString().split('T')[0]
                      return r.check_in_date === today
                    }).length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-out Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reservations?.filter(r => {
                      const today = new Date().toISOString().split('T')[0]
                      return r.check_out_date === today
                    }).length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendapatan Bulan Ini</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatIDR(
                      reservations?.filter(r => {
                        const date = new Date(r.created_at || r.check_in_date)
                        const now = new Date()
                        return date.getMonth() === now.getMonth() && 
                               date.getFullYear() === now.getFullYear() &&
                               r.status !== 'cancelled'
                      }).reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
                    )}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nama tamu, nomor kamar, atau kode reservasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="checked_out">Check-out</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  <SelectItem value="no_show">Tidak Datang</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {viewMode === 'grid' ? (
          <CalendarView 
            defaultView="week"
            onReservationSelect={handleViewReservation}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Reservasi</CardTitle>
              <CardDescription>
                {filteredReservations.length} dari {reservations?.length || 0} reservasi ditampilkan
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tamu</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Malam</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada reservasi ditemukan</p>
                          {searchQuery && (
                            <p className="text-sm mt-1">
                              Coba gunakan kata kunci yang berbeda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {reservation.guest_name || 'Nama tidak tersedia'}
                            </div>
                            <div className="text-sm text-gray-500">
                              <Users className="w-3 h-3 inline mr-1" />
                              {reservation.guest_count || 1} tamu
                            </div>
                            {reservation.confirmation_number && (
                              <div className="text-xs text-gray-400 font-mono">
                                #{reservation.confirmation_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {reservation.room_number || 'Belum ditentukan'}
                          </div>
                          {reservation.room_type && (
                            <div className="text-sm text-gray-500">
                              {reservation.room_type}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(reservation.check_in_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-500">
                              14:00 WIB
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(reservation.check_out_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-500">
                              12:00 WIB
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-1 text-gray-400" />
                            {calculateNights(reservation.check_in_date, reservation.check_out_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatIDR(reservation.total_amount || 0)}
                          </div>
                          {reservation.payment_status && (
                            <div className="text-xs text-gray-500">
                              {reservation.payment_status === 'paid' ? 'Lunas' : 
                               reservation.payment_status === 'partial' ? 'Sebagian' : 'Belum bayar'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReservation(reservation.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditReservation(reservation.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Reservation Form Dialog */}
        <ReservationForm
          reservation={selectedReservationId ? reservations?.find(r => r.id === selectedReservationId) : undefined}
          open={showCreateForm}
          onOpenChange={(open) => {
            setShowCreateForm(open)
            if (!open) setSelectedReservationId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedReservationId(null)
          }}
        />

        {/* Reservation Detail Dialog */}
        <ReservationDetail
          reservationId={selectedReservationId}
          open={showReservationDetail}
          onOpenChange={(open) => {
            setShowReservationDetail(open)
            if (!open) setSelectedReservationId(null)
          }}
        />
      </div>
    </div>
  )
}