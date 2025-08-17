'use client'

import { useState } from 'react'
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

export function GuestDetail({ guestId, open, onOpenChange }: GuestDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: guest, isLoading: guestLoading } = useGuest(guestId)
  const { data: reservations, isLoading: reservationsLoading } = useGuestReservations(guestId)
  const deleteGuest = useDeleteGuest()

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleDelete = async () => {
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
  }

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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-warm-brown-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {guest.first_name} {guest.last_name}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    {guestType && (
                      <Badge className={guestType.color}>
                        {guestType.type}
                      </Badge>
                    )}
                    {isVip && (
                      <Badge className="bg-gold-100 text-gold-800">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        VIP
                      </Badge>
                    )}
                    <span className="text-sm">
                      Member sejak {new Date(guest.created_at).toLocaleDateString('id-ID', {
                        month: 'long', year: 'numeric'
                      })}
                    </span>
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="reservations">Riwayat Menginap</TabsTrigger>
              <TabsTrigger value="preferences">Preferensi</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Identitas</p>
                        <p className="font-medium">
                          {guest.identification_type}: {
                            guest.identification_type === 'KTP' 
                              ? formatKTP(guest.identification_number)
                              : guest.identification_number
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Kewarganegaraan</p>
                        <p className="font-medium">{guest.nationality}</p>
                      </div>
                    </div>

                    {guest.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Tanggal Lahir</p>
                          <p className="font-medium">
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
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Jenis Kelamin</p>
                          <p className="font-medium">
                            {guest.gender === 'male' ? 'Laki-laki' : 
                             guest.gender === 'female' ? 'Perempuan' : 'Lainnya'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Kontak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {guest.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{guest.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Telepon</p>
                        <p className="font-medium">{formatIndonesianPhone(guest.phone)}</p>
                      </div>
                    </div>

                    {guest.emergency_contact_name && (
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-sm text-gray-600">Kontak Darurat</p>
                          <p className="font-medium">{guest.emergency_contact_name}</p>
                          {guest.emergency_contact_phone && (
                            <p className="text-sm text-gray-500">
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
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalStays}</div>
                    <div className="text-sm text-gray-600">Total Menginap</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatIDR(totalSpent)}
                    </div>
                    <div className="text-sm text-gray-600">Total Pengeluaran</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {isVip ? 'VIP' : 'Regular'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
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
}