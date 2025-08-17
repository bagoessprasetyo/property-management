'use client'

import { useState } from 'react'
import { useReservation, useUpdateReservationStatus, useCancelReservation } from '@/lib/hooks/use-reservations'
import { formatIDR } from '@/lib/utils/currency'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Edit,
  X,
  Clock,
  Users,
  Bed,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  IdCard,
  Loader2,
  Receipt,
  DollarSign,
  AlertCircle,
  CalendarDays,
  Settings as SettingsIcon
} from 'lucide-react'
import { ReservationForm } from './reservation-form'
import { logger } from '@/lib/utils/logger'

interface ReservationDetailProps {
  reservationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationDetail({ reservationId, open, onOpenChange }: ReservationDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const { data: reservation, isLoading: reservationLoading } = useReservation(reservationId)
  const updateStatus = useUpdateReservationStatus()
  const cancelReservation = useCancelReservation()

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleStatusChange = async (newStatus: any) => {
    if (!reservation) return

    try {
      await updateStatus.mutateAsync({
        id: reservation.id,
        status: newStatus
      })
      logger.info('Reservation status updated', { reservationId: reservation.id, newStatus })
    } catch (error) {
      logger.error('Failed to update reservation status', error)
    }
  }

  const handleCancel = async () => {
    if (!reservation) return

    setIsConfirming(true)
    try {
      await cancelReservation.mutateAsync(reservation.id)
      logger.info('Reservation cancelled', { reservationId: reservation.id })
      setIsConfirming(false)
    } catch (error) {
      logger.error('Failed to cancel reservation', error)
      setIsConfirming(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu Konfirmasi', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      },
      confirmed: { 
        label: 'Dikonfirmasi', 
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle 
      },
      checked_in: { 
        label: 'Sudah Check-in', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      checked_out: { 
        label: 'Sudah Check-out', 
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
        icon: AlertTriangle 
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

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      unpaid: { label: 'Belum Bayar', color: 'bg-red-100 text-red-800' },
      partial: { label: 'Bayar Sebagian', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Lunas', color: 'bg-green-100 text-green-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid
    
    return (
      <Badge className={config.color}>
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

  const canCheckIn = reservation?.status === 'confirmed'
  const canCheckOut = reservation?.status === 'checked_in'
  const canCancel = reservation?.status === 'pending' || reservation?.status === 'confirmed'
  const canEdit = reservation?.status !== 'cancelled' && reservation?.status !== 'no_show'

  if (reservationLoading || !reservation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat detail reservasi...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const nights = calculateNights(reservation.check_in_date, reservation.check_out_date)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-warm-brown-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Reservasi #{reservation.confirmation_number || reservation.id?.slice(0, 8)}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    {getStatusBadge(reservation.status)}
                    <span className="text-lg font-bold text-green-600">
                      {formatIDR(reservation.total_amount || 0)}
                    </span>
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canCheckIn && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('checked_in')}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check-in
                  </Button>
                )}
                {canCheckOut && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('checked_out')}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check-out
                  </Button>
                )}
                {canCancel && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={isConfirming}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Membatalkan...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Batalkan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detail</TabsTrigger>
              <TabsTrigger value="guest">Tamu</TabsTrigger>
              <TabsTrigger value="room">Kamar</TabsTrigger>
              <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reservation Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Informasi Reservasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Nomor Konfirmasi</p>
                        <p className="font-medium font-mono">
                          {reservation.confirmation_number || 'Belum ada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-medium">
                          {new Date(reservation.check_in_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} {reservation.check_in_time || '14:00'} WIB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-medium">
                          {new Date(reservation.check_out_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} {reservation.check_out_time || '12:00'} WIB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Durasi Menginap</p>
                        <p className="font-medium">{nights} malam</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Jumlah Tamu</p>
                        <p className="font-medium">
                          {reservation.adults} dewasa
                          {reservation.children > 0 && `, ${reservation.children} anak`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Informasi Keuangan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Total Pembayaran</p>
                        <p className="font-medium text-lg text-green-600">
                          {formatIDR(reservation.total_amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Status Pembayaran</p>
                        <div className="mt-1">
                          {getPaymentStatusBadge(reservation.payment_status || 'unpaid')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Dibuat</p>
                        <p className="font-medium">
                          {new Date(reservation.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>

                    {reservation.updated_at !== reservation.created_at && (
                      <div className="flex items-center gap-3">
                        <SettingsIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Terakhir Diperbarui</p>
                          <p className="font-medium">
                            {new Date(reservation.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Special Requests */}
              {reservation.special_requests && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Permintaan Khusus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{reservation.special_requests}</p>
                  </CardContent>
                </Card>
              )}

              {/* Internal Notes */}
              {reservation.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Catatan Internal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{reservation.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Guest Tab */}
            <TabsContent value="guest" className="space-y-4 max-h-96 overflow-y-auto">
              {reservation.guests ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informasi Tamu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">
                          {reservation.guests.first_name} {reservation.guests.last_name}
                        </h3>
                        {reservation.guests.vip_status && (
                          <Badge className="bg-gold-100 text-gold-800 mt-1">
                            VIP Guest
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reservation.guests.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{reservation.guests.email}</p>
                          </div>
                        </div>
                      )}

                      {reservation.guests.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Telepon</p>
                            <p className="font-medium">{reservation.guests.phone}</p>
                          </div>
                        </div>
                      )}

                      {reservation.guests.id_number && (
                        <div className="flex items-center gap-3">
                          <IdCard className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Nomor KTP</p>
                            <p className="font-medium font-mono">{reservation.guests.id_number}</p>
                          </div>
                        </div>
                      )}

                      {reservation.guests.birth_date && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Tanggal Lahir</p>
                            <p className="font-medium">
                              {new Date(reservation.guests.birth_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {reservation.guests.address && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Alamat</p>
                            <p className="font-medium">{reservation.guests.address}</p>
                            {reservation.guests.city && (
                              <p className="text-sm text-gray-500">
                                {reservation.guests.city}
                                {reservation.guests.state && `, ${reservation.guests.state}`}
                                {reservation.guests.postal_code && ` ${reservation.guests.postal_code}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Informasi tamu tidak tersedia</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Room Tab */}
            <TabsContent value="room" className="space-y-4 max-h-96 overflow-y-auto">
              {reservation.rooms ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="w-5 h-5" />
                      Informasi Kamar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Bed className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">
                          Kamar {reservation.rooms.room_number}
                        </h3>
                        <p className="text-gray-600">{reservation.rooms.room_type}</p>
                        <p className="text-sm text-green-600 font-medium">
                          {formatIDR(reservation.rooms.base_rate)} per malam
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Kapasitas</p>
                          <p className="font-medium">{reservation.rooms.capacity} tamu</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Lantai</p>
                          <p className="font-medium">Lantai {reservation.rooms.floor || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {reservation.rooms.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Deskripsi Kamar</p>
                          <p className="text-gray-700">{reservation.rooms.description}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Informasi kamar tidak tersedia</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 max-h-96 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Riwayat Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reservation.payments && reservation.payments.length > 0 ? (
                    <div className="space-y-3">
                      {reservation.payments.map((payment: any, index: number) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="font-medium">
                                {payment.payment_method === 'cash' ? 'Tunai' :
                                 payment.payment_method === 'credit_card' ? 'Kartu Kredit' :
                                 payment.payment_method === 'bank_transfer' ? 'Transfer Bank' :
                                 'Lainnya'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(payment.payment_date || payment.created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {formatIDR(payment.amount)}
                            </p>
                            <Badge className={
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {payment.status === 'completed' ? 'Selesai' :
                               payment.status === 'pending' ? 'Menunggu' :
                               'Gagal'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Belum ada pembayaran tercatat</p>
                      <Button variant="outline" className="mt-4">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Tambah Pembayaran
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <ReservationForm
        reservation={reservation}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={() => setShowEditForm(false)}
      />
    </>
  )
}