'use client'

import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Removed property context for single property setup
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
import { Progress } from '@/components/ui/progress'
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
  Settings,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Shield,
  AlertCircle
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

export const RoomForm = memo(function RoomForm({ room, open, onOpenChange, onSuccess }: RoomFormProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const [formProgress, setFormProgress] = useState(0)
  const [savedData, setSavedData] = useState<Partial<RoomFormData>>({})
  const isEditing = !!room
  // Removed currentProperty for single property setup

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

  // Watch form values for progress calculation
  const watchedValues = form.watch()

  // Calculate form completion progress
  const progress = useMemo(() => {
    const requiredFields = ['room_number', 'room_type', 'capacity', 'base_rate']
    const optionalFields = ['floor', 'size_sqm', 'bed_type', 'description', 'max_extra_beds', 'cleaning_fee', 'notes']
    
    const completedRequired = requiredFields.filter(field => {
      const value = watchedValues[field as keyof RoomFormData]
      return value !== null && value !== undefined && value !== '' && value !== 0
    }).length
    
    const completedOptional = optionalFields.filter(field => {
      const value = watchedValues[field as keyof RoomFormData]
      return value !== null && value !== undefined && value !== ''
    }).length
    
    const amenitiesCount = (watchedValues.amenities?.length || 0) > 0 ? 1 : 0
    
    // Required fields count as 60%, optional as 30%, amenities as 10%
    const requiredPercentage = (completedRequired / requiredFields.length) * 60
    const optionalPercentage = (completedOptional / optionalFields.length) * 30
    const amenitiesPercentage = amenitiesCount * 10
    
    return Math.round(requiredPercentage + optionalPercentage + amenitiesPercentage)
  }, [watchedValues])

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress > 0 && !isEditing) {
        setSavedData(watchedValues)
        localStorage.setItem('room_form_draft', JSON.stringify(watchedValues))
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [watchedValues, progress, isEditing])

  // Load saved draft on mount
  useEffect(() => {
    if (!room && open) {
      const savedDraft = localStorage.getItem('room_form_draft')
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          Object.keys(parsed).forEach(key => {
            if (parsed[key] !== null && parsed[key] !== undefined && parsed[key] !== '') {
              form.setValue(key as keyof RoomFormData, parsed[key])
            }
          })
        } catch (error) {
          console.error('Failed to load saved draft:', error)
        }
      }
    }
  }, [room, open, form])

  // Tab completion status
  const tabStatus = useMemo(() => {
    const basic = form.getValues(['room_number', 'room_type', 'capacity', 'base_rate'])
    const amenities = (form.getValues('amenities')?.length || 0) > 0
    const settings = true // Always considered complete as all fields are optional
    
    return {
      basic: basic.every(val => val !== null && val !== undefined && val !== '' && val !== 0),
      amenities,
      settings
    }
  }, [watchedValues])

  const [baseRateInput, setBaseRateInput] = useState(
    room?.base_rate ? formatIDR(room.base_rate) : ''
  )
  const [cleaningFeeInput, setCleaningFeeInput] = useState(
    room?.cleaning_fee ? formatIDR(room.cleaning_fee) : ''
  )

  const onSubmit = useCallback(async (data: RoomFormData) => {
    try {
      // Removed property validation for single property setup

      logger.info(`${isEditing ? 'Updating' : 'Creating'} room`, { 
        roomId: room?.id,
        roomNumber: data.room_number
      })

      const formattedData = {
        ...data,
        property_id: '00000000-0000-0000-0000-000000000000', // Default property ID for single property setup
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
  }, [isEditing, room, createRoom, updateRoom, onOpenChange, form, onSuccess])

  const handleClose = useCallback(() => {
    // Clear saved draft when closing
    if (!isEditing) {
      localStorage.removeItem('room_form_draft')
    }
    onOpenChange(false)
    form.reset()
    setCurrentTab('basic')
    setBaseRateInput('')
    setCleaningFeeInput('')
    setFormProgress(0)
  }, [isEditing, onOpenChange, form])

  const navigateToTab = useCallback((direction: 'next' | 'prev') => {
    const tabs = ['basic', 'amenities', 'settings']
    const currentIndex = tabs.indexOf(currentTab)
    
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1])
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1])
    }
  }, [currentTab])

  const TabIcon = ({ tabName, completed }: { tabName: string; completed: boolean }) => {
    const icons = {
      basic: Home,
      amenities: Sparkles,
      settings: Settings
    }
    const Icon = icons[tabName as keyof typeof icons] || Home
    
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 transition-colors ${
        completed ? 'bg-green-500 text-white' : currentTab === tabName ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
      </div>
    )
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
      <DialogContent className="bg-white max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-50 to-amber-50 p-6 -m-6 mb-6 border-b border-blue-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />
          <div className="relative">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Bed className="w-6 h-6 text-white" />
              </div>
              <div>
                <span>{isEditing ? 'Edit Kamar' : 'Tambah Kamar Baru'}</span>
                {!isEditing && progress > 0 && (
                  <Badge className="ml-3 bg-green-100 text-green-800">
                    Draft tersimpan
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="mt-3 text-warm-blue-400">
              {isEditing 
                ? 'Perbarui informasi kamar yang sudah ada'
                : 'Konfigurasikan kamar baru dengan fasilitas dan pengaturan lengkap'
              }
            </DialogDescription>
            
            {/* Progress Bar */}
            {!isEditing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 font-medium">Progress Konfigurasi</span>
                  <span className="text-blue-400">{progress}%</span>
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
                    <div className="text-xs text-gray-500">Kamar & tarif</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="amenities" 
                  className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <TabIcon tabName="amenities" completed={tabStatus.amenities} />
                  <div className="text-left">
                    <div className="font-medium">Fasilitas</div>
                    <div className="text-xs text-gray-500">Amenitas & layanan</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <TabIcon tabName="settings" completed={tabStatus.settings} />
                  <div className="text-left">
                    <div className="font-medium">Pengaturan</div>
                    <div className="text-xs text-gray-500">Status & catatan</div>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>
                    <p className="text-sm text-gray-600">Konfigurasi dasar kamar dan tarif</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="room_number"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Bed className="w-4 h-4" />
                          Nomor Kamar *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="101, A1, Suite-01"
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
                    name="room_type"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Building className="w-4 h-4" />
                          Tipe Kamar *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                              <SelectValue placeholder="Pilih tipe kamar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className='bg-white'>
                            {ROOM_TYPES.map(type => (
                              <SelectItem key={type} value={type} className='hover:bg-blue-200'>
                                <div className="flex items-center gap-2">
                                  <Bed className="w-4 h-4 text-blue-600" />
                                  <span>{type}</span>
                                </div>
                              </SelectItem>
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
              <TabsContent value="amenities" className="space-y-6 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fasilitas Kamar</h3>
                    <p className="text-sm text-gray-600">Pilih amenitas yang tersedia di kamar</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Amenities Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800">Fasilitas Tersedia</h4>
                      <Badge variant="outline" className="text-xs">
                        {form.watch('amenities').length} dipilih
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {ROOM_AMENITIES.map((amenity) => {
                        const Icon = amenity.icon
                        const isSelected = form.watch('amenities').includes(amenity.id)
                        
                        return (
                          <Card 
                            key={amenity.id}
                            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                              isSelected 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleAmenity(amenity.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <span className={`text-sm font-medium ${
                                    isSelected ? 'text-blue-600' : 'text-gray-700'
                                  }`}>
                                    {amenity.label}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="p-1 bg-green-500 rounded-full">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
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
                  
                  {currentTab !== 'settings' && (
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
                    disabled={isLoading || !tabStatus.basic} 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg min-w-32 text-slate-700"
                  >
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
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
})