'use client'

import { useState } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { usePayments } from '@/lib/hooks/use-payments'
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
  CreditCard,
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Banknote,
  Receipt,
  TrendingUp,
  Loader2,
  Calendar,
  User,
  Building
} from 'lucide-react'

export default function PaymentsPage() {
  const { currentProperty } = useProperty()
  const { data: payments, isLoading } = usePayments(currentProperty?.id)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  // Filter payments based on search and filters
  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = 
      payment.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reservation_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter
    
    let matchesPeriod = true
    if (periodFilter !== 'all') {
      const paymentDate = new Date(payment.payment_date || payment.created_at)
      const today = new Date()
      
      switch (periodFilter) {
        case 'today':
          matchesPeriod = paymentDate.toDateString() === today.toDateString()
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesPeriod = paymentDate >= weekAgo
          break
        case 'month':
          matchesPeriod = paymentDate.getMonth() === today.getMonth() && 
                         paymentDate.getFullYear() === today.getFullYear()
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesMethod && matchesPeriod
  }) || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      },
      completed: { 
        label: 'Selesai', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      failed: { 
        label: 'Gagal', 
        color: 'bg-red-100 text-red-800',
        icon: XCircle 
      },
      cancelled: { 
        label: 'Dibatalkan', 
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle 
      },
      refunded: { 
        label: 'Dikembalikan', 
        color: 'bg-purple-100 text-purple-800',
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

  const getMethodLabel = (method: string) => {
    const methodLabels = {
      cash: 'Tunai',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      bank_transfer: 'Transfer Bank',
      e_wallet: 'E-Wallet',
      qris: 'QRIS',
      installment: 'Cicilan'
    }
    
    return methodLabels[method as keyof typeof methodLabels] || method
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4 text-green-600" />
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'bank_transfer':
        return <Building className="w-4 h-4 text-purple-600" />
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />
    }
  }

  // Calculate totals
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data pembayaran...</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Manajemen Pembayaran</h2>
            <p className="text-gray-600 mt-1">
              Kelola transaksi dan pembayaran tamu
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Ekspor
            </Button>
            <Button className="bg-warm-brown-600 hover:bg-warm-brown-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pembayaran
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transaksi</p>
                  <p className="text-2xl font-bold">{payments?.length || 0}</p>
                </div>
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatIDR(totalRevenue)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menunggu Pembayaran</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatIDR(pendingAmount)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pembayaran Hari Ini</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {payments?.filter(p => {
                      const today = new Date().toISOString().split('T')[0]
                      const paymentDate = p.payment_date || p.created_at
                      return paymentDate && new Date(paymentDate).toISOString().split('T')[0] === today
                    }).length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nama tamu, nomor reservasi, atau ID transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  <SelectItem value="refunded">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                  <SelectItem value="debit_card">Kartu Debit</SelectItem>
                  <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                  <SelectItem value="e_wallet">E-Wallet</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full lg:w-40">
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

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pembayaran</CardTitle>
            <CardDescription>
              {filteredPayments.length} dari {payments?.length || 0} transaksi ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Tamu</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada transaksi ditemukan</p>
                          {searchQuery && (
                            <p className="text-sm mt-1">
                              Coba gunakan kata kunci yang berbeda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              #{payment.transaction_id || payment.id?.slice(0, 8)}
                            </div>
                            {payment.reservation_number && (
                              <div className="text-sm text-gray-500">
                                Reservasi: {payment.reservation_number}
                              </div>
                            )}
                            {payment.description && (
                              <div className="text-xs text-gray-400 max-w-xs truncate">
                                {payment.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {payment.guest_name || 'Tamu tidak diketahui'}
                              </div>
                              {payment.guest_email && (
                                <div className="text-sm text-gray-500">
                                  {payment.guest_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getMethodIcon(payment.payment_method)}
                            <span className="ml-2">
                              {getMethodLabel(payment.payment_method)}
                            </span>
                          </div>
                          {payment.card_last_four && (
                            <div className="text-xs text-gray-500 mt-1">
                              **** {payment.card_last_four}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatIDR(payment.amount || 0)}
                          </div>
                          {payment.fee && payment.fee > 0 && (
                            <div className="text-xs text-gray-500">
                              Biaya: {formatIDR(payment.fee)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(payment.payment_date || payment.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.payment_date || payment.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                          {payment.processed_at && payment.status === 'completed' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Diproses {new Date(payment.processed_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
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