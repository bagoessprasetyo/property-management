'use client'

import { useState } from 'react'
import { useGuests } from '@/lib/hooks/use-guests'
import { validateKTP, formatKTP, formatIndonesianPhone } from '@/lib/data/indonesian-hotel-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Calendar
} from 'lucide-react'

export default function GuestsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: guests, isLoading } = useGuests(searchQuery)

  const getGuestTypeLabel = (guest: any) => {
    // Check if guest has KTP (Indonesian ID)
    if (guest.identification_type === 'KTP' && guest.identification_number) {
      return 'Lokal'
    } else if (guest.identification_type === 'Passport' || guest.identification_type === 'passport') {
      return 'Asing'
    }
    return 'Tidak diketahui'
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Manajemen Tamu</h2>
            <p className="text-gray-600 mt-1">
              Kelola data tamu dan riwayat menginap
            </p>
          </div>
          <Button className="bg-warm-brown-600 hover:bg-warm-brown-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tamu
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tamu</p>
                  <p className="text-2xl font-bold">{guests?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamu Lokal</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {guests?.filter(g => getGuestTypeLabel(g) === 'Lokal').length || 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamu Asing</p>
                  <p className="text-2xl font-bold text-green-600">
                    {guests?.filter(g => getGuestTypeLabel(g) === 'Asing').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">INT</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bulan Ini</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {guests?.filter(g => {
                      const createdAt = new Date(g.created_at)
                      const now = new Date()
                      return createdAt.getMonth() === now.getMonth() && 
                             createdAt.getFullYear() === now.getFullYear()
                    }).length || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama, email, telepon, atau nomor KTP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tamu</CardTitle>
            <CardDescription>
              {guests?.length || 0} tamu terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Identitas</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada tamu ditemukan</p>
                          {searchQuery && (
                            <p className="text-sm mt-1">
                              Coba gunakan kata kunci yang berbeda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    guests?.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {guest.first_name} {guest.last_name}
                            </div>
                            {guest.preferences && Object.keys(guest.preferences as object).length > 0 && (
                              <div className="text-xs text-gray-500">
                                Ada preferensi khusus
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {guest.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                {guest.email}
                              </div>
                            )}
                            {guest.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                {formatIndonesianPhone(guest.phone)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {guest.identification_number ? (
                            <div className="text-sm">
                              <div className="font-mono">
                                {guest.identification_type === 'KTP' 
                                  ? formatKTP(guest.identification_number)
                                  : guest.identification_number
                                }
                              </div>
                              <div className="text-xs text-gray-500">
                                {guest.identification_type || 'Tidak diketahui'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Belum ada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getGuestTypeLabel(guest) === 'Lokal' ? 'default' : 'secondary'}
                            className={
                              getGuestTypeLabel(guest) === 'Lokal' 
                                ? 'bg-blue-100 text-blue-800' 
                                : getGuestTypeLabel(guest) === 'Asing'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {getGuestTypeLabel(guest)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {guest.city ? (
                            <div className="text-sm">
                              <div>{guest.city}</div>
                              {guest.state && (
                                <div className="text-xs text-gray-500">{guest.state}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(guest.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
      </div>
    </div>
  )
}