'use client'

import { useState } from 'react'
import { useRoom, useDeleteRoom } from '@/lib/hooks/use-rooms'
import { formatIDR } from '@/lib/utils/currency'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bed, 
  Edit,
  Trash2,
  AlertTriangle,
  Users,
  DollarSign,
  Building,
  Ruler,
  CheckCircle,
  X,
  Loader2,
  Wifi,
  Coffee,
  Car,
  Bath,
  Wind,
  Tv,
  Phone,
  Refrigerator,
  BedDouble,
  Cigarette,
  CigaretteOff,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react'
import { RoomForm } from './room-form'
import { logger } from '@/lib/utils/logger'

// Room amenities mapping
const AMENITY_ICONS = {
  wifi: { icon: Wifi, label: 'WiFi Gratis' },
  ac: { icon: Wind, label: 'AC' },
  tv: { icon: Tv, label: 'TV LED' },
  minibar: { icon: Refrigerator, label: 'Minibar' },
  coffee: { icon: Coffee, label: 'Coffee/Tea Maker' },
  bathroom: { icon: Bath, label: 'Kamar Mandi Dalam' },
  phone: { icon: Phone, label: 'Telepon' },
  parking: { icon: Car, label: 'Parkir' },
}

interface RoomDetailProps {
  roomId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomDetail({ roomId, open, onOpenChange }: RoomDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: room, isLoading: roomLoading } = useRoom(roomId)
  const deleteRoom = useDeleteRoom()

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleDelete = async () => {
    if (!roomId) return
    
    try {
      logger.info('Deleting room', { roomId })
      await deleteRoom.mutateAsync(roomId)
      logger.info('Room deleted successfully', { roomId })
      setShowDeleteConfirm(false)
      onOpenChange(false)
    } catch (error) {
      logger.error('Failed to delete room', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      clean: { label: 'Bersih', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      dirty: { label: 'Kotor', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      inspected: { label: 'Diperiksa', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      out_of_order: { label: 'Perbaikan', color: 'bg-red-100 text-red-800', icon: X },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.clean
    
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getBedTypeLabel = (bedType: string) => {
    const bedTypes = {
      single: 'Single Bed',
      twin: 'Twin Beds',
      double: 'Double Bed',
      queen: 'Queen Bed',
      king: 'King Bed',
      sofa_bed: 'Sofa Bed'
    }
    return bedTypes[bedType as keyof typeof bedTypes] || bedType
  }

  if (roomLoading || !room) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat detail kamar...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                  <Bed className="w-6 h-6 text-warm-brown-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Kamar {room.room_number}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Badge variant="outline">{room.room_type}</Badge>
                    {getStatusBadge(room.status)}
                    {!room.is_active && (
                      <Badge variant="destructive">Tidak Aktif</Badge>
                    )}
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

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="amenities">Fasilitas</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Kapasitas</p>
                        <p className="font-medium">{room.capacity} tamu</p>
                      </div>
                    </div>

                    {room.size_sqm && (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Luas Kamar</p>
                          <p className="font-medium">{room.size_sqm} m²</p>
                        </div>
                      </div>
                    )}

                    {room.floor && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Lantai</p>
                          <p className="font-medium">Lantai {room.floor}</p>
                        </div>
                      </div>
                    )}

                    {room.bed_type && (
                      <div className="flex items-center gap-3">
                        <BedDouble className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Tipe Kasur</p>
                          <p className="font-medium">{getBedTypeLabel(room.bed_type)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Tarif
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Tarif Dasar</p>
                        <p className="font-medium text-lg text-green-600">
                          {formatIDR(room.base_rate)}/malam
                        </p>
                      </div>
                    </div>

                    {room.cleaning_fee && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Biaya Kebersihan</p>
                          <p className="font-medium">{formatIDR(room.cleaning_fee)}</p>
                        </div>
                      </div>
                    )}

                    {room.max_extra_beds && room.max_extra_beds > 0 && (
                      <div className="flex items-center gap-3">
                        <BedDouble className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Tempat Tidur Tambahan</p>
                          <p className="font-medium">Maksimal {room.max_extra_beds}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {room.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Deskripsi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{room.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {room.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </div>
                    <div className="text-sm text-gray-600">Status Kamar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {room.is_smoking_allowed ? 'Ya' : 'Tidak'}
                    </div>
                    <div className="text-sm text-gray-600">Kamar Merokok</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Amenities Tab */}
            <TabsContent value="amenities" className="space-y-4 max-h-96 overflow-y-auto">
              {room.amenities && room.amenities.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {room.amenities.map((amenityId: string) => {
                    const amenity = AMENITY_ICONS[amenityId as keyof typeof AMENITY_ICONS]
                    if (!amenity) return null
                    
                    const Icon = amenity.icon
                    
                    return (
                      <Card key={amenityId} className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900">
                              {amenity.label}
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <SettingsIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Belum ada fasilitas yang dikonfigurasi</p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Layanan Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {room.is_smoking_allowed ? (
                        <Cigarette className="w-4 h-4 text-orange-500" />
                      ) : (
                        <CigaretteOff className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm">Merokok</span>
                    </div>
                    <Badge className={room.is_smoking_allowed ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                      {room.is_smoking_allowed ? 'Diizinkan' : 'Tidak Diizinkan'}
                    </Badge>
                  </div>

                  {room.max_extra_beds && room.max_extra_beds > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BedDouble className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Tempat Tidur Tambahan</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Maksimal {room.max_extra_beds}
                      </Badge>
                    </div>
                  )}

                  {room.cleaning_fee && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Layanan Kebersihan</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {formatIDR(room.cleaning_fee)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5" />
                      Konfigurasi Kamar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status Kamar</span>
                      <Badge className={room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {room.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status Housekeeping</span>
                      {getStatusBadge(room.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Dibuat</span>
                      <span className="text-sm text-gray-600">
                        {new Date(room.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Terakhir Diupdate</span>
                      <span className="text-sm text-gray-600">
                        {new Date(room.updated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {room.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Catatan Internal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{room.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {!room.notes && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Belum ada catatan internal</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <RoomForm
        room={room}
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
              Hapus Kamar
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kamar <strong>{room.room_number}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Tindakan ini tidak dapat dibatalkan. Pastikan tidak ada reservasi aktif untuk kamar ini.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteRoom.isPending}
            >
              {deleteRoom.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Kamar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}