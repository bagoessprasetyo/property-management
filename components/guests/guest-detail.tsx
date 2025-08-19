'use client'

import { useState, memo, useCallback } from 'react'
import { useGuest, useGuestReservations, useDeleteGuest } from '@/lib/hooks/use-guests'
import { formatIndonesianPhone, formatKTP } from '@/lib/data/indonesian-hotel-data'
import { formatIDR } from '@/lib/utils/currency'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  Globe,
  Edit,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  FileText,
  Heart,
  UserCheck,
  Loader2
} from 'lucide-react'
import { GuestForm } from './guest-form'
import { logger } from '@/lib/utils/logger'

interface GuestDetailProps {
  guestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const GuestDetail = memo(function GuestDetail({ guestId, open, onOpenChange }: GuestDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: guest, isLoading: guestLoading } = useGuest(guestId)
  const { data: reservations, isLoading: reservationsLoading } = useGuestReservations(guestId)
  const deleteGuest = useDeleteGuest()

  const handleEdit = useCallback(() => {
    setShowEditForm(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!guestId) return
    
    try {
      logger.info('Deleting guest', { guestId })
      await deleteGuest.mutateAsync(guestId)
      logger.info('Guest deleted successfully', { guestId })
      setShowDeleteConfirm(false)
      onOpenChange(false)
    } catch (error) {
      logger.error('Failed to delete guest', error)
    }
  }, [guestId, deleteGuest, onOpenChange])

  const getGuestTypeInfo = () => {
    if (!guest) return null
    
    const isIndonesian = guest.identification_type === 'KTP' || guest.nationality === 'Indonesia'
    return {
      type: isIndonesian ? 'Lokal' : 'Asing',
      color: isIndonesian ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    }
  }

  const getReservationStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      checked_in: { label: 'Check In', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      checked_out: { label: 'Check Out', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      no_show: { label: 'No Show', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
    
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const totalStays = reservations?.length || 0
  const totalSpent = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
  const isVip = totalStays >= 5 || totalSpent >= 10000000 // 10 million IDR

  if (guestLoading || !guest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat detail tamu...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const guestType = getGuestTypeInfo()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-warm-brown-50 via-warm-brown-100 to-amber-50 p-6 -m-6 mb-6 border-b border-warm-brown-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warm-brown-100/20 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-warm-brown-200 to-warm-brown-300 rounded-xl flex items-center justify-center text-warm-brown-700 font-bold text-xl shadow-lg">
                    {guest.first_name.charAt(0)}{guest.last_name.charAt(0)}
                  </div>
                  {isVip && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {guest.first_name} {guest.last_name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-3">
                    {guestType && (
                      <Badge className={`${guestType.color} shadow-sm`}>
                        {guestType.type === 'Lokal' ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <Globe className="w-3 h-3 mr-1" />
                        )}
                        {guestType.type}
                      </Badge>
                    )}
                    {isVip && (
                      <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 shadow-sm">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        VIP Guest
                      </Badge>
                    )}
                    <div className="flex items-center text-sm text-warm-brown-700 bg-warm-brown-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3 h-3 mr-1" />
                      Member sejak {new Date(guest.created_at).toLocaleDateString('id-ID', {
                        month: 'long', year: 'numeric'
                      })}
                    </div>
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEdit}
                  className="border-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tamu
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-gray-50">
              <TabsTrigger 
                value="profile" 
                className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <User className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Profil Lengkap</div>
                  <div className="text-xs text-gray-500">Data personal</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="reservations" 
                className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <Building className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Riwayat Menginap</div>
                  <div className="text-xs text-gray-500">{totalStays} reservasi</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <Heart className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Preferensi</div>
                  <div className="text-xs text-gray-500">Kebutuhan khusus</div>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/30">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200/50 border-b border-blue-200">
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700">Identitas</p>
                        <p className="font-semibold text-gray-900">
                          {guest.identification_type}: {
                            guest.identification_type === 'KTP' 
                              ? formatKTP(guest.identification_number)
                              : guest.identification_number
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Globe className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">Kewarganegaraan</p>
                        <p className="font-semibold text-gray-900">{guest.nationality}</p>
                      </div>
                    </div>

                    {guest.date_of_birth && (
                      <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-700">Tanggal Lahir</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(guest.date_of_birth).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {guest.gender && (
                      <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-700">Jenis Kelamin</p>
                          <p className="font-semibold text-gray-900">
                            {guest.gender === 'male' ? 'Laki-laki' : 
                             guest.gender === 'female' ? 'Perempuan' : 'Lainnya'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/30">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-200/50 border-b border-green-200">
                    <CardTitle className="flex items-center gap-3 text-green-900">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      Informasi Kontak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {guest.email && (
                      <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700">Email</p>
                          <p className="font-semibold text-gray-900 break-all">{guest.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">Telepon</p>
                        <p className="font-semibold text-gray-900">{formatIndonesianPhone(guest.phone)}</p>
                      </div>
                    </div>

                    {guest.emergency_contact_name && (
                      <div className="flex items-start gap-4 p-3 bg-white/60 rounded-lg">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-700">Kontak Darurat</p>
                          <p className="font-semibold text-gray-900">{guest.emergency_contact_name}</p>
                          {guest.emergency_contact_phone && (
                            <p className="text-sm text-gray-600 mt-1">
                              {formatIndonesianPhone(guest.emergency_contact_phone)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Address */}
              {(guest.address || guest.city || guest.state) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Alamat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {guest.address && <p>{guest.address}</p>}
                      <p className="text-gray-600">
                        {[guest.city, guest.state, guest.country].filter(Boolean).join(', ')}
                        {guest.postal_code && ` ${guest.postal_code}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guest Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-2">{totalStays}</div>
                    <div className="text-sm font-medium text-blue-700">Total Menginap</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {totalStays > 0 ? 'Tamu berulang' : 'Tamu baru'}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-900 mb-2">
                      {formatIDR(totalSpent)}
                    </div>
                    <div className="text-sm font-medium text-green-700">Total Pengeluaran</div>
                    <div className="text-xs text-green-600 mt-1">
                      Nilai kontribusi
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isVip 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-100/50' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100/50'
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-xl ${
                        isVip ? 'bg-amber-500' : 'bg-gray-500'
                      }`}>
                        {isVip ? (
                          <Heart className="w-6 h-6 text-white fill-current" />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${
                      isVip ? 'text-amber-900' : 'text-gray-900'
                    }`}>
                      {isVip ? 'VIP' : 'Regular'}
                    </div>
                    <div className={`text-sm font-medium ${
                      isVip ? 'text-amber-700' : 'text-gray-700'
                    }`}>
                      Status Keanggotaan
                    </div>
                    <div className={`text-xs mt-1 ${
                      isVip ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {isVip ? 'Mendapat prioritas khusus' : 'Anggota standar'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations" className="space-y-4 max-h-96 overflow-y-auto">
              {reservationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Memuat riwayat reservasi...</span>
                </div>
              ) : reservations && reservations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kamar</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(reservation.check_in_date).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-sm text-gray-500">
                              s/d {new Date(reservation.check_out_date).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {reservation.rooms?.room_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.rooms?.room_type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {Math.ceil(
                            (new Date(reservation.check_out_date).getTime() - 
                             new Date(reservation.check_in_date).getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )} malam
                        </TableCell>
                        <TableCell>
                          {getReservationStatusBadge(reservation.status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatIDR(reservation.total_amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Belum ada riwayat reservasi</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid gap-4">
                {guest.dietary_restrictions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Pantangan Makanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{guest.dietary_restrictions}</p>
                    </CardContent>
                  </Card>
                )}

                {guest.special_requests && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Permintaan Khusus
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{guest.special_requests}</p>
                    </CardContent>
                  </Card>
                )}

                {guest.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Catatan Internal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{guest.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {!guest.dietary_restrictions && !guest.special_requests && !guest.notes && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Belum ada preferensi yang tercatat</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <GuestForm
        guest={guest}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={() => setShowEditForm(false)}
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Tamu
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tamu <strong>{guest.first_name} {guest.last_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Tindakan ini tidak dapat dibatalkan. Semua data tamu akan dihapus secara permanen.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteGuest.isPending}
            >
              {deleteGuest.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Tamu
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})