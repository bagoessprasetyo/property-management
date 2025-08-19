'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Pie,
  Cell
} from 'recharts'

interface OccupancyChartProps {
  data: {
    current: any
    time_series: Array<{
      date: string
      occupancy_rate: number
      occupied_rooms: number
    }>
    by_room_type: Array<{
      room_type: string
      occupancy_rate: number
      total_rooms: number
      occupied: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function OccupancyChart({ data }: OccupancyChartProps) {
  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Series Chart */}
      <Card className='shadow-lg border-0'>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2" />
            Tren Tingkat Hunian (7 Hari Terakhir)
          </CardTitle>
          <CardDescription>
            Persentase tingkat hunian harian dalam seminggu terakhir
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                fontSize={12}
              />
              <Tooltip 
                labelFormatter={(value) => formatTooltipDate(value)}
                formatter={(value: number) => [`${value}%`, 'Tingkat Hunian']}
              />
              <Line 
                type="monotone" 
                dataKey="occupancy_rate" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Room Type Breakdown */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Hunian per Tipe Kamar
          </CardTitle>
          <CardDescription>
            Distribusi tingkat hunian berdasarkan tipe kamar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_room_type}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="room_type" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name) => [
                  `${value}%`, 
                  name === 'occupancy_rate' ? 'Tingkat Hunian' : name
                ]}
              />
              <Bar 
                dataKey="occupancy_rate" 
                fill="#0088FE"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Room Type Stats */}
      <Card className="lg:col-span-2 border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Statistik Detail per Tipe Kamar</CardTitle>
          <CardDescription>
            Analisis mendalam tingkat hunian berdasarkan tipe kamar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.by_room_type.map((roomType, index) => (
              <div key={roomType.room_type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{roomType.room_type}</h4>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tingkat Hunian:</span>
                    <span className="font-medium">{roomType.occupancy_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kamar Terisi:</span>
                    <span className="font-medium">{roomType.occupied}/{roomType.total_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kamar Tersedia:</span>
                    <span className="font-medium">{roomType.total_rooms - roomType.occupied}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}