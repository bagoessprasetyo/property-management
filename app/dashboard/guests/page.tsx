'use client'

import { useState, useMemo } from 'react'
import { useGuests } from '@/lib/hooks/use-guests'
import { validateKTP, formatKTP, formatIndonesianPhone } from '@/lib/data/indonesian-hotel-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Eye,
  Phone,
  Mail,
  CreditCard,
  Loader2,
  UserCheck,
  Calendar,
  Filter,
  Download,
  Heart,
  Globe,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react'
import { GuestForm } from '@/components/guests/guest-form'
import { GuestDetail } from '@/components/guests/guest-detail'
import { GuestAnalytics } from '@/components/guests/guest-analytics'

export default function GuestsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [showGuestDetail, setShowGuestDetail] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'local' | 'foreign' | 'vip'>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
  
  const { data: allGuests, isLoading } = useGuests(searchQuery)

  // Enhanced filtering and statistics
  const filteredGuests = useMemo(() => {
    if (!allGuests) return []
    
    let filtered = allGuests.filter(guest => {
      // Period filter
      if (selectedPeriod !== 'all') {
        const createdAt = new Date(guest.created_at)
        const now = new Date()
        
        switch (selectedPeriod) {
          case 'today':
            if (createdAt.toDateString() !== now.toDateString()) return false
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            if (createdAt < weekAgo) return false
            break
          case 'month':
            if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) return false
            break
        }
      }
      
      // Type filter
      if (selectedFilter !== 'all') {
        const guestType = getGuestTypeLabel(guest)
        if (selectedFilter === 'local' && guestType !== 'Lokal') return false
        if (selectedFilter === 'foreign' && guestType !== 'Asing') return false
        if (selectedFilter === 'vip') {
          // VIP logic (could be enhanced with actual VIP calculation)
          const isVip = guest.special_requests?.includes('VIP') || guest.notes?.includes('VIP')
          if (!isVip) return false
        }
      }
      
      return true
    })
    
    return filtered
  }, [allGuests, selectedFilter, selectedPeriod])

  const guests = filteredGuests

  const getGuestTypeLabel = (guest: any) => {
    // Check if guest has KTP (Indonesian ID)
    if (guest.identification_type === 'KTP' && guest.identification_number) {
      return 'Lokal'
    } else if (guest.identification_type === 'Passport' || guest.identification_type === 'passport') {
      return 'Asing'
    }
    return 'Tidak diketahui'
  }

  const handleViewGuest = (guestId: string) => {
    setSelectedGuestId(guestId)
    setShowGuestDetail(true)
  }

  const handleEditGuest = (guestId: string) => {
    setSelectedGuestId(guestId)
    setShowCreateForm(true)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data tamu...</p>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warm-brown-50 via-warm-brown-100 to-amber-50 p-8 border border-warm-brown-200/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warm-brown-100/20 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-warm-brown-600 to-warm-brown-700 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Manajemen Tamu</h2>
                  <p className="text-warm-brown-700">
                    Kelola data tamu dan riwayat menginap dengan mudah
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-gradient-to-r from-warm-brown-600 to-warm-brown-700 hover:from-warm-brown-700 hover:to-warm-brown-800 shadow-lg"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tamu
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <GuestAnalytics guests={allGuests || []} />

        {/* Enhanced Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari nama, email, telepon, atau nomor identitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                </div>
                
                <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipe Tamu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tamu</SelectItem>
                    <SelectItem value="local">Tamu Lokal</SelectItem>
                    <SelectItem value="foreign">Tamu Asing</SelectItem>
                    <SelectItem value="vip">Tamu VIP</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">Minggu Ini</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
                  </SelectContent>
                </Select>
                
                {(selectedFilter !== 'all' || selectedPeriod !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedFilter('all')
                      setSelectedPeriod('all')
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
              
              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Menampilkan {guests?.length || 0} dari {allGuests?.length || 0} tamu
                </span>
                {(selectedFilter !== 'all' || selectedPeriod !== 'all') && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Filter aktif
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Guests Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Daftar Tamu</CardTitle>
                <CardDescription className="text-gray-600">
                  {guests?.length || 0} tamu terdaftar
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700 py-4">Nama & Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                    <TableHead className="font-semibold text-gray-700">Identitas</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tipe</TableHead>
                    <TableHead className="font-semibold text-gray-700">Lokasi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Bergabung</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="text-gray-500 space-y-3">
                          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-600">
                              {searchQuery || selectedFilter !== 'all' || selectedPeriod !== 'all' 
                                ? 'Tidak ada tamu yang sesuai filter' 
                                : 'Belum ada tamu terdaftar'
                              }
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {searchQuery || selectedFilter !== 'all' || selectedPeriod !== 'all'
                                ? 'Coba ubah kriteria pencarian atau filter'
                                : 'Mulai dengan menambahkan tamu baru'
                              }
                            </p>
                          </div>
                          {(!searchQuery && selectedFilter === 'all' && selectedPeriod === 'all') && (
                            <Button 
                              className="mt-4 bg-warm-brown-600 hover:bg-warm-brown-700"
                              onClick={() => setShowCreateForm(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Tambah Tamu Pertama
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    guests?.map((guest, index) => {
                      const isVip = guest.special_requests?.includes('VIP') || guest.notes?.includes('VIP')
                      return (
                        <TableRow 
                          key={guest.id} 
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-warm-brown-100 to-warm-brown-200 rounded-full flex items-center justify-center text-warm-brown-700 font-medium text-sm">
                                {guest.first_name.charAt(0)}{guest.last_name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {guest.first_name} {guest.last_name}
                                  </span>
                                  {isVip && (
                                    <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200">
                                      <Heart className="w-3 h-3 mr-1 fill-current" />
                                      VIP
                                    </Badge>
                                  )}
                                </div>
                                {(guest.dietary_restrictions || guest.special_requests) && (
                                  <div className="flex items-center text-xs text-amber-600 mt-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5" />
                                    Ada preferensi khusus
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              {guest.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                  <span className="truncate max-w-40">{guest.email}</span>
                                </div>
                              )}
                              {guest.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                  {formatIndonesianPhone(guest.phone)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {guest.identification_number ? (
                              <div className="space-y-1">
                                <div className="font-mono text-sm text-gray-900">
                                  {guest.identification_type === 'KTP' 
                                    ? formatKTP(guest.identification_number)
                                    : guest.identification_number
                                  }
                                </div>
                                <div className="flex items-center">
                                  <CreditCard className="w-3 h-3 mr-1 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {guest.identification_type || 'Tidak diketahui'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Belum ada</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                getGuestTypeLabel(guest) === 'Lokal' 
                                  ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300' 
                                  : getGuestTypeLabel(guest) === 'Asing'
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300'
                                  : 'bg-gray-100 text-gray-800 border-gray-300'
                              }
                            >
                              {getGuestTypeLabel(guest) === 'Lokal' && <UserCheck className="w-3 h-3 mr-1" />}
                              {getGuestTypeLabel(guest) === 'Asing' && <Globe className="w-3 h-3 mr-1" />}
                              {getGuestTypeLabel(guest)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {guest.city ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">{guest.city}</div>
                                {guest.state && (
                                  <div className="text-xs text-gray-500">{guest.state}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(guest.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(guest.created_at).toLocaleDateString('id-ID', {
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewGuest(guest.id)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditGuest(guest.id)}
                                className="h-8 w-8 p-0 hover:bg-warm-brown-50 hover:text-warm-brown-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Guest Form Dialog */}
        <GuestForm
          guest={selectedGuestId ? guests?.find(g => g.id === selectedGuestId) : undefined}
          open={showCreateForm}
          onOpenChange={(open: boolean) => {
            setShowCreateForm(open)
            if (!open) setSelectedGuestId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedGuestId(null)
          }}
        />

        {/* Guest Detail Dialog */}
        <GuestDetail
          guestId={selectedGuestId}
          open={showGuestDetail}
          onOpenChange={(open: boolean) => {
            setShowGuestDetail(open)
            if (!open) setSelectedGuestId(null)
          }}
        />
      </div>
    </div>
  )
}