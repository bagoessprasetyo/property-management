'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIDR } from '@/lib/utils/currency'
import { PieChart, BarChart as BarChartIcon } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface PaymentChartProps {
  data: {
    cash_payments: number
    card_payments: number
    transfer_payments: number
    ewallet_payments: number
    qris_payments: number
    total_transactions: number
    avg_transaction_amount: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function PaymentChart({ data }: PaymentChartProps) {
  const paymentMethods = [
    { name: 'Tunai', value: data.cash_payments, count: 0 },
    { name: 'Kartu', value: data.card_payments, count: 0 },
    { name: 'Transfer', value: data.transfer_payments, count: 0 },
    { name: 'E-Wallet', value: data.ewallet_payments, count: 0 },
    { name: 'QRIS', value: data.qris_payments, count: 0 }
  ].filter(method => method.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Methods Distribution */}
      <Card className='shadow-lg border-0'>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Distribusi Metode Pembayaran
          </CardTitle>
          <CardDescription>
            Pembagian nilai transaksi berdasarkan metode pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  if (props.name && typeof props.value === 'number') {
                    return `${props.name}: ${((props.value / paymentMethods.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}%`
                  }
                  return ''
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatIDR(value)} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods Bar Chart */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2" />
            Nilai Transaksi per Metode
          </CardTitle>
          <CardDescription>
            Perbandingan nilai transaksi dalam Rupiah
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethods}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatIDR(value), 'Nilai Transaksi']}
              />
              <Bar 
                dataKey="value" 
                fill="#0088FE"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Statistics */}
      <Card className="border-0 shadow-lg lg:col-span-2">
        <CardHeader>
          <CardTitle>Statistik Pembayaran</CardTitle>
          <CardDescription>
            Ringkasan lengkap aktivitas pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Stats */}
            <div className="space-y-4">
              <h4 className="font-medium">Ringkasan Umum</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Transaksi</div>
                  <div className="text-2xl font-bold text-blue-600">{data.total_transactions}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Rata-rata per Transaksi</div>
                  <div className="text-xl font-bold text-green-600">{formatIDR(data.avg_transaction_amount)}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Nilai</div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatIDR(
                      data.cash_payments + data.card_payments + data.transfer_payments + 
                      data.ewallet_payments + data.qris_payments
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Detail per Metode</h4>
              <div className="space-y-2">
                {paymentMethods.map((method, index) => (
                  <div key={method.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatIDR(method.value)}</div>
                      <div className="text-xs text-gray-500">
                        {((method.value / paymentMethods.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}% dari total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-4">
              <h4 className="font-medium">Insights</h4>
              <div className="space-y-3">
                {(() => {
                  const totalValue = paymentMethods.reduce((sum, p) => sum + p.value, 0)
                  const dominantMethod = paymentMethods.reduce((max, method) => 
                    method.value > max.value ? method : max, paymentMethods[0])
                  const digitalPayments = data.card_payments + data.ewallet_payments + data.qris_payments
                  const digitalPercentage = ((digitalPayments / totalValue) * 100).toFixed(1)

                  return (
                    <>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-gray-600">Metode Terpopuler</div>
                        <div className="font-medium">{dominantMethod?.name}</div>
                        <div className="text-xs text-gray-500">
                          {((dominantMethod?.value / totalValue) * 100).toFixed(1)}% dari total transaksi
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="text-sm text-gray-600">Pembayaran Digital</div>
                        <div className="font-medium">{digitalPercentage}%</div>
                        <div className="text-xs text-gray-500">Kartu + E-Wallet + QRIS</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Pembayaran Tunai</div>
                        <div className="font-medium">
                          {((data.cash_payments / totalValue) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">dari total transaksi</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}