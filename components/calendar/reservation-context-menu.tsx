'use client'

import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUpdateReservationStatus, useCancelReservation } from '@/lib/hooks/use-reservations'
import {
  Edit,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  CreditCard,
  MessageSquare,
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react'

interface ReservationContextMenuProps {
  reservation: any
  children: React.ReactNode
  onEdit: (reservationId: string) => void
  onView: (reservationId: string) => void
  onDuplicate?: (reservationId: string) => void
}

export function ReservationContextMenu({
  reservation,
  children,
  onEdit,
  onView,
  onDuplicate
}: ReservationContextMenuProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const updateStatus = useUpdateReservationStatus()
  const cancelReservation = useCancelReservation()

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id: reservation.id,
        status: newStatus as any
      })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelReservation.mutateAsync(reservation.id)
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
    }
  }

  const getStatusActions = () => {
    const currentStatus = reservation.status
    const actions = []

    if (currentStatus === 'pending') {
      actions.push({ status: 'confirmed', label: 'Konfirmasi', icon: CheckCircle })
    }
    
    if (currentStatus === 'confirmed') {
      actions.push({ status: 'checked_in', label: 'Check-in', icon: ArrowRight })
    }
    
    if (currentStatus === 'checked_in') {
      actions.push({ status: 'checked_out', label: 'Check-out', icon: CheckCircle })
    }

    if (!['cancelled', 'checked_out'].includes(currentStatus)) {
      actions.push({ status: 'no_show', label: 'Tidak Datang', icon: AlertCircle })
    }

    return actions
  }

  const copyReservationInfo = () => {
    const info = `
Reservasi #${reservation.confirmation_number}
Tamu: ${reservation.guest_name}
Kamar: ${reservation.room_number}
Check-in: ${new Date(reservation.check_in_date).toLocaleDateString('id-ID')}
Check-out: ${new Date(reservation.check_out_date).toLocaleDateString('id-ID')}
Status: ${reservation.status}
Total: ${reservation.total_amount ? `Rp ${reservation.total_amount.toLocaleString('id-ID')}` : 'N/A'}
    `.trim()
    
    navigator.clipboard.writeText(info)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {/* View & Edit Actions */}
          <ContextMenuItem onClick={() => onView(reservation.id)}>
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </ContextMenuItem>
          
          <ContextMenuItem onClick={() => onEdit(reservation.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Reservasi
          </ContextMenuItem>

          {onDuplicate && (
            <ContextMenuItem onClick={() => onDuplicate(reservation.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplikasi
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          {/* Status Changes */}
          {getStatusActions().length > 0 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Clock className="mr-2 h-4 w-4" />
                Ubah Status
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {getStatusActions().map(({ status, label, icon: Icon }) => (
                  <ContextMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {/* Quick Actions */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <User className="mr-2 h-4 w-4" />
              Tamu
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Kirim Pesan
              </ContextMenuItem>
              <ContextMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Lihat Riwayat
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <MapPin className="mr-2 h-4 w-4" />
              Kamar
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Pindah Kamar
              </ContextMenuItem>
              <ContextMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Status Kamar
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Pembayaran
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Utility Actions */}
          <ContextMenuItem onClick={copyReservationInfo}>
            <Copy className="mr-2 h-4 w-4" />
            Salin Info
          </ContextMenuItem>

          {/* Cancel Action */}
          {!['cancelled', 'checked_out'].includes(reservation.status) && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Batalkan Reservasi
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Reservasi?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan reservasi #{reservation.confirmation_number} 
              untuk {reservation.guest_name}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelReservation.isPending}
            >
              {cancelReservation.isPending ? 'Membatalkan...' : 'Ya, Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}