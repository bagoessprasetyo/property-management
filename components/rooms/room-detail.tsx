'use client'

import { useState, memo, useCallback } from 'react'
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
  Settings as SettingsIcon,
  Calendar,
  TrendingUp,
  MapPin,
  Shield,
  Activity,
  Target,
  BarChart3,
  Sparkles,
  Settings,
  Clock
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

export const RoomDetail = memo(function RoomDetail({ roomId, open, onOpenChange }: RoomDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: room, isLoading: roomLoading } = useRoom(roomId)
  const deleteRoom = useDeleteRoom()

  const handleEdit = useCallback(() => {
    setShowEditForm(true)
  }, [])

  const handleDelete = useCallback(async () => {
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
  }, [roomId, deleteRoom, onOpenChange])

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
        <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-warm-brown-50 via-warm-brown-100 to-amber-50 p-6 -m-6 mb-6 border-b border-warm-brown-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warm-brown-100/20 via-transparent to-transparent" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-warm-brown-600 to-warm-brown-700 rounded-xl shadow-lg">
                  <Bed className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                    Kamar {room.room_number}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge className="bg-warm-brown-100 text-warm-brown-800 border-warm-brown-200">
                      {room.room_type}
                    </Badge>
                    {getStatusBadge(room.status)}
                    {!room.is_active && (
                      <Badge variant="destructive">Tidak Aktif</Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm text-warm-brown-700">
                      <Users className="w-4 h-4" />
                      <span>{room.capacity} tamu</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-warm-brown-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="hidden sm:inline">{formatIDR(room.base_rate)}/malam</span>
                      <span className="sm:hidden">{formatIDR(room.base_rate)}</span>
                    </div>
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEdit}
                  className="border-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-50 w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Edit Kamar</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-gray-50 text-xs sm:text-sm">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  'bg-blue-500 text-white'
                }`}>
                  <Activity className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium">Overview</div>
                  <div className="text-xs text-gray-500">Info dasar</div>
                </div>
                <span className="sm:hidden font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="amenities" 
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  'bg-purple-500 text-white'
                }`}>
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium">Fasilitas</div>
                  <div className="text-xs text-gray-500">Amenitas & layanan</div>
                </div>
                <span className="sm:hidden font-medium">Fasilitas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  'bg-gray-500 text-white'
                }`}>
                  <SettingsIcon className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium">Pengaturan</div>
                  <div className="text-xs text-gray-500">Konfigurasi</div>
                </div>
                <span className="sm:hidden font-medium">Pengaturan</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 max-h-[500px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Informasi Detail Kamar</h3>
                  <p className="text-sm text-gray-600">Data lengkap dan statistik kamar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Kapasitas Kamar</p>
                        <p className="text-lg font-bold text-blue-600">{room.capacity} tamu</p>
                      </div>
                    </div>

                    {room.size_sqm && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Ruler className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Luas Kamar</p>
                          <p className="text-lg font-bold text-green-600">{room.size_sqm} m²</p>
                        </div>
                      </div>
                    )}

                    {room.floor && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Lokasi Lantai</p>
                          <p className="text-lg font-bold text-purple-600">Lantai {room.floor}</p>
                        </div>
                      </div>
                    )}

                    {room.bed_type && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BedDouble className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Tipe Kasur</p>
                          <p className="text-lg font-bold text-orange-600">{getBedTypeLabel(room.bed_type)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-100/30 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      Informasi Tarif
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-green-200">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Tarif Dasar</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatIDR(room.base_rate)}
                        </p>
                        <p className="text-xs text-green-600">per malam</p>
                      </div>
                    </div>

                    {room.cleaning_fee && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Biaya Kebersihan</p>
                          <p className="text-lg font-bold text-blue-600">{formatIDR(room.cleaning_fee)}</p>
                        </div>
                      </div>
                    )}

                    {room.max_extra_beds && room.max_extra_beds > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BedDouble className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Tempat Tidur Tambahan</p>
                          <p className="text-lg font-bold text-purple-600">Maksimal {room.max_extra_beds}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {room.description && (
                <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100/30 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-gray-500 rounded-lg">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Deskripsi Kamar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-white/60 rounded-lg border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{room.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Room Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-full ${
                        room.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      room.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {room.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Status Operasional</div>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-full ${
                        room.is_smoking_allowed ? 'bg-orange-500' : 'bg-green-500'
                      }`}>
                        {room.is_smoking_allowed ? (
                          <Cigarette className="w-6 h-6 text-white" />
                        ) : (
                          <CigaretteOff className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      room.is_smoking_allowed ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {room.is_smoking_allowed ? 'Diizinkan' : 'Tidak Diizinkan'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Kebijakan Merokok</div>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-100/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-amber-500 rounded-full">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {new Date(room.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Tanggal Dibuat</div>
                  </CardContent>
                </Card>
              </div>

              {/* Room Analytics Section */}
              <Card className="border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/30 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    Analisa Kamar
                  </CardTitle>
                  <CardDescription>Performa dan potensi pendapatan kamar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {/* Revenue Potential */}
                    <div className="p-4 bg-white/60 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Potensi Pendapatan</p>
                          <p className="text-xs text-gray-500">Per bulan (30 hari)</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {formatIDR(room.base_rate * 30)}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Asumsi tingkat hunian 100%</span>
                      </div>
                    </div>

                    {/* Rate per m² */}
                    {room.size_sqm && (
                      <div className="p-4 bg-white/60 rounded-lg border border-indigo-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Ruler className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Tarif per m²</p>
                            <p className="text-xs text-gray-500">Efisiensi ruang</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {formatIDR(Math.round(room.base_rate / room.size_sqm))}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                          <Target className="w-3 h-3" />
                          <span>Per m² per malam</span>
                        </div>
                      </div>
                    )}

                    {/* Capacity Efficiency */}
                    <div className="p-4 bg-white/60 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tarif per Tamu</p>
                          <p className="text-xs text-gray-500">Efisiensi kapasitas</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-purple-600">
                        {formatIDR(Math.round(room.base_rate / room.capacity))}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
                        <Activity className="w-3 h-3" />
                        <span>Per tamu per malam</span>
                      </div>
                    </div>

                    {/* Competitive Analysis */}
                    <div className="p-4 bg-white/60 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Posisi Harga</p>
                          <p className="text-xs text-gray-500">Dalam kategori</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-amber-600">
                        {room.base_rate > 1000000 ? 'Premium' : 
                         room.base_rate > 500000 ? 'Standard' : 'Budget'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Kategori pasar</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Value Score */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-500 rounded-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Skor Fasilitas</p>
                            <p className="text-xs text-gray-500">Kelengkapan amenitas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">
                            {Math.round((room.amenities.length / 8) * 100)}%
                          </p>
                          <p className="text-xs text-indigo-600">Kelengkapan</p>
                        </div>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((room.amenities.length / 8) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {room.amenities.length} dari 8 fasilitas dasar tersedia
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Amenities Tab */}
            <TabsContent value="amenities" className="space-y-6 max-h-[500px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fasilitas & Layanan</h3>
                  <p className="text-sm text-gray-600">Amenitas yang tersedia di kamar ini</p>
                </div>
                {room.amenities && room.amenities.length > 0 && (
                  <Badge className="ml-auto bg-purple-100 text-purple-800">
                    {room.amenities.length} fasilitas
                  </Badge>
                )}
              </div>

              {room.amenities && room.amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {room.amenities.map((amenityId: string) => {
                    const amenity = AMENITY_ICONS[amenityId as keyof typeof AMENITY_ICONS]
                    if (!amenity) return null
                    
                    const Icon = amenity.icon
                    
                    return (
                      <Card key={amenityId} className="border-0 bg-gradient-to-br from-green-50 to-emerald-100/30 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-green-900">
                                {amenity.label}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Tersedia</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100/30 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gray-200 rounded-full inline-block mb-4">
                      <SettingsIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-2">Belum Ada Fasilitas</p>
                    <p className="text-gray-400 text-sm">Belum ada fasilitas yang dikonfigurasi untuk kamar ini</p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Services */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    Layanan Tambahan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        room.is_smoking_allowed ? 'bg-orange-100' : 'bg-green-100'
                      }`}>
                        {room.is_smoking_allowed ? (
                          <Cigarette className="w-4 h-4 text-orange-600" />
                        ) : (
                          <CigaretteOff className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Kebijakan Merokok</p>
                        <p className="text-xs text-gray-500">Aturan merokok di kamar</p>
                      </div>
                    </div>
                    <Badge className={room.is_smoking_allowed ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}>
                      {room.is_smoking_allowed ? 'Diizinkan' : 'Tidak Diizinkan'}
                    </Badge>
                  </div>

                  {room.max_extra_beds && room.max_extra_beds > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BedDouble className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tempat Tidur Tambahan</p>
                          <p className="text-xs text-gray-500">Extra bed tersedia</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Maksimal {room.max_extra_beds}
                      </Badge>
                    </div>
                  )}

                  {room.cleaning_fee && (
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Biaya Kebersihan</p>
                          <p className="text-xs text-gray-500">Layanan tambahan</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        {formatIDR(room.cleaning_fee)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 max-h-[500px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <SettingsIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pengaturan & Konfigurasi</h3>
                  <p className="text-sm text-gray-600">Status operasional dan catatan internal</p>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100/30 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-gray-500 rounded-lg">
                        <SettingsIcon className="w-4 h-4 text-white" />
                      </div>
                      Status & Konfigurasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          room.is_active ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Shield className={`w-4 h-4 ${
                            room.is_active ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Status Operasional</p>
                          <p className="text-xs text-gray-500">Ketersediaan kamar</p>
                        </div>
                      </div>
                      <Badge className={room.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                        {room.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Status Housekeeping</p>
                          <p className="text-xs text-gray-500">Kondisi kebersihan</p>
                        </div>
                      </div>
                      {getStatusBadge(room.status)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tanggal Dibuat</p>
                          <p className="text-xs text-gray-500">Kamar ditambahkan</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(room.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Terakhir Diupdate</p>
                          <p className="text-xs text-gray-500">Pembaruan data</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
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
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        Catatan Internal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-white/60 rounded-lg border border-blue-200">
                        <p className="text-gray-700 leading-relaxed">{room.notes}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!room.notes && (
                  <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100/30 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <div className="p-4 bg-gray-200 rounded-full inline-block mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium mb-2">Belum Ada Catatan</p>
                      <p className="text-gray-400 text-sm">Belum ada catatan internal untuk kamar ini</p>
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
})