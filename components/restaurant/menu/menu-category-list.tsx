'use client'

import { useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  ChefHat,
  MoreVertical,
  Package
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  useDeleteRestaurantCategory, 
  useToggleRestaurantCategoryStatus,
  useReorderRestaurantCategories 
} from '@/lib/hooks/use-restaurant-categories'
import { toast } from 'sonner'
import type { MenuCategory } from '@/lib/types/restaurant'

interface MenuCategoryListProps {
  categories: MenuCategory[]
  loading: boolean
  onEdit: (categoryId: string) => void
  onCreate: () => void
  onCreateItem: (categoryId: string) => void
}

export function MenuCategoryList({ 
  categories, 
  loading, 
  onEdit, 
  onCreate, 
  onCreateItem 
}: MenuCategoryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null)
  const [draggedCategory, setDraggedCategory] = useState<MenuCategory | null>(null)

  const deleteCategory = useDeleteRestaurantCategory()
  const toggleStatus = useToggleRestaurantCategoryStatus()
  const reorderCategories = useReorderRestaurantCategories()

  const handleDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id)
      toast.success(`Kategori "${categoryToDelete.name}" berhasil dihapus`)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      toast.error('Gagal menghapus kategori')
    }
  }

  const handleToggleStatus = async (category: MenuCategory) => {
    try {
      await toggleStatus.mutateAsync({
        id: category.id,
        is_active: !category.is_active
      })
      toast.success(
        `Kategori "${category.name}" ${!category.is_active ? 'diaktifkan' : 'dinonaktifkan'}`
      )
    } catch (error) {
      toast.error('Gagal mengubah status kategori')
    }
  }

  const handleDragStart = (e: React.DragEvent, category: MenuCategory) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetCategory: MenuCategory) => {
    e.preventDefault()
    
    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      setDraggedCategory(null)
      return
    }

    const draggedIndex = categories.findIndex(c => c.id === draggedCategory.id)
    const targetIndex = categories.findIndex(c => c.id === targetCategory.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Create new order based on drag and drop
    const newCategories = [...categories]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(targetIndex, 0, draggedCategory)

    // Create updates for reordering
    const updates = newCategories.map((category, index) => ({
      id: category.id,
      display_order: index
    }))

    reorderCategories.mutate(updates, {
      onSuccess: () => {
        toast.success('Urutan kategori berhasil diubah')
      },
      onError: () => {
        toast.error('Gagal mengubah urutan kategori')
      }
    })

    setDraggedCategory(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kategori Menu</CardTitle>
          <CardDescription>Kelola kategori untuk mengorganisir menu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Package className="w-8 h-8 animate-pulse mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat kategori...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Kategori Menu</CardTitle>
            <CardDescription>
              Kelola kategori untuk mengorganisir menu. Drag & drop untuk mengubah urutan.
            </CardDescription>
          </div>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Kategori Baru
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p>Belum ada kategori menu</p>
              <Button variant="outline" className="mt-2" onClick={onCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Kategori Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category)}
                  className={`
                    group relative p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-move
                    ${draggedCategory?.id === category.id ? 'opacity-50' : ''}
                    ${!category.is_active ? 'bg-gray-50 border-gray-200' : 'border-gray-200'}
                  `}
                >
                  <div className="flex items-center space-x-4">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0">
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className={`font-medium ${!category.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                          {category.name}
                        </h3>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          
                          <Badge variant="outline">
                            {category.itemCount || 0} item
                          </Badge>
                        </div>
                      </div>
                      
                      {category.description && (
                        <p className={`text-sm mt-1 ${!category.is_active ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateItem(category.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Item
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(category)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {category.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(category.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Kategori
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCreateItem(category.id)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
                            {category.is_active ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setCategoryToDelete(category)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                            disabled={!!(category.itemCount && category.itemCount > 0)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "{categoryToDelete?.name}"?
              {categoryToDelete?.itemCount && categoryToDelete.itemCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Kategori ini memiliki {categoryToDelete.itemCount} item dan tidak dapat dihapus.
                  Hapus atau pindahkan semua item terlebih dahulu.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!(categoryToDelete?.itemCount && categoryToDelete.itemCount > 0)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}