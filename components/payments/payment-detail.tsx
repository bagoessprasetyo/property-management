'use client'

import { useState } from 'react'
import { usePayment, useProcessRefund } from '@/lib/hooks/use-payments'
import { formatIDR } from '@/lib/utils/currency'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  Edit,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Banknote,
  Building,
  Receipt,
  Calendar,
  User,
  DollarSign,
  FileText,
  Settings as SettingsIcon,
  ArrowLeft
} from 'lucide-react'
import { PaymentForm } from './payment-form'
import { logger } from '@/lib/utils/logger'

interface PaymentDetailProps {
  paymentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface RefundFormProps {
  payment: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function RefundForm({ payment, open, onOpenChange, onSuccess }: RefundFormProps) {
  const [refundAmount, setRefundAmount] = useState(payment?.amount || 0)
  const [refundReason, setRefundReason] = useState('')
  const processRefund = useProcessRefund()

  const handleRefund = async () => {
    try {
      await processRefund.mutateAsync({
        id: payment.id,
        amount: refundAmount,
        reason: refundReason
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      logger.error('Failed to process refund', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <RefreshCw className="w-5 h-5" />
            Proses Refund
          </DialogTitle>
          <DialogDescription>
            Kembalikan dana untuk pembayaran #{payment?.transaction_id || payment?.id?.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Refund akan mengubah status pembayaran menjadi "Dikembalikan" dan tidak dapat dibatalkan.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Jumlah Refund</Label>
            <div className="text-lg font-bold text-green-600">
              {formatIDR(payment?.amount || 0)}
            </div>
            <p className="text-sm text-gray-500">Jumlah maksimal yang dapat dikembalikan</p>
          </div>

          <div className="space-y-2">
            <Label>Alasan Refund</Label>
            <Textarea
              placeholder="Masukkan alasan refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRefund}
              disabled={processRefund.isPending || !refundReason.trim()}
            >
              {processRefund.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Proses Refund
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PaymentDetail({ paymentId, open, onOpenChange }: PaymentDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRefundForm, setShowRefundForm] = useState(false)

  const { data: payment, isLoading: paymentLoading } = usePayment(paymentId)

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleRefund = () => {
    setShowRefundForm(true)
  }

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
        icon: X 
      },
      cancelled: { 
        label: 'Dibatalkan', 
        color: 'bg-gray-100 text-gray-800',
        icon: X 
      },
      refunded: { 
        label: 'Dikembalikan', 
        color: 'bg-purple-100 text-purple-800',
        icon: RefreshCw 
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

  if (paymentLoading || !payment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat detail pembayaran...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const canRefund = payment.status === 'completed'
  const canEdit = payment.status !== 'refunded'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-warm-brown-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Pembayaran #{payment.transaction_id || payment.id?.slice(0, 8)}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    {getStatusBadge(payment.status)}
                    <span className="text-lg font-bold text-green-600">
                      {formatIDR(payment.amount)}
                    </span>
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canRefund && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefund}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refund
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Receipt
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detail</TabsTrigger>
              <TabsTrigger value="reservation">Reservasi</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Informasi Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Jumlah</p>
                        <p className="font-medium text-lg text-green-600">
                          {formatIDR(payment.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getMethodIcon(payment.payment_method)}
                      <div>
                        <p className="text-sm text-gray-600">Metode Pembayaran</p>
                        <p className="font-medium">{getMethodLabel(payment.payment_method)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Tanggal Pembayaran</p>
                        <p className="font-medium">
                          {new Date(payment.payment_date || payment.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>

                    {payment.fee && (
                      <div className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Biaya Admin</p>
                          <p className="font-medium">{formatIDR(payment.fee)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Detail Transaksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {payment.transaction_id && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">ID Transaksi</p>
                          <p className="font-medium font-mono">{payment.transaction_id}</p>
                        </div>
                      </div>
                    )}

                    {payment.card_last_four && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Kartu</p>
                          <p className="font-medium">**** **** **** {payment.card_last_four}</p>
                        </div>
                      </div>
                    )}

                    {payment.bank_name && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Bank</p>
                          <p className="font-medium">{payment.bank_name}</p>
                        </div>
                      </div>
                    )}

                    {payment.processed_at && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-600">Diproses</p>
                          <p className="font-medium">
                            {new Date(payment.processed_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {payment.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Deskripsi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{payment.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {payment.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5" />
                      Catatan Internal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{payment.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reservation Tab */}
            <TabsContent value="reservation" className="space-y-4 max-h-96 overflow-y-auto">
              {payment.reservations ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informasi Reservasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {payment.guest_name}
                        </p>
                        <p className="text-sm text-gray-600">{payment.guest_email}</p>
                      </div>
                      <Badge variant="outline">
                        {payment.reservation_number}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-medium">
                          {payment.reservations.check_in_date 
                            ? new Date(payment.reservations.check_in_date).toLocaleDateString('id-ID')
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-medium">
                          {payment.reservations.check_out_date 
                            ? new Date(payment.reservations.check_out_date).toLocaleDateString('id-ID')
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-gray-600">Total Reservasi</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatIDR(payment.reservations.total_amount || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Informasi reservasi tidak tersedia</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 max-h-96 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Pembayaran Dibuat</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </p>
                    </div>
                  </div>

                  {payment.processed_at && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">Pembayaran Diproses</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.processed_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>
                  )}

                  {payment.updated_at !== payment.created_at && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Edit className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <p className="font-medium">Pembayaran Diperbarui</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>
                  )}

                  {payment.status === 'refunded' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-purple-50">
                      <RefreshCw className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-800">Pembayaran Dikembalikan</p>
                        <p className="text-sm text-purple-600">
                          Dana dikembalikan ke tamu
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <PaymentForm
        payment={payment}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={() => setShowEditForm(false)}
      />

      {/* Refund Form */}
      <RefundForm
        payment={payment}
        open={showRefundForm}
        onOpenChange={setShowRefundForm}
        onSuccess={() => setShowRefundForm(false)}
      />
    </>
  )
}