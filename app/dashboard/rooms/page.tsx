'use client'

import { useState } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { useRooms } from '@/lib/hooks/use-rooms'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Bed, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Settings,
  Users,
  DollarSign,
  Loader2
} from 'lucide-react'
import { RoomForm } from '@/components/rooms/room-form'
import { RoomDetail } from '@/components/rooms/room-detail'

export default function RoomsPage() {
  const { currentProperty } = useProperty()
  const { data: rooms, isLoading } = useRooms(currentProperty?.id)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [showRoomDetail, setShowRoomDetail] = useState(false)

  // Filter rooms based on search and filters
  const filteredRooms = rooms?.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.room_type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter
    const matchesType = typeFilter === 'all' || room.room_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  }) || []

  // Get unique room types for filter
  const roomTypes = Array.from(new Set(rooms?.map(room => room.room_type) || []))

  const handleViewRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setShowRoomDetail(true)
  }

  const handleEditRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setShowCreateForm(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      clean: { label: 'Bersih', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      dirty: { label: 'Kotor', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      inspected: { label: 'Diperiksa', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      out_of_order: { label: 'Perbaikan', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.clean
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data kamar...</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Manajemen Kamar</h2>
            <p className="text-gray-600 mt-1">
              Kelola kamar dan status housekeeping
            </p>
          </div>
          <Button 
            className="bg-warm-brown-600 hover:bg-warm-brown-700"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kamar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Kamar</p>
                  <p className="text-2xl font-bold">{rooms?.length || 0}</p>
                </div>
                <Bed className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kamar Bersih</p>
                  <p className="text-2xl font-bold text-green-600">
                    {rooms?.filter(r => r.status === 'clean').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Perlu Dibersihkan</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {rooms?.filter(r => r.status === 'dirty').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Perbaikan</p>
                  <p className="text-2xl font-bold text-red-600">
                    {rooms?.filter(r => r.status === 'out_of_order').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                </div>
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
                    placeholder="Cari nomor kamar atau tipe..."
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
                  <SelectItem value="clean">Bersih</SelectItem>
                  <SelectItem value="dirty">Kotor</SelectItem>
                  <SelectItem value="inspected">Diperiksa</SelectItem>
                  <SelectItem value="out_of_order">Perbaikan</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tipe Kamar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {roomTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kamar</CardTitle>
            <CardDescription>
              {filteredRooms.length} dari {rooms?.length || 0} kamar ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Kamar</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead>Tarif Dasar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lantai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Bed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada kamar ditemukan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell>{room.room_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {room.capacity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                            {formatIDR(room.base_rate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                        <TableCell>Lantai {room.floor || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewRoom(room.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRoom(room.id)}
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

        {/* Room Form Dialog */}
        <RoomForm
          room={selectedRoomId ? rooms?.find(r => r.id === selectedRoomId) : undefined}
          open={showCreateForm}
          onOpenChange={(open) => {
            setShowCreateForm(open)
            if (!open) setSelectedRoomId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedRoomId(null)
          }}
        />

        {/* Room Detail Dialog */}
        <RoomDetail
          roomId={selectedRoomId}
          open={showRoomDetail}
          onOpenChange={(open) => {
            setShowRoomDetail(open)
            if (!open) setSelectedRoomId(null)
          }}
        />
      </div>
    </div>
  )
}