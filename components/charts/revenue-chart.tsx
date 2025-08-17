'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIDR } from '@/lib/utils/currency'
import { LineChart as LineChartIcon, PieChart } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface RevenueChartProps {
  data: {
    current: any
    time_series: Array<{
      date: string
      revenue: number
      adr: number
    }>
    by_source: Array<{
      source: string
      revenue: number
      percentage: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function RevenueChart({ data }: RevenueChartProps) {
  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const formatRevenueTooltip = (value: number) => {
    return formatIDR(value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Time Series */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2" />
            Tren Pendapatan Harian
          </CardTitle>
          <CardDescription>
            Pendapatan dan ADR (Average Daily Rate) 7 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatTooltipDate}
                fontSize={12}
              />
              <YAxis 
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                fontSize={12}
              />
              <YAxis 
                yAxisId="adr"
                orientation="right"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                fontSize={12}
              />
              <Tooltip 
                labelFormatter={(value) => formatTooltipDate(value)}
                formatter={(value: number, name) => [
                  name === 'revenue' ? formatIDR(value) : formatIDR(value),
                  name === 'revenue' ? 'Pendapatan' : 'ADR'
                ]}
              />
              <Line 
                yAxisId="revenue"
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="revenue"
              />
              <Line 
                yAxisId="adr"
                type="monotone" 
                dataKey="adr" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="adr"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Sumber Pendapatan
          </CardTitle>
          <CardDescription>
            Distribusi pendapatan berdasarkan sumber booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data.by_source}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${source}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.by_source.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatIDR(value)} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Rincian Pendapatan</CardTitle>
          <CardDescription>
            Analisis detail komponen pendapatan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Components */}
            <div className="space-y-4">
              <h4 className="font-medium">Komponen Pendapatan</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pendapatan Kamar</span>
                  <span className="font-medium">{formatIDR(data.current?.room_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">F&B Revenue</span>
                  <span className="font-medium">{formatIDR(data.current?.fb_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pendapatan Lainnya</span>
                  <span className="font-medium">{formatIDR(data.current?.other_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-t-2 border-gray-300">
                  <span className="font-medium">Total Pendapatan</span>
                  <span className="font-bold text-lg">{formatIDR(data.current?.total_revenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium">Metrik Utama</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-gray-600">ADR (Average Daily Rate)</div>
                  <div className="text-xl font-bold text-blue-600">{formatIDR(data.current?.adr || 0)}</div>
                  <div className="text-xs text-gray-500">
                    {data.current?.adr_change > 0 ? '+' : ''}{data.current?.adr_change || 0}% vs periode sebelumnya
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-gray-600">RevPAR (Revenue per Available Room)</div>
                  <div className="text-xl font-bold text-green-600">{formatIDR(data.current?.revpar || 0)}</div>
                  <div className="text-xs text-gray-500">
                    {data.current?.revpar_change > 0 ? '+' : ''}{data.current?.revpar_change || 0}% vs periode sebelumnya
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by Source Table */}
            <div className="space-y-4">
              <h4 className="font-medium">Detail Sumber Pendapatan</h4>
              <div className="space-y-2">
                {data.by_source.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatIDR(source.revenue)}</div>
                      <div className="text-xs text-gray-500">{source.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}