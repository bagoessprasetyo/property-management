'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
  useRestaurantCategory,
  useCreateRestaurantCategory,
  useUpdateRestaurantCategory 
} from '@/lib/hooks/use-restaurant-categories'
import { toast } from 'sonner'

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100, 'Nama terlalu panjang'),
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
  display_order: z.number().min(0, 'Urutan tidak boleh negatif').optional(),
  is_active: z.boolean(),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

interface MenuCategoryFormProps {
  categoryId?: string | null
  propertyId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MenuCategoryForm({ 
  categoryId, 
  propertyId, 
  open, 
  onOpenChange, 
  onSuccess 
}: MenuCategoryFormProps) {
  const isEditing = !!categoryId
  const { data: category, isLoading: categoryLoading } = useRestaurantCategory(categoryId || null)
  const createCategory = useCreateRestaurantCategory()
  const updateCategory = useUpdateRestaurantCategory()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      display_order: 0,
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name || '',
        description: category.description || '',
        display_order: category.display_order || 0,
        is_active: category.is_active ?? true,
      })
    } else if (open && !isEditing) {
      form.reset({
        name: '',
        description: '',
        display_order: 0,
        is_active: true,
      })
    }
  }, [open, category, isEditing, form])

  const onSubmit = async (data: CategoryFormData) => {
    if (!propertyId) {
      toast.error('Property ID tidak ditemukan')
      return
    }

    try {
      if (isEditing && categoryId) {
        await updateCategory.mutateAsync({
          id: categoryId,
          updates: data
        })
        toast.success('Kategori berhasil diperbarui')
      } else {
        await createCategory.mutateAsync({
          ...data,
          property_id: propertyId
        })
        toast.success('Kategori berhasil dibuat')
      }
      onSuccess()
    } catch (error) {
      toast.error(isEditing ? 'Gagal memperbarui kategori' : 'Gagal membuat kategori')
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isEditing ? 'Edit Kategori' : 'Kategori Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi kategori menu'
              : 'Buat kategori baru untuk mengorganisir menu Anda'
            }
          </DialogDescription>
        </DialogHeader>

        {categoryLoading && isEditing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Appetizer, Main Course, Dessert" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsi kategori (opsional)"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi singkat tentang kategori ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan Tampilan</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Urutan kategori dalam menu (0 = pertama)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormDescription>
                        Kategori aktif akan ditampilkan dalam menu
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
                    isEditing ? 'Perbarui Kategori' : 'Buat Kategori'
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