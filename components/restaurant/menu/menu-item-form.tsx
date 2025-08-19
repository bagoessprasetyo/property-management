'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChefHat, Loader2, Upload, X, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  useRestaurantItem,
  useCreateRestaurantItem,
  useUpdateRestaurantItem 
} from '@/lib/hooks/use-restaurant-items'
import { useActiveRestaurantCategories } from '@/lib/hooks/use-restaurant-categories'
import { formatIDR } from '@/lib/utils/currency'
import { toast } from 'sonner'
import type { DietaryType } from '@/lib/types/restaurant'
import { DIETARY_TYPE_CONFIG } from '@/lib/types/restaurant'

const itemFormSchema = z.object({
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  name: z.string().min(1, 'Nama item wajib diisi').max(200, 'Nama terlalu panjang'),
  description: z.string().max(1000, 'Deskripsi terlalu panjang').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  image_url: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  dietary_info: z.array(z.enum(['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'])).optional(),
  preparation_time: z.number().min(0, 'Waktu persiapan tidak boleh negatif').optional(),
  is_available: z.boolean(),
})

type ItemFormData = z.infer<typeof itemFormSchema>

interface MenuItemFormProps {
  itemId?: string | null
  categoryId?: string | null // Pre-selected category when creating
  propertyId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MenuItemForm({ 
  itemId, 
  categoryId, 
  propertyId, 
  open, 
  onOpenChange, 
  onSuccess 
}: MenuItemFormProps) {
  const isEditing = !!itemId
  const { data: item, isLoading: itemLoading } = useRestaurantItem(itemId || null)
  const { data: categories } = useActiveRestaurantCategories(propertyId)
  const createItem = useCreateRestaurantItem()
  const updateItem = useUpdateRestaurantItem()

  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      category_id: categoryId || '',
      name: '',
      description: '',
      price: 0,
      image_url: '',
      ingredients: [],
      allergens: [],
      dietary_info: [],
      preparation_time: 15,
      is_available: true,
    },
  })

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      form.reset({
        category_id: item.category_id || '',
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        image_url: item.image_url || '',
        ingredients: Array.isArray(item.ingredients) ? item.ingredients as string[] : [],
        allergens: Array.isArray(item.allergens) ? item.allergens as string[] : [],
        dietary_info: Array.isArray(item.dietary_info) ? item.dietary_info as DietaryType[] : [],
        preparation_time: item.preparation_time || 15,
        is_available: item.is_available ?? true,
      })
    } else if (open && !isEditing) {
      form.reset({
        category_id: categoryId || '',
        name: '',
        description: '',
        price: 0,
        image_url: '',
        ingredients: [],
        allergens: [],
        dietary_info: [],
        preparation_time: 15,
        is_available: true,
      })
    }
  }, [open, item, isEditing, categoryId, form])

  const onSubmit = async (data: ItemFormData) => {
    if (!propertyId) {
      toast.error('Property ID tidak ditemukan')
      return
    }

    try {
      if (isEditing && itemId) {
        await updateItem.mutateAsync({
          id: itemId,
          updates: {
            ...data,
            currency: 'IDR'
          }
        })
        toast.success('Item berhasil diperbarui')
      } else {
        await createItem.mutateAsync({
          ...data,
          property_id: propertyId,
          currency: 'IDR'
        })
        toast.success('Item berhasil dibuat')
      }
      onSuccess()
    } catch (error) {
      toast.error(isEditing ? 'Gagal memperbarui item' : 'Gagal membuat item')
    }
  }

  const addIngredient = () => {
    if (newIngredient.trim()) {
      const currentIngredients = form.getValues('ingredients') || []
      form.setValue('ingredients', [...currentIngredients, newIngredient.trim()])
      setNewIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues('ingredients') || []
    form.setValue('ingredients', currentIngredients.filter((_, i) => i !== index))
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      const currentAllergens = form.getValues('allergens') || []
      form.setValue('allergens', [...currentAllergens, newAllergen.trim()])
      setNewAllergen('')
    }
  }

  const removeAllergen = (index: number) => {
    const currentAllergens = form.getValues('allergens') || []
    form.setValue('allergens', currentAllergens.filter((_, i) => i !== index))
  }

  const isSubmitting = createItem.isPending || updateItem.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            {isEditing ? 'Edit Menu Item' : 'Item Menu Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi item menu'
              : 'Tambahkan item baru ke menu restoran'
            }
          </DialogDescription>
        </DialogHeader>

        {itemLoading && isEditing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informasi Dasar</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className='bg-white'>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Item *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama menu item" {...field} />
                        </FormControl>
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
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Deskripsi menu item"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga (IDR) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('price') > 0 && (
                            <span className="text-warm-brown-600 font-medium">
                              {formatIDR(form.watch('price'))}
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preparation_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu Persiapan (menit)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="15"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Gambar</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        URL gambar item menu (opsional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dietary Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informasi Diet & Alergen</h3>
                
                <FormField
                  control={form.control}
                  name="dietary_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informasi Diet</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(DIETARY_TYPE_CONFIG).map(([key, config]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={field.value?.includes(key as DietaryType) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), key as DietaryType])
                                } else {
                                  field.onChange((field.value || []).filter(item => item !== key))
                                }
                              }}
                            />
                            <label htmlFor={key} className="text-sm">
                              {config.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bahan & Alergen</h3>
                
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bahan-bahan</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Tambah bahan"
                            value={newIngredient}
                            onChange={(e) => setNewIngredient(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                          />
                          <Button type="button" onClick={addIngredient} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(field.value || []).map((ingredient, index) => (
                            <Badge key={index} variant="secondary">
                              {ingredient}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-2"
                                onClick={() => removeIngredient(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergen</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Tambah alergen"
                            value={newAllergen}
                            onChange={(e) => setNewAllergen(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                          />
                          <Button type="button" onClick={addAllergen} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(field.value || []).map((allergen, index) => (
                            <Badge key={index} variant="destructive">
                              {allergen}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-2 text-white hover:text-red-100"
                                onClick={() => removeAllergen(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Availability */}
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tersedia</FormLabel>
                      <FormDescription>
                        Item akan ditampilkan dalam menu dan dapat dipesan
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-400 hover:bg-blue-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditing ? 'Memperbarui...' : 'Membuat...'}
                    </>
                  ) : (
                    isEditing ? 'Perbarui Item' : 'Buat Item'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}