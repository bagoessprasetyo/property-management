'use client'

import { useState, useEffect, useMemo, memo, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
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
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Shield
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

export const GuestForm = memo(function GuestForm({ guest, open, onOpenChange, onSuccess }: GuestFormProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const [formProgress, setFormProgress] = useState(0)
  const [savedData, setSavedData] = useState<Partial<GuestFormData>>({})
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

  // Watch form values for progress calculation
  const watchedValues = form.watch()

  // Calculate form completion progress
  const progress = useMemo(() => {
    const requiredFields = ['first_name', 'last_name', 'phone', 'identification_type', 'identification_number', 'nationality']
    const optionalFields = ['email', 'date_of_birth', 'gender', 'address', 'city', 'state', 'country', 'postal_code', 'emergency_contact_name', 'emergency_contact_phone']
    
    const completedRequired = requiredFields.filter(field => {
      const value = watchedValues[field as keyof GuestFormData]
      return value && value.toString().trim() !== ''
    }).length
    
    const completedOptional = optionalFields.filter(field => {
      const value = watchedValues[field as keyof GuestFormData]
      return value && value.toString().trim() !== ''
    }).length
    
    // Required fields count as 70%, optional as 30%
    const requiredPercentage = (completedRequired / requiredFields.length) * 70
    const optionalPercentage = (completedOptional / optionalFields.length) * 30
    
    return Math.round(requiredPercentage + optionalPercentage)
  }, [watchedValues])

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress > 0 && !isEditing) {
        setSavedData(watchedValues)
        localStorage.setItem('guest_form_draft', JSON.stringify(watchedValues))
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [watchedValues, progress, isEditing])

  // Load saved draft on mount
  useEffect(() => {
    if (!guest && open) {
      const savedDraft = localStorage.getItem('guest_form_draft')
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          Object.keys(parsed).forEach(key => {
            if (parsed[key]) {
              form.setValue(key as keyof GuestFormData, parsed[key])
            }
          })
        } catch (error) {
          console.error('Failed to load saved draft:', error)
        }
      }
    }
  }, [guest, open, form])

  // Tab completion status
  const tabStatus = useMemo(() => {
    const basic = form.getValues(['first_name', 'last_name', 'identification_type', 'identification_number', 'nationality'])
    const contact = form.getValues(['phone'])
    const preferences = true // Always considered complete as all fields are optional
    
    return {
      basic: basic.every(val => val && val.toString().trim() !== ''),
      contact: contact.every(val => val && val.toString().trim() !== ''),
      preferences
    }
  }, [watchedValues])

  const onSubmit = useCallback(async (data: GuestFormData) => {
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
  }, [guest, isEditing, createGuest, updateGuest, onOpenChange, onSuccess, form])

  const handleClose = useCallback(() => {
    // Clear saved draft when closing
    if (!isEditing) {
      localStorage.removeItem('guest_form_draft')
    }
    onOpenChange(false)
    form.reset()
    setCurrentTab('basic')
    setFormProgress(0)
  }, [isEditing, onOpenChange, form])

  const navigateToTab = useCallback((direction: 'next' | 'prev') => {
    const tabs = ['basic', 'contact', 'preferences']
    const currentIndex = tabs.indexOf(currentTab)
    
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1])
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1])
    }
  }, [currentTab])

  const TabIcon = ({ tabName, completed }: { tabName: string; completed: boolean }) => {
    const icons = {
      basic: User,
      contact: Phone,
      preferences: Heart
    }
    const Icon = icons[tabName as keyof typeof icons] || User
    
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 transition-colors ${
        completed ? 'bg-green-500 text-white' : currentTab === tabName ? 'bg-warm-brown-600 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
      </div>
    )
  }

  const isLoading = createGuest.isPending || updateGuest.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-warm-brown-50 to-amber-50 p-6 -m-6 mb-6 border-b border-warm-brown-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warm-brown-100/20 via-transparent to-transparent" />
          <div className="relative">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-warm-brown-600 to-warm-brown-700 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <span>{isEditing ? 'Edit Tamu' : 'Tambah Tamu Baru'}</span>
                {!isEditing && progress > 0 && (
                  <Badge className="ml-3 bg-green-100 text-green-800">
                    Draft tersimpan
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="mt-3 text-warm-brown-700">
              {isEditing 
                ? 'Perbarui informasi tamu yang sudah ada'
                : 'Masukkan informasi tamu baru dengan lengkap untuk mendapatkan pengalaman terbaik'
              }
            </DialogDescription>
            
            {/* Progress Bar */}
            {!isEditing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-brown-600 font-medium">Progress Pengisian</span>
                  <span className="text-warm-brown-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-gray-50">
                <TabsTrigger 
                  value="basic" 
                  className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <TabIcon tabName="basic" completed={tabStatus.basic} />
                  <div className="text-left">
                    <div className="font-medium">Informasi Dasar</div>
                    <div className="text-xs text-gray-500">Data identitas</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <TabIcon tabName="contact" completed={tabStatus.contact} />
                  <div className="text-left">
                    <div className="font-medium">Kontak & Alamat</div>
                    <div className="text-xs text-gray-500">Informasi kontak</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <TabIcon tabName="preferences" completed={tabStatus.preferences} />
                  <div className="text-left">
                    <div className="font-medium">Preferensi</div>
                    <div className="text-xs text-gray-500">Kebutuhan khusus</div>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>
                    <p className="text-sm text-gray-600">Data identitas dan informasi pribadi tamu</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          Nama Depan *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan nama depan"
                            className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          Nama Belakang *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan nama belakang"
                            className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="identification_type"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <CreditCard className="w-4 h-4" />
                          Tipe Identitas *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                              <SelectValue placeholder="Pilih tipe identitas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="KTP">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">KTP</div>
                                  <div className="text-xs text-gray-500">Kartu Tanda Penduduk</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="Passport">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="font-medium">Passport</div>
                                  <div className="text-xs text-gray-500">Paspor</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="SIM">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-purple-600" />
                                <div>
                                  <div className="font-medium">SIM</div>
                                  <div className="text-xs text-gray-500">Surat Izin Mengemudi</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="Other">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <div>
                                  <div className="font-medium">Lainnya</div>
                                  <div className="text-xs text-gray-500">Identitas lain</div>
                                </div>
                              </div>
                            </SelectItem>
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
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <CreditCard className="w-4 h-4" />
                          Nomor Identitas *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch('identification_type') === 'KTP' ? '16 digit KTP' : 'Nomor identitas'}
                            className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        {form.watch('identification_type') === 'KTP' && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <AlertCircle className="w-3 h-3" />
                            <span>Format KTP: 16 digit angka</span>
                          </div>
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
              <TabsContent value="contact" className="space-y-6 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kontak & Alamat</h3>
                    <p className="text-sm text-gray-600">Informasi kontak dan alamat lengkap tamu</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Informasi Kontak
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                            <Mail className="w-4 h-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@contoh.com"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                            <Phone className="w-4 h-4" />
                            Nomor Telepon *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="08123456789 atau +6281234567890"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
              <TabsContent value="preferences" className="space-y-6 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Preferensi & Catatan</h3>
                    <p className="text-sm text-gray-600">Kebutuhan khusus dan catatan tambahan</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="dietary_restrictions"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Heart className="w-4 h-4" />
                          Pantangan Makanan
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: Vegetarian, halal, alergi seafood, tidak makan daging sapi..."
                            className="min-h-24 bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Informasi ini membantu kami menyediakan layanan makanan yang sesuai</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="special_requests"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Settings className="w-4 h-4" />
                          Permintaan Khusus
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: Kamar lantai atas, tempat tidur tambahan, late check-in, welcome drink..."
                            className="min-h-24 bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Kami akan berusaha memenuhi permintaan sesuai ketersediaan</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <FileText className="w-4 h-4" />
                          Catatan Internal
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Catatan internal untuk staff hotel tentang tamu ini..."
                            className="min-h-24 bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Catatan ini hanya untuk internal hotel dan tidak akan diberitahukan kepada tamu</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Info Cards */}
                  <div className="space-y-3">
                    {form.watch('identification_type') === 'KTP' && form.watch('nationality') === 'Indonesia' && (
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500 rounded-full">
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-sm text-blue-800">
                              <p className="font-semibold mb-1">Tamu Indonesia</p>
                              <p>Pastikan nomor KTP valid (16 digit) untuk keperluan pelaporan ke pemerintah sesuai regulasi.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-sm text-green-800">
                            <p className="font-semibold mb-1">Tips untuk Form yang Baik</p>
                            <p>Semakin lengkap informasi yang diberikan, semakin personal layanan yang dapat kami berikan.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-3 pt-6 border-t border-gray-200">
              {/* Navigation Buttons */}
              <div className="flex justify-between w-full">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigateToTab('prev')}
                    disabled={currentTab === 'basic'}
                    className="min-w-24"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </Button>
                  
                  {currentTab !== 'preferences' && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigateToTab('next')}
                      className="min-w-24"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || (!tabStatus.basic || !tabStatus.contact)} 
                    className="bg-gradient-to-r from-warm-brown-600 to-warm-brown-700 hover:from-warm-brown-700 hover:to-warm-brown-800 shadow-lg min-w-32"
                  >
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
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
})