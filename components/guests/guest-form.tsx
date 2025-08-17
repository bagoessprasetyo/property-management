'use client'

import { useState } from 'react'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateGuest, useUpdateGuest } from '@/lib/hooks/use-guests'
import { validateKTP, formatIndonesianPhone } from '@/lib/data/indonesian-hotel-data'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  Globe,
  Settings,
  Save,
  X,
  Plus,
  AlertCircle
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// Indonesian provinces for dropdown
const INDONESIAN_PROVINCES = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta',
  'Banten', 'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan',
  'Lampung', 'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan',
  'Kalimantan Timur', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan',
  'Maluku', 'Papua', 'Aceh', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu',
  'Bangka Belitung', 'Kalimantan Utara', 'Sulawesi Tenggara', 'Gorontalo',
  'Sulawesi Barat', 'Maluku Utara', 'Papua Barat', 'Papua Tengah', 'Papua Pegunungan', 'Papua Selatan'
]

// Form validation schema with Indonesian context
const guestFormSchema = z.object({
  first_name: z.string().min(1, 'Nama depan wajib diisi').max(50, 'Nama depan maksimal 50 karakter'),
  last_name: z.string().min(1, 'Nama belakang wajib diisi').max(50, 'Nama belakang maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  identification_type: z.enum(['KTP', 'Passport', 'SIM', 'Other']).describe('Tipe identitas wajib dipilih'),
  identification_number: z.string().min(1, 'Nomor identitas wajib diisi'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Indonesia'),
  postal_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate KTP format for Indonesian guests
  if (data.identification_type === 'KTP' && data.nationality === 'Indonesia') {
    return validateKTP(data.identification_number)
  }
  return true
}, {
  message: 'Format KTP tidak valid (harus 16 digit)',
  path: ['identification_number']
}).refine((data) => {
  // Validate Indonesian phone number
  if (data.phone) {
    const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/
    return phoneRegex.test(data.phone.replace(/\s+/g, ''))
  }
  return true
}, {
  message: 'Format nomor telepon Indonesia tidak valid',
  path: ['phone']
})

type GuestFormData = z.infer<typeof guestFormSchema>

interface GuestFormProps {
  guest?: any // Existing guest for editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GuestForm({ guest, open, onOpenChange, onSuccess }: GuestFormProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const isEditing = !!guest

  const createGuest = useCreateGuest()
  const updateGuest = useUpdateGuest()

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema) as Resolver<GuestFormData>,
    defaultValues: {
      first_name: guest?.first_name || '',
      last_name: guest?.last_name || '',
      email: guest?.email || '',
      phone: guest?.phone || '',
      identification_type: guest?.identification_type || 'KTP',
      identification_number: guest?.identification_number || '',
      nationality: guest?.nationality || 'Indonesia',
      date_of_birth: guest?.date_of_birth || '',
      gender: guest?.gender || undefined,
      address: guest?.address || '',
      city: guest?.city || '',
      state: guest?.state || '',
      country: guest?.country || 'Indonesia',
      postal_code: guest?.postal_code || '',
      emergency_contact_name: guest?.emergency_contact_name || '',
      emergency_contact_phone: guest?.emergency_contact_phone || '',
      dietary_restrictions: guest?.dietary_restrictions || '',
      special_requests: guest?.special_requests || '',
      notes: guest?.notes || '',
    },
  })

  const onSubmit = async (data: GuestFormData) => {
    try {
      logger.info(`${isEditing ? 'Updating' : 'Creating'} guest`, { 
        guestId: guest?.id,
        nationality: data.nationality 
      })

      // Format phone number
      const formattedData = {
        ...data,
        phone: formatIndonesianPhone(data.phone),
        // Convert empty strings to null for optional fields
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postal_code || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        dietary_restrictions: data.dietary_restrictions || null,
        special_requests: data.special_requests || null,
        notes: data.notes || null,
      }

      if (isEditing) {
        await updateGuest.mutateAsync({
          id: guest.id,
          updates: formattedData
        })
        logger.info('Guest updated successfully', { guestId: guest.id })
      } else {
        await createGuest.mutateAsync(formattedData)
        logger.info('Guest created successfully')
      }

      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      logger.error(`Failed to ${isEditing ? 'update' : 'create'} guest`, error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setCurrentTab('basic')
  }

  const isLoading = createGuest.isPending || updateGuest.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {isEditing ? 'Edit Tamu' : 'Tambah Tamu Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi tamu yang sudah ada'
              : 'Masukkan informasi tamu baru dengan lengkap'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                <TabsTrigger value="contact">Kontak & Alamat</TabsTrigger>
                <TabsTrigger value="preferences">Preferensi</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Depan *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama depan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Belakang *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama belakang" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="identification_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Identitas *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe identitas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="KTP">KTP</SelectItem>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="SIM">SIM</SelectItem>
                            <SelectItem value="Other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="identification_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Identitas *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch('identification_type') === 'KTP' ? '16 digit KTP' : 'Nomor identitas'} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        {form.watch('identification_type') === 'KTP' && (
                          <p className="text-xs text-gray-500">Format KTP: 16 digit angka</p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kewarganegaraan *</FormLabel>
                        <FormControl>
                          <Input placeholder="Indonesia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kelamin</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Laki-laki</SelectItem>
                          <SelectItem value="female">Perempuan</SelectItem>
                          <SelectItem value="other">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Contact & Address Tab */}
              <TabsContent value="contact" className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@contoh.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Telepon *</FormLabel>
                        <FormControl>
                          <Input placeholder="08123456789 atau +6281234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Alamat lengkap..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kota</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama kota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provinsi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih provinsi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDONESIAN_PROVINCES.map(province => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negara</FormLabel>
                        <FormControl>
                          <Input placeholder="Indonesia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Pos</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700">Kontak Darurat</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Kontak Darurat</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama keluarga/teman" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telepon Kontak Darurat</FormLabel>
                          <FormControl>
                            <Input placeholder="08123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4 max-h-96 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="dietary_restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pantangan Makanan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Vegetarian, halal, alergi seafood, dll..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
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
                          placeholder="Kamar lantai atas, tempat tidur tambahan, dll..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Tambahan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Catatan internal tentang tamu..."
                          className="min-h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('identification_type') === 'KTP' && form.watch('nationality') === 'Indonesia' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Tamu Indonesia</p>
                          <p>Pastikan nomor KTP valid (16 digit) untuk keperluan pelaporan ke pemerintah.</p>
                        </div>
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
                    {isEditing ? 'Simpan Perubahan' : 'Buat Tamu'}
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