'use client'

import { useState } from 'react'
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Clock, 
  Utensils,
  MoreVertical,
  AlertTriangle,
  Leaf
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  useDeleteRestaurantItem, 
  useToggleRestaurantItemAvailability 
} from '@/lib/hooks/use-restaurant-items'
import { formatIDR } from '@/lib/utils/currency'
import { toast } from 'sonner'
import type { RestaurantItemWithCategory } from '@/lib/types/restaurant'
import { DIETARY_TYPE_CONFIG } from '@/lib/types/restaurant'

interface MenuItemCardProps {
  item: RestaurantItemWithCategory
  viewMode: 'grid' | 'list'
  onEdit: () => void
  onCreateSimilar: () => void
}

export function MenuItemCard({ item, viewMode, onEdit, onCreateSimilar }: MenuItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const deleteItem = useDeleteRestaurantItem()
  const toggleAvailability = useToggleRestaurantItemAvailability()

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id)
      toast.success(`Item "${item.name}" berhasil dihapus`)
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Gagal menghapus item')
    }
  }

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailability.mutateAsync({
        id: item.id,
        is_available: !item.is_available
      })
      toast.success(
        `Item "${item.name}" ${!item.is_available ? 'diaktifkan' : 'dinonaktifkan'}`
      )
    } catch (error) {
      toast.error('Gagal mengubah ketersediaan item')
    }
  }

  const dietaryInfo = Array.isArray(item.dietary_info) ? item.dietary_info as string[] : []
  const allergens = Array.isArray(item.allergens) ? item.allergens as string[] : []

  if (viewMode === 'list') {
    return (
      <>
        <Card className={`${!item.is_available ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              {/* Image placeholder */}
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Utensils className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      {!item.is_available && (
                        <Badge variant="secondary">Tidak Tersedia</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{item.category?.name}</p>
                    
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-2">
                      <span className="font-semibold text-lg text-warm-brown-600">
                        {formatIDR(item.price)}
                      </span>
                      
                      {item.preparation_time && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {item.preparation_time} min
                        </div>
                      )}
                    </div>

                    {/* Dietary & Allergen Info */}
                    {(dietaryInfo.length > 0 || allergens.length > 0) && (
                      <div className="flex items-center space-x-2 mt-2">
                        {dietaryInfo.slice(0, 3).map((diet, index) => (
                          <Badge key={`${diet}-${index}`} variant="outline" className="text-xs">
                            <Leaf className="w-3 h-3 mr-1" />
                            {DIETARY_TYPE_CONFIG[diet as keyof typeof DIETARY_TYPE_CONFIG]?.label || diet}
                          </Badge>
                        ))}
                        {allergens.length > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Allergen
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onCreateSimilar}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplikasi
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleAvailability}>
                        {item.is_available ? (
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
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Item</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus item "{item.name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Grid view
  return (
    <>
      <Card className={`group hover:shadow-md transition-shadow ${!item.is_available ? 'opacity-60' : ''}`}>
        <CardContent className="p-0">
          {/* Image */}
          <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Utensils className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                <Button size="sm" variant="secondary" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleToggleAvailability}
                >
                  {item.is_available ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Status badge */}
            {!item.is_available && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary">Tidak Tersedia</Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
                {item.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCreateSimilar}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplikasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-gray-600 mb-2">{item.category?.name}</p>
            
            {item.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-lg text-warm-brown-600">
                {formatIDR(item.price)}
              </span>
              {item.preparation_time && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {item.preparation_time}m
                </div>
              )}
            </div>

            {/* Dietary & Allergen Info */}
            {(dietaryInfo.length > 0 || allergens.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {dietaryInfo.slice(0, 2).map((diet, index) => (
                  <Badge key={`${diet}-${index}`} variant="outline" className="text-xs">
                    <Leaf className="w-3 h-3 mr-1" />
                    {DIETARY_TYPE_CONFIG[diet as keyof typeof DIETARY_TYPE_CONFIG]?.label || diet}
                  </Badge>
                ))}
                {allergens.length > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {allergens.length}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item "{item.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}