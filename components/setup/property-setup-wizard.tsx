'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateProperty } from '@/lib/hooks/use-properties'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Hotel, MapPin, Phone, Mail, Building, Loader2 } from 'lucide-react'

const propertySchema = z.object({
  name: z.string().min(2, 'Nama properti harus minimal 2 karakter'),
  address: z.string().min(5, 'Alamat harus minimal 5 karakter'),
  city: z.string().min(2, 'Nama kota harus minimal 2 karakter'),
  state: z.string().optional(),
  country: z.string().min(1, 'Negara harus diisi'),
  postal_code: z.string().min(5, 'Kode pos harus 5 digit').max(5, 'Kode pos harus 5 digit'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  total_rooms: z.number().min(1, 'Jumlah kamar minimal 1'),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertySetupWizardProps {
  onComplete: () => void
}

export function PropertySetupWizard({ onComplete }: PropertySetupWizardProps) {
  const [step, setStep] = useState(1)
  const createProperty = useCreateProperty()

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'Indonesia',
      postal_code: '',
      phone: '',
      email: '',
      description: '',
      total_rooms: 10,
    },
  })

  const onSubmit = async (data: PropertyFormData) => {
    try {
      await createProperty.mutateAsync({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state || null,
        country: data.country,
        postal_code: data.postal_code || null,
        phone: data.phone || null,
        email: data.email || null,
        description: data.description || null,
        total_rooms: data.total_rooms,
        amenities: [],
        settings: {},
      })
      onComplete()
    } catch (error) {
      console.error('Error creating property:', error)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['name', 'description'] as const
      : ['address', 'city', 'state', 'postal_code', 'phone', 'email', 'total_rooms'] as const

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setStep(2)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-brown-50 via-white to-terracotta-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warm-brown-600 rounded-2xl mb-4">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang di InnSync!
          </h1>
          <p className="text-gray-600">
            Mari kita siapkan properti hotel Anda
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-warm-brown-600" />
              <span>
                {step === 1 ? 'Informasi Dasar' : 'Detail Properti'}
              </span>
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Masukkan nama dan deskripsi hotel Anda'
                : 'Lengkapi informasi kontak dan lokasi hotel'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Hotel</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Hotel Santika Jakarta" 
                              {...field} 
                              className="bg-white"
                            />
                          </FormControl>
                          <FormDescription>
                            Nama resmi hotel atau properti Anda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi (Opsional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Hotel bintang 4 di pusat kota Jakarta dengan fasilitas modern" 
                              {...field} 
                              className="bg-white"
                            />
                          </FormControl>
                          <FormDescription>
                            Deskripsi singkat tentang hotel Anda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_rooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah Kamar</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="25" 
                              {...field} 
                              className="bg-white"
                            />
                          </FormControl>
                          <FormDescription>
                            Total jumlah kamar di hotel Anda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        className="bg-warm-brown-600 hover:bg-warm-brown-700"
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Alamat</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Jl. Sudirman No. 123" 
                                {...field} 
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kota</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Jakarta" 
                                {...field} 
                                className="bg-white"
                              />
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
                            <FormControl>
                              <Input 
                                placeholder="DKI Jakarta" 
                                {...field} 
                                className="bg-white"
                              />
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
                              <Input 
                                placeholder="10220" 
                                maxLength={5}
                                {...field} 
                                className="bg-white"
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
                          <FormItem>
                            <FormLabel>Telepon</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="021-12345678" 
                                {...field} 
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Email (Opsional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="reservasi@hotelsantika.com" 
                                {...field} 
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(1)}
                      >
                        Kembali
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createProperty.isPending}
                        className="bg-warm-brown-600 hover:bg-warm-brown-700"
                      >
                        {createProperty.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Selesai Setup'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}