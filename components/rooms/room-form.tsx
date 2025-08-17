'use client'

import { useState } from 'react'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProperty } from '@/lib/context/property-context'
import { useCreateRoom, useUpdateRoom } from '@/lib/hooks/use-rooms'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Bed, 
  DollarSign, 
  Building,
  Users, 
  Save,
  X,
  Wifi,
  Coffee,
  Car,
  Bath,
  Wind,
  Tv,
  Phone,
  Refrigerator,
  Settings
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// Room amenities for Indonesian hotels
const ROOM_AMENITIES = [
  { id: 'wifi', label: 'WiFi Gratis', icon: Wifi },
  { id: 'ac', label: 'AC', icon: Wind },
  { id: 'tv', label: 'TV LED', icon: Tv },
  { id: 'minibar', label: 'Minibar', icon: Refrigerator },
  { id: 'coffee', label: 'Coffee/Tea Maker', icon: Coffee },
  { id: 'bathroom', label: 'Kamar Mandi Dalam', icon: Bath },
  { id: 'phone', label: 'Telepon', icon: Phone },
  { id: 'parking', label: 'Parkir', icon: Car },
]

// Common room types in Indonesian hotels
const ROOM_TYPES = [
  'Superior', 'Deluxe', 'Executive', 'Suite', 'Family Room', 
  'Standard', 'Economy', 'Presidential Suite', 'Junior Suite'
]

// Form validation schema
const roomFormSchema = z.object({
  room_number: z.string().min(1, 'Nomor kamar wajib diisi').max(10, 'Nomor kamar maksimal 10 karakter'),
  room_type: z.string().min(1, 'Tipe kamar wajib dipilih'),
  capacity: z.number().min(1, 'Kapasitas minimal 1 orang').max(10, 'Kapasitas maksimal 10 orang'),
  base_rate: z.number().min(0, 'Tarif tidak boleh negatif'),
  floor: z.number().min(1, 'Lantai minimal 1').max(50, 'Lantai maksimal 50').optional().nullable(),
  size_sqm: z.number().min(1, 'Luas kamar minimal 1 m²').max(500, 'Luas kamar maksimal 500 m²').optional().nullable(),
  bed_type: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  is_smoking_allowed: z.boolean().default(false),
  max_extra_beds: z.number().min(0, 'Tempat tidur tambahan tidak boleh negatif').max(5, 'Maksimal 5 tempat tidur tambahan').optional().nullable(),
  cleaning_fee: z.number().min(0, 'Biaya kebersihan tidak boleh negatif').optional().nullable(),
  notes: z.string().optional(),
})

type RoomFormData = z.infer<typeof roomFormSchema>

interface RoomFormProps {
  room?: any // Existing room for editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RoomForm({ room, open, onOpenChange, onSuccess }: RoomFormProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const isEditing = !!room
  const { currentProperty } = useProperty()

  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema) as Resolver<RoomFormData>,
    defaultValues: {
      room_number: room?.room_number || '',
      room_type: room?.room_type || '',
      capacity: room?.capacity || 2,
      base_rate: room?.base_rate || 0,
      floor: room?.floor || null,
      size_sqm: room?.size_sqm || null,
      bed_type: room?.bed_type || '',
      description: room?.description || '',
      amenities: room?.amenities || [],
      is_active: room?.is_active ?? true,
      is_smoking_allowed: room?.is_smoking_allowed ?? false,
      max_extra_beds: room?.max_extra_beds || null,
      cleaning_fee: room?.cleaning_fee || null,
      notes: room?.notes || '',
    },
  })

  const [baseRateInput, setBaseRateInput] = useState(
    room?.base_rate ? formatIDR(room.base_rate) : ''
  )
  const [cleaningFeeInput, setCleaningFeeInput] = useState(
    room?.cleaning_fee ? formatIDR(room.cleaning_fee) : ''
  )

  const onSubmit = async (data: RoomFormData) => {
    try {
      if (!currentProperty?.id) {
        throw new Error('No property selected')
      }

      logger.info(`${isEditing ? 'Updating' : 'Creating'} room`, { 
        roomId: room?.id,
        roomNumber: data.room_number,
        propertyId: currentProperty.id
      })

      const formattedData = {
        ...data,
        property_id: currentProperty.id,
        status: 'clean' as const, // Default status for new rooms
        // Convert null values appropriately
        floor: data.floor || null,
        size_sqm: data.size_sqm || null,
        max_extra_beds: data.max_extra_beds || null,
        cleaning_fee: data.cleaning_fee || null,
        description: data.description || null,
        bed_type: data.bed_type || null,
        notes: data.notes || null,
      }

      if (isEditing) {
        await updateRoom.mutateAsync({
          id: room.id,
          updates: formattedData
        })
        logger.info('Room updated successfully', { roomId: room.id })
      } else {
        await createRoom.mutateAsync(formattedData)
        logger.info('Room created successfully')
      }

      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      logger.error(`Failed to ${isEditing ? 'update' : 'create'} room`, error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setCurrentTab('basic')
    setBaseRateInput('')
    setCleaningFeeInput('')
  }

  const handleBaseRateChange = (value: string) => {
    setBaseRateInput(value)
    const numericValue = parseIDR(value)
    form.setValue('base_rate', numericValue)
  }

  const handleCleaningFeeChange = (value: string) => {
    setCleaningFeeInput(value)
    const numericValue = parseIDR(value)
    form.setValue('cleaning_fee', numericValue)
  }

  const toggleAmenity = (amenityId: string) => {
    const currentAmenities = form.getValues('amenities')
    const updatedAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(id => id !== amenityId)
      : [...currentAmenities, amenityId]
    
    form.setValue('amenities', updatedAmenities)
  }

  const isLoading = createRoom.isPending || updateRoom.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            {isEditing ? 'Edit Kamar' : 'Tambah Kamar Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi kamar yang sudah ada'
              : 'Buat kamar baru dengan konfigurasi lengkap'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                <TabsTrigger value="amenities">Fasilitas</TabsTrigger>
                <TabsTrigger value="settings">Pengaturan</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="room_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Kamar *</FormLabel>
                        <FormControl>
                          <Input placeholder="101, A1, Suite-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Kamar *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe kamar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROOM_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kapasitas *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Jumlah tamu maksimal</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lantai</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Luas (m²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="25"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tarif Dasar per Malam *</Label>
                    <Input
                      placeholder="Rp 500,000"
                      value={baseRateInput}
                      onChange={(e) => handleBaseRateChange(e.target.value)}
                    />
                    {form.formState.errors.base_rate && (
                      <p className="text-sm text-red-500">{form.formState.errors.base_rate.message}</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="bed_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Tempat Tidur</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe kasur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single Bed</SelectItem>
                            <SelectItem value="twin">Twin Beds</SelectItem>
                            <SelectItem value="double">Double Bed</SelectItem>
                            <SelectItem value="queen">Queen Bed</SelectItem>
                            <SelectItem value="king">King Bed</SelectItem>
                            <SelectItem value="sofa_bed">Sofa Bed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Kamar</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Deskripsi singkat tentang kamar..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Amenities Tab */}
              <TabsContent value="amenities" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Fasilitas Kamar</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {ROOM_AMENITIES.map((amenity) => {
                        const Icon = amenity.icon
                        const isSelected = form.watch('amenities').includes(amenity.id)
                        
                        return (
                          <Card 
                            key={amenity.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-warm-brown-600 bg-warm-brown-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleAmenity(amenity.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${
                                  isSelected ? 'text-warm-brown-600' : 'text-gray-400'
                                }`} />
                                <span className={`text-sm ${
                                  isSelected ? 'text-warm-brown-900 font-medium' : 'text-gray-700'
                                }`}>
                                  {amenity.label}
                                </span>
                                {isSelected && (
                                  <Badge className="ml-auto bg-warm-brown-600">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="max_extra_beds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempat Tidur Tambahan</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormDescription>Maksimal tempat tidur tambahan</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Biaya Kebersihan</Label>
                      <Input
                        placeholder="Rp 50,000"
                        value={cleaningFeeInput}
                        onChange={(e) => handleCleaningFeeChange(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Biaya tambahan untuk layanan kebersihan khusus</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Kamar Aktif</FormLabel>
                      <FormDescription>
                        Kamar yang tidak aktif tidak akan tersedia untuk reservasi
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Kamar Merokok</FormLabel>
                      <FormDescription>
                        Izinkan tamu merokok di dalam kamar
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_smoking_allowed"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Internal</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Catatan khusus untuk kamar ini..."
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Catatan ini hanya terlihat oleh staff dan tidak ditampilkan ke tamu
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    {isEditing ? 'Simpan Perubahan' : 'Buat Kamar'}
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