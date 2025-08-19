'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock,
  Receipt,
  ChefHat,
  X
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  useCheckOutstandingBills,
  usePayRestaurantBill 
} from '@/lib/hooks/use-restaurant-bills'
import { formatIDR } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface CheckoutValidationProps {
  reservationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmCheckout: () => void
  guestName: string
}

export function CheckoutValidation({ 
  reservationId, 
  open, 
  onOpenChange, 
  onConfirmCheckout,
  guestName 
}: CheckoutValidationProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  
  const { data: billCheck, isLoading, refetch } = useCheckOutstandingBills(reservationId)
  const payBill = usePayRestaurantBill()

  const handlePayBill = async (billId: string, amount: number) => {
    setIsProcessingPayment(true)
    try {
      await payBill.mutateAsync({ id: billId, payment_amount: amount })
      toast.success('Tagihan berhasil dibayar')
      refetch() // Refresh the bill status
    } catch (error) {
      toast.error('Gagal memproses pembayaran')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleProceedCheckout = () => {
    if (billCheck?.has_outstanding) {
      toast.error('Tidak dapat checkout dengan tagihan yang belum dibayar')
      return
    }
    onConfirmCheckout()
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validasi Checkout</DialogTitle>
            <DialogDescription>
              Memeriksa tagihan restoran...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-8 h-8 animate-spin text-warm-brown-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Validasi Checkout
          </DialogTitle>
          <DialogDescription>
            Memeriksa tagihan restoran untuk {guestName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!billCheck?.has_outstanding ? (
            // No outstanding bills - can proceed
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">
                      Tidak Ada Tagihan Outstanding
                    </h3>
                    <p className="text-sm text-green-600">
                      Checkout dapat dilanjutkan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Has outstanding bills - need payment
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Terdapat tagihan restoran yang belum dibayar. Pembayaran harus diselesaikan 
                  sebelum checkout.
                </AlertDescription>
              </Alert>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Tagihan Restoran Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Total Outstanding</p>
                        <p className="text-sm text-gray-600">
                          Tagihan restoran yang belum dibayar
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          {formatIDR(billCheck.amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Opsi Pembayaran:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // In a real app, you'd get the bill ID from the API
                          // For demo purposes, we'll use a placeholder
                          handlePayBill('bill-id', billCheck.amount)
                        }}
                        disabled={isProcessingPayment}
                        className="justify-start"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Bayar dengan Kartu
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          handlePayBill('bill-id', billCheck.amount)
                        }}
                        disabled={isProcessingPayment}
                        className="justify-start"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Bayar Tunai
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-sm text-gray-600">
                    <p>💡 <strong>Catatan:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Semua tagihan restoran harus diselesaikan sebelum checkout</li>
                      <li>Pembayaran akan diproses secara real-time</li>
                      <li>Receipt akan diberikan setelah pembayaran</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          
          {!billCheck?.has_outstanding ? (
            <Button 
              onClick={handleProceedCheckout}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Lanjut Checkout
            </Button>
          ) : (
            <Button 
              onClick={handleProceedCheckout}
              disabled={true}
              className="bg-gray-400 cursor-not-allowed"
            >
              <X className="w-4 h-4 mr-2" />
              Bayar Tagihan Dulu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}