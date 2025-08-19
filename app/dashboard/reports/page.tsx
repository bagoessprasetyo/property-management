'use client'

import { useState } from 'react'
// Removed property context for single property setup
import { useReports, useOccupancyReport, useRevenueReport } from '@/lib/hooks/use-reports'
import { usePaymentStats } from '@/lib/hooks/use-payments'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OccupancyChart } from '@/components/charts/occupancy-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PaymentChart } from '@/components/charts/payment-chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3,
  Download, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Bed,
  CreditCard,
  Clock,
  Percent,
  FileText,
  Filter,
  Loader2,
  PieChart,
  LineChart,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/context/sidebar-context'

export default function ReportsPage() {
  // Removed currentProperty for single property setup
  const { data: reports, isLoading } = useReports()
  const { isCollapsed } = useSidebar()
  const { data: occupancyData, isLoading: occupancyLoading } = useOccupancyReport()
  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport()
  const { data: paymentData, isLoading: paymentLoading } = usePaymentStats()
  const [reportType, setReportType] = useState('occupancy')
  const [periodFilter, setPeriodFilter] = useState('month')
  const [dateRange, setDateRange] = useState('current')

  const reportTypes = [
    { value: 'occupancy', label: 'Tingkat Hunian', icon: Bed },
    { value: 'revenue', label: 'Pendapatan', icon: DollarSign },
    { value: 'guest', label: 'Analisis Tamu', icon: Users },
    { value: 'housekeeping', label: 'Housekeeping', icon: Clock },
    { value: 'payment', label: 'Pembayaran', icon: CreditCard },
    { value: 'performance', label: 'Performa Kamar', icon: BarChart3 }
  ]

  const getCurrentReport = () => {
    if (!reports) return {} as any
    return reports[reportType as keyof typeof reports] || {} as any
  }

  const currentReport = getCurrentReport()

  if (isLoading) {
    return (
      <div className="bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data laporan...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6">
      <div className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        // Responsive container width based on sidebar state
        isCollapsed 
          ? "max-w-[calc(100vw-6rem)] xl:max-w-[1400px]" // Wider when sidebar is collapsed
          : "max-w-7xl" // Standard width when sidebar is expanded
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h2>
            <p className="text-gray-600 mt-1">
              Analisis performa properti dan tren bisnis
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Ekspor PDF
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Ekspor Excel
            </Button>
          </div>
        </div>

        {/* Report Type and Period Filters */}
        <Card className='shadow-lg border-0'>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Laporan
                </label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis laporan" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {reportTypes.map(type => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periode
                </label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="day">Harian</SelectItem>
                    <SelectItem value="week">Mingguan</SelectItem>
                    <SelectItem value="month">Bulanan</SelectItem>
                    <SelectItem value="quarter">Kuartalan</SelectItem>
                    <SelectItem value="year">Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rentang
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Rentang" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="current">Saat Ini</SelectItem>
                    <SelectItem value="previous">Sebelumnya</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="custom">Kustom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendapatan Total</p>
                  <p className="text-2xl font-bold">
                    {formatIDR(currentReport.total_revenue || 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    {currentReport.revenue_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${currentReport.revenue_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(currentReport.revenue_change || 0)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tingkat Hunian</p>
                  <p className="text-2xl font-bold">{currentReport.occupancy_rate || 0}%</p>
                  <div className="flex items-center mt-1">
                    {currentReport.occupancy_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${currentReport.occupancy_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(currentReport.occupancy_change || 0)}%
                    </span>
                  </div>
                </div>
                <Percent className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ADR (Tarif Rata-rata)</p>
                  <p className="text-2xl font-bold">
                    {formatIDR(currentReport.adr || 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    {currentReport.adr_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${currentReport.adr_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(currentReport.adr_change || 0)}%
                    </span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">RevPAR</p>
                  <p className="text-2xl font-bold">
                    {formatIDR(currentReport.revpar || 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    {currentReport.revpar_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${currentReport.revpar_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(currentReport.revpar_change || 0)}%
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Charts Based on Report Type */}
        <div className="space-y-6">
          {reportType === 'occupancy' && occupancyData && (
            <OccupancyChart data={occupancyData} />
          )}
          
          {reportType === 'revenue' && revenueData && (
            <RevenueChart data={revenueData} />
          )}
          
          {reportType === 'payment' && paymentData && (
            <PaymentChart 
              data={{
                cash_payments: paymentData?.payment_methods?.cash || 0,
                card_payments: paymentData?.payment_methods?.card || 0,
                transfer_payments: paymentData?.payment_methods?.transfer || 0,
                ewallet_payments: paymentData?.payment_methods?.ewallet || 0,
                qris_payments: paymentData?.payment_methods?.qris || 0,
                total_transactions: paymentData?.total_transactions || 0,
                avg_transaction_amount: paymentData?.total_revenue / paymentData?.total_transactions || 0
              }} 
            />
          )}
          
          {(reportType === 'guest' || reportType === 'housekeeping' || reportType === 'performance') && (
            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {reportTypes.find(t => t.value === reportType)?.label} - Dalam Pengembangan
                </CardTitle>
                <CardDescription>
                  Fitur visualisasi untuk {reportTypes.find(t => t.value === reportType)?.label.toLowerCase()} sedang dalam pengembangan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Grafik akan tersedia dalam update mendatang</p>
                    <p className="text-sm">Data tersedia melalui API untuk integrasi custom</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Legacy Detail Section - Keep for reference */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
          <Card className='border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Data Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Data ringkasan tersedia melalui grafik interaktif di atas
              </p>
            </CardContent>
          </Card>

          {/* Details Section */}
          <Card className='border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Rincian Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportType === 'occupancy' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kamar Terisi</span>
                    <span className="font-medium">{currentReport.occupied_rooms || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Kamar</span>
                    <span className="font-medium">{currentReport.total_rooms || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rata-rata LOS</span>
                    <span className="font-medium">{currentReport.avg_los || 0} malam</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Walk-in Rate</span>
                    <span className="font-medium">{currentReport.walkin_rate || 0}%</span>
                  </div>
                </div>
              )}

              {reportType === 'revenue' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue Kamar</span>
                    <span className="font-medium">{formatIDR(currentReport.room_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue F&B</span>
                    <span className="font-medium">{formatIDR(currentReport.fb_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue Lainnya</span>
                    <span className="font-medium">{formatIDR(currentReport.other_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-gray-600 font-medium">Total</span>
                    <span className="font-bold">{formatIDR(currentReport.total_revenue || 0)}</span>
                  </div>
                </div>
              )}

              {reportType === 'guest' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Tamu</span>
                    <span className="font-medium">{currentReport.total_guests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tamu Baru</span>
                    <span className="font-medium">{currentReport.new_guests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Repeat Guests</span>
                    <span className="font-medium">{currentReport.repeat_guests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tamu Lokal</span>
                    <span className="font-medium">{currentReport.local_guests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tamu Asing</span>
                    <span className="font-medium">{currentReport.foreign_guests || 0}</span>
                  </div>
                </div>
              )}

              {reportType === 'payment' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tunai</span>
                    <span className="font-medium">{formatIDR(currentReport.cash_payments || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kartu</span>
                    <span className="font-medium">{formatIDR(currentReport.card_payments || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transfer</span>
                    <span className="font-medium">{formatIDR(currentReport.transfer_payments || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">E-Wallet</span>
                    <span className="font-medium">{formatIDR(currentReport.ewallet_payments || 0)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Reports */}
        <Card className='border-0 shadow-lg'>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Laporan Cepat
            </CardTitle>
            <CardDescription>
              Akses cepat ke laporan yang sering digunakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">Laporan Harian</span>
                </div>
                <span className="text-sm text-gray-500 text-left">
                  Ringkasan operasional hari ini
                </span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium">Arrival Report</span>
                </div>
                <span className="text-sm text-gray-500 text-left">
                  Daftar tamu yang akan check-in
                </span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center mb-2">
                  <Bed className="w-4 h-4 mr-2" />
                  <span className="font-medium">Room Status</span>
                </div>
                <span className="text-sm text-gray-500 text-left">
                  Status real-time semua kamar
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    // </div>
  )
}