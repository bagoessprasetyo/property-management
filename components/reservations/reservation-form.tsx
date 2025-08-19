'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateReservation, useCreateReservationWithPayment, useUpdateReservation } from '@/lib/hooks/use-reservations'
import { useRooms } from '@/lib/hooks/use-rooms'
import { useGuests, useCreateGuest } from '@/lib/hooks/use-guests'
// Removed property context for single property setup
import { formatIDR, parseIDR } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Users, 
  Save,
  X,
  Bed,
  User,
  CreditCard,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Plus,
  Calculator
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// Reservation status options
const RESERVATION_STATUSES = [
  { value: 'pending', label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800' },
  { value: 'checked_in', label: 'Sudah Check-in', color: 'bg-green-100 text-green-800' },
  { value: 'checked_out', label: 'Sudah Check-out', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
  { value: 'no_show', label: 'Tidak Datang', color: 'bg-red-100 text-red-800' },
]

// Form validation schema
const reservationFormSchema = z.object({
  guest_id: z.string().min(1, 'Tamu wajib dipilih'),
  room_id: z.string().min(1, 'Kamar wajib dipilih'),
  check_in_date: z.string().min(1, 'Tanggal check-in wajib diisi'),
  check_out_date: z.string().min(1, 'Tanggal check-out wajib diisi'),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  adults: z.number().min(1, 'Minimal 1 tamu dewasa'),
  children: z.number().min(0, 'Jumlah anak tidak boleh negatif'),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
  total_amount: z.number().min(0, 'Total tidak boleh negatif'),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
  confirmation_number: z.string().optional(),
  payment_status: z.enum(['unpaid', 'partial', 'paid']).optional(),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  {
    message: 'Tanggal check-out harus setelah check-in',
    path: ['check_out_date'],
  }
)

type ReservationFormData = z.infer<typeof reservationFormSchema>

interface ReservationFormProps {
  reservation?: any // Existing reservation for editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  preselectedGuestId?: string
  preselectedRoomId?: string
  preselectedDates?: {
    checkIn: string
    checkOut: string
  }
}

export function ReservationForm({ 
  reservation, 
  open, 
  onOpenChange, 
  onSuccess, 
  preselectedGuestId,
  preselectedRoomId,
  preselectedDates
}: ReservationFormProps) {
  const [totalAmountInput, setTotalAmountInput] = useState('')
  const [currentTab, setCurrentTab] = useState('guest')
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [newGuestData, setNewGuestData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    identification_number: ''
  })
  const isEditing = !!reservation
  // Removed currentProperty for single property setup

  const createReservation = useCreateReservation()
  const createReservationWithPayment = useCreateReservationWithPayment()
  const updateReservation = useUpdateReservation()
  const createGuest = useCreateGuest()
  const { data: rooms } = useRooms()
  const { data: allRooms } = useRooms() // Fallback for when property rooms are empty
  const { data: guests } = useGuests()

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guest_id: reservation?.guest_id || preselectedGuestId || '',
      room_id: reservation?.room_id || preselectedRoomId || '',
      check_in_date: reservation?.check_in_date || preselectedDates?.checkIn || 
        new Date().toISOString().split('T')[0],
      check_out_date: reservation?.check_out_date || preselectedDates?.checkOut || 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      check_in_time: reservation?.check_in_time || '14:00',
      check_out_time: reservation?.check_out_time || '12:00',
      adults: reservation?.adults || 1,
      children: reservation?.children || 0,
      status: reservation?.status || 'pending',
      total_amount: reservation?.total_amount || 0,
      special_requests: reservation?.special_requests || '',
      notes: reservation?.notes || '',
      confirmation_number: reservation?.confirmation_number || '',
      payment_status: reservation?.payment_status || 'unpaid',
    },
  })

  // Update total amount input when reservation changes
  useEffect(() => {
    if (reservation?.total_amount) {
      setTotalAmountInput(formatIDR(reservation.total_amount))
    }
  }, [reservation])

  // Use appropriate rooms data with fallback
  const roomsData = (rooms?.length || 0) > 0 ? rooms : allRooms

  // Calculate nights and estimate total
  const checkInDate = form.watch('check_in_date')
  const checkOutDate = form.watch('check_out_date')
  const selectedRoomId = form.watch('room_id')
  const selectedRoom = roomsData?.find(r => r.id === selectedRoomId)
  
  const nights = checkInDate && checkOutDate ? 
    Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))) : 0
  
  const estimatedTotal = selectedRoom && nights ? selectedRoom.base_rate * nights : 0

  // Auto-calculate total when room or dates change
  useEffect(() => {
    if (estimatedTotal > 0 && !isEditing) {
      form.setValue('total_amount', estimatedTotal)
      setTotalAmountInput(formatIDR(estimatedTotal))
    }
  }, [estimatedTotal, isEditing, form])

  const onSubmit = async (data: ReservationFormData) => {
    try {
      logger.info(`${isEditing ? 'Updating' : 'Creating'} reservation`, { 
        reservationId: reservation?.id,
        guestId: data.guest_id,
        roomId: data.room_id,
        paymentStatus: data.payment_status
      })

      // Extract payment status and remove it from reservation data
      const { payment_status, ...reservationData } = data

      const formattedData = {
        ...reservationData,
        property_id: '00000000-0000-0000-0000-000000000000', // Default property ID for single property setup
        confirmation_number: reservationData.confirmation_number || 
          `RES${Date.now().toString().slice(-6)}`,
        special_requests: reservationData.special_requests || null,
        notes: reservationData.notes || null,
        check_in_time: reservationData.check_in_time || '14:00',
        check_out_time: reservationData.check_out_time || '12:00',
      }

      if (isEditing) {
        await updateReservation.mutateAsync({
          id: reservation.id,
          updates: formattedData
        })
        logger.info('Reservation updated successfully', { reservationId: reservation.id })
        toast.success('Reservasi berhasil diperbarui')
      } else {
        // Use the appropriate hook based on payment status
        if (payment_status && payment_status !== 'unpaid') {
          await createReservationWithPayment.mutateAsync({
            reservation: {
              ...formattedData,
              rate_per_night: selectedRoom?.base_rate || 0
            },
            paymentStatus: payment_status
          })
          logger.info('Reservation with payment created successfully', { paymentStatus: payment_status })
          toast.success(`Reservasi berhasil dibuat${payment_status === 'paid' ? ' dengan pembayaran lunas' : payment_status === 'partial' ? ' dengan pembayaran sebagian' : ''}`)
        } else {
          await createReservation.mutateAsync({
            ...formattedData,
            rate_per_night: selectedRoom?.base_rate || 0
          })
          logger.info('Reservation created successfully')
          toast.success('Reservasi berhasil dibuat')
        }
      }

      onOpenChange(false)
      form.reset()
      setTotalAmountInput('')
      setCurrentTab('guest')
      onSuccess?.()
    } catch (error) {
      logger.error(`Failed to ${isEditing ? 'update' : 'create'} reservation`, error)
      toast.error(`Gagal ${isEditing ? 'memperbarui' : 'membuat'} reservasi: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setTotalAmountInput('')
    setCurrentTab('guest')
    setShowGuestForm(false)
    setNewGuestData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      identification_number: ''
    })
  }

  const handleCreateGuest = async () => {
    try {
      if (!newGuestData.first_name || !newGuestData.last_name) {
        toast.error('Nama depan dan nama belakang harus diisi')
        return
      }

      const newGuest = await createGuest.mutateAsync({
        ...newGuestData
      })

      // Auto-select the newly created guest
      form.setValue('guest_id', newGuest.id)
      setShowGuestForm(false)
      setNewGuestData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        identification_number: ''
      })
      toast.success('Tamu baru berhasil ditambahkan')
    } catch (error) {
      toast.error(`Gagal membuat tamu baru: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  const handleTotalAmountChange = (value: string) => {
    setTotalAmountInput(value)
    const numericValue = parseIDR(value)
    form.setValue('total_amount', numericValue)
  }

  const selectedGuest = guests?.find(g => g.id === form.watch('guest_id'))

  const isLoading = createReservation.isPending || createReservationWithPayment.isPending || updateReservation.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isEditing ? 'Edit Reservasi' : 'Buat Reservasi Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi reservasi yang sudah ada'
              : 'Buat reservasi baru untuk tamu'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Tamu
                </TabsTrigger>
                <TabsTrigger value="room" className="flex items-center gap-2">
                  <Bed className="w-4 h-4" />
                  Kamar & Tanggal
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Detail Menginap
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pembayaran
                </TabsTrigger>
              </TabsList>

              {/* Guest Selection Tab */}
              <TabsContent value="guest" className="space-y-4 max-h-96 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="guest_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Tamu *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tamu yang sudah terdaftar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {guests && guests.length > 0 ? (
                            guests.map(guest => (
                              <SelectItem key={guest.id} value={guest.id}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {guest.first_name} {guest.last_name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-3">
                                      {guest.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {guest.email}
                                        </span>
                                      )}
                                      {guest.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {guest.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="flex items-center justify-center p-4">
                              <div className="text-sm text-gray-500">Belum ada tamu terdaftar</div>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between">
                        <FormDescription>
                          Pilih tamu yang sudah terdaftar
                        </FormDescription>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowGuestForm(true)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Tambah Tamu Baru
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Guest Creation Form */}
                {showGuestForm && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Tambah Tamu Baru
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowGuestForm(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="first_name" className="text-sm font-medium">
                            Nama Depan *
                          </Label>
                          <Input
                            id="first_name"
                            value={newGuestData.first_name}
                            onChange={(e) => setNewGuestData({ ...newGuestData, first_name: e.target.value })}
                            placeholder="Nama depan"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name" className="text-sm font-medium">
                            Nama Belakang *
                          </Label>
                          <Input
                            id="last_name"
                            value={newGuestData.last_name}
                            onChange={(e) => setNewGuestData({ ...newGuestData, last_name: e.target.value })}
                            placeholder="Nama belakang"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={newGuestData.email}
                            onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                            placeholder="email@example.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Nomor Telepon
                          </Label>
                          <Input
                            id="phone"
                            value={newGuestData.phone}
                            onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                            placeholder="08xx-xxxx-xxxx"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="identification_number" className="text-sm font-medium">
                          Nomor KTP
                        </Label>
                        <Input
                          id="identification_number"
                          value={newGuestData.identification_number}
                          onChange={(e) => setNewGuestData({ ...newGuestData, identification_number: e.target.value })}
                          placeholder="Nomor KTP"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          onClick={handleCreateGuest}
                          disabled={createGuest.isPending || !newGuestData.first_name || !newGuestData.last_name}
                          className="flex-1"
                        >
                          {createGuest.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Simpan Tamu
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowGuestForm(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Selected Guest Info */}
                {selectedGuest && !showGuestForm && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {selectedGuest.first_name} {selectedGuest.last_name}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {selectedGuest.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {selectedGuest.email}
                              </div>
                            )}
                            {selectedGuest.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {selectedGuest.phone}
                              </div>
                            )}
                            {selectedGuest.identification_number && (
                              <div className="text-xs text-gray-500">
                                KTP: {selectedGuest.identification_number}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedGuest.vip_status && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            VIP
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Room & Dates Tab */}
              <TabsContent value="room" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check_in_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Check-in *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check_out_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Check-out *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check_in_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu Check-in</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>Standar: 14:00 WIB</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check_out_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu Check-out</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>Standar: 12:00 WIB</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {nights > 0 && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{nights} malam</strong> menginap dari {checkInDate} sampai {checkOutDate}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Kamar *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kamar yang tersedia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomsData && roomsData.length > 0 ? (
                            roomsData.map(room => (
                              <SelectItem key={room.id} value={room.id}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Bed className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {room.room_number} - {room.room_type}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-4">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {room.capacity} tamu
                                      </span>
                                      <span className="text-green-600 font-medium">
                                        {formatIDR(room.base_rate)}/malam
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              <div className="flex items-center gap-2 text-gray-500">
                                <AlertCircle className="w-4 h-4" />
                                Tidak ada kamar tersedia
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {roomsData ? `${roomsData.length} kamar tersedia` : 'Memuat data kamar...'}
                        {rooms && allRooms && rooms.length === 0 && allRooms.length > 0 && 
                          ' (menampilkan semua kamar karena properti belum dipilih)'
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selected Room Info */}
                {selectedRoom && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Bed className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              Kamar {selectedRoom.room_number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedRoom.room_type} • Kapasitas {selectedRoom.capacity} tamu
                            </p>
                            <p className="text-sm text-green-600 font-medium">
                              {formatIDR(selectedRoom.base_rate)} per malam
                            </p>
                          </div>
                        </div>
                        {estimatedTotal > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Estimasi Total</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatIDR(estimatedTotal)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {nights} malam × {formatIDR(selectedRoom.base_rate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Tamu Dewasa *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="children"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Anak-anak</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Usia di bawah 12 tahun</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Reservasi *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESERVATION_STATUSES.map(status => (
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

                <FormField
                  control={form.control}
                  name="confirmation_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Konfirmasi</FormLabel>
                      <FormControl>
                        <Input placeholder="RES123456 (otomatis dibuat jika kosong)" {...field} />
                      </FormControl>
                      <FormDescription>Nomor unik untuk identifikasi reservasi</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="special_requests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permintaan Khusus</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Contoh: Kamar lantai atas, kasur tambahan untuk anak, dll..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Permintaan atau preferensi tamu</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Internal</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Catatan internal untuk staff hotel..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Catatan ini tidak terlihat oleh tamu</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Total Pembayaran *</Label>
                  <div className="relative">
                    <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rp 500,000"
                      value={totalAmountInput}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {form.formState.errors.total_amount && (
                    <p className="text-sm text-red-500">{form.formState.errors.total_amount.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Total biaya menginap termasuk pajak dan layanan
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Pembayaran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status pembayaran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">
                            <Badge className="bg-red-100 text-red-800">
                              Belum Bayar
                            </Badge>
                          </SelectItem>
                          <SelectItem value="partial">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Bayar Sebagian
                            </Badge>
                          </SelectItem>
                          <SelectItem value="paid">
                            <Badge className="bg-green-100 text-green-800">
                              Lunas
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {estimatedTotal > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Rincian Biaya</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tarif kamar ({nights} malam)</span>
                        <span>{formatIDR(selectedRoom?.base_rate * nights || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pajak & Layanan (11%)</span>
                        <span>{formatIDR(Math.round((selectedRoom?.base_rate * nights || 0) * 0.11))}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-600">
                          {formatIDR(Math.round((selectedRoom?.base_rate * nights || 0) * 1.11))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditing ? 'Menyimpan...' : 'Membuat...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Simpan Perubahan' : 'Buat Reservasi'}
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