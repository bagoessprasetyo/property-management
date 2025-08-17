'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreatePayment, useUpdatePayment } from '@/lib/hooks/use-payments'
import { useReservations } from '@/lib/hooks/use-reservations'
import { useProperty } from '@/lib/context/property-context'
import { formatIDR, parseIDR } from '@/lib/utils/currency'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  DollarSign, 
  Save,
  X,
  Banknote,
  Building,
  Receipt,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// Payment methods available in Indonesia
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai', icon: Banknote },
  { value: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
  { value: 'debit_card', label: 'Kartu Debit', icon: CreditCard },
  { value: 'bank_transfer', label: 'Transfer Bank', icon: Building },
  { value: 'e_wallet', label: 'E-Wallet (GoPay, OVO, Dana)', icon: CreditCard },
  { value: 'qris', label: 'QRIS', icon: CreditCard },
  { value: 'installment', label: 'Cicilan', icon: CreditCard },
]

// Payment statuses
const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Gagal', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-gray-100 text-gray-800' },
  { value: 'refunded', label: 'Dikembalikan', color: 'bg-purple-100 text-purple-800' },
]

// Form validation schema
const paymentFormSchema = z.object({
  reservation_id: z.string().min(1, 'Reservasi wajib dipilih'),
  amount: z.number().min(1, 'Jumlah pembayaran minimal Rp 1'),
  payment_method: z.string().min(1, 'Metode pembayaran wajib dipilih'),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']),
  payment_date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  transaction_id: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  fee: z.number().min(0, 'Biaya tidak boleh negatif').optional().nullable(),
  card_last_four: z.string().optional(),
  bank_name: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface PaymentFormProps {
  payment?: any // Existing payment for editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  preselectedReservationId?: string
}

export function PaymentForm({ payment, open, onOpenChange, onSuccess, preselectedReservationId }: PaymentFormProps) {
  const [amountInput, setAmountInput] = useState('')
  const [feeInput, setFeeInput] = useState('')
  const isEditing = !!payment
  const { currentProperty } = useProperty()

  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()
  const { data: reservations } = useReservations(currentProperty?.id)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      reservation_id: payment?.reservation_id || preselectedReservationId || '',
      amount: payment?.amount || 0,
      payment_method: payment?.payment_method || 'cash',
      status: payment?.status || 'pending',
      payment_date: payment?.payment_date 
        ? new Date(payment.payment_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      transaction_id: payment?.transaction_id || '',
      description: payment?.description || '',
      notes: payment?.notes || '',
      fee: payment?.fee || null,
      card_last_four: payment?.card_last_four || '',
      bank_name: payment?.bank_name || '',
    },
  })

  // Update amount input when payment changes
  useEffect(() => {
    if (payment?.amount) {
      setAmountInput(formatIDR(payment.amount))
    }
    if (payment?.fee) {
      setFeeInput(formatIDR(payment.fee))
    }
  }, [payment])

  // Set preselected reservation
  useEffect(() => {
    if (preselectedReservationId && !payment) {
      form.setValue('reservation_id', preselectedReservationId)
    }
  }, [preselectedReservationId, payment, form])

  const onSubmit = async (data: PaymentFormData) => {
    try {
      logger.info(`${isEditing ? 'Updating' : 'Creating'} payment`, { 
        paymentId: payment?.id,
        reservationId: data.reservation_id,
        amount: data.amount
      })

      const formattedData = {
        ...data,
        fee: data.fee || null,
        transaction_id: data.transaction_id || null,
        description: data.description || null,
        notes: data.notes || null,
        card_last_four: data.card_last_four || null,
        bank_name: data.bank_name || null,
        processed_at: data.status === 'completed' ? new Date().toISOString() : null,
      }

      if (isEditing) {
        await updatePayment.mutateAsync({
          id: payment.id,
          updates: {
            ...formattedData,
            payment_method: formattedData.payment_method as "cash" | "credit_card" | "debit_card" | "bank_transfer" | "digital_wallet"
          }
        })
        logger.info('Payment updated successfully', { paymentId: payment.id })
      } else {
        await createPayment.mutateAsync({
          ...formattedData,
          payment_method: formattedData.payment_method as "cash" | "credit_card" | "debit_card" | "bank_transfer" | "digital_wallet"
        })
        logger.info('Payment created successfully')
      }

      onOpenChange(false)
      form.reset()
      setAmountInput('')
      setFeeInput('')
      onSuccess?.()
    } catch (error) {
      logger.error(`Failed to ${isEditing ? 'update' : 'create'} payment`, error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setAmountInput('')
    setFeeInput('')
  }

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    const numericValue = parseIDR(value)
    form.setValue('amount', numericValue)
  }

  const handleFeeChange = (value: string) => {
    setFeeInput(value)
    const numericValue = parseIDR(value)
    form.setValue('fee', numericValue)
  }

  const selectedReservation = reservations?.find(r => r.id === form.watch('reservation_id'))
  const paymentMethod = form.watch('payment_method')
  const showCardFields = paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
  const showBankFields = paymentMethod === 'bank_transfer'

  const isLoading = createPayment.isPending || updatePayment.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {isEditing ? 'Edit Pembayaran' : 'Tambah Pembayaran Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi pembayaran yang sudah ada'
              : 'Catat pembayaran baru untuk reservasi'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-96 overflow-y-auto space-y-4">
              {/* Reservation Selection */}
              <FormField
                control={form.control}
                name="reservation_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reservasi *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih reservasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reservations?.map(reservation => (
                          <SelectItem key={reservation.id} value={reservation.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{reservation.confirmation_number}</Badge>
                              <span>
                                {reservation.guests?.first_name} {reservation.guests?.last_name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selected Reservation Info */}
              {selectedReservation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {selectedReservation.guests?.first_name} {selectedReservation.guests?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedReservation.rooms?.room_number} • {selectedReservation.rooms?.room_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedReservation.check_in_date).toLocaleDateString('id-ID')} - 
                          {new Date(selectedReservation.check_out_date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatIDR(selectedReservation.total_amount || 0)}
                        </p>
                        <p className="text-sm text-gray-600">Total Reservasi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-2">
                  <Label>Jumlah Pembayaran *</Label>
                  <Input
                    placeholder="Rp 500,000"
                    value={amountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                {/* Payment Date */}
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Pembayaran *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Pembayaran *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih metode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => {
                            const Icon = method.icon
                            return (
                              <SelectItem key={method.value} value={method.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {method.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Pembayaran *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Transaction ID */}
              <FormField
                control={form.control}
                name="transaction_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Transaksi</FormLabel>
                    <FormControl>
                      <Input placeholder="TRX123456789" {...field} />
                    </FormControl>
                    <FormDescription>ID transaksi dari bank atau payment gateway</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Card Fields */}
              {showCardFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="card_last_four"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4 Digit Terakhir Kartu</FormLabel>
                        <FormControl>
                          <Input placeholder="1234" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Penerbit</FormLabel>
                        <FormControl>
                          <Input placeholder="BCA, BNI, Mandiri, dll" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Bank Fields */}
              {showBankFields && (
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Bank</FormLabel>
                      <FormControl>
                        <Input placeholder="Bank BCA, Bank Mandiri, dll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Fee */}
              <div className="space-y-2">
                <Label>Biaya Administrasi</Label>
                <Input
                  placeholder="Rp 5,000"
                  value={feeInput}
                  onChange={(e) => handleFeeChange(e.target.value)}
                />
                <p className="text-xs text-gray-500">Biaya admin dari bank atau payment gateway</p>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Keterangan pembayaran..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Internal</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Catatan internal untuk staff..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Catatan ini tidak terlihat oleh tamu</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditing ? 'Menyimpan...' : 'Menyimpan...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}