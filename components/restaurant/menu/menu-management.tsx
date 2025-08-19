'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Grid3X3, List, ChefHat, Settings, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRestaurantCategories, useRestaurantCategoriesWithCounts } from '@/lib/hooks/use-restaurant-categories'
import { useRestaurantItems } from '@/lib/hooks/use-restaurant-items'
import { formatIDR } from '@/lib/utils/currency'
import { MenuCategoryList } from './menu-category-list'
import { MenuItemCard } from './menu-item-card'
import { MenuCategoryForm } from './menu-category-form'
import { MenuItemForm } from './menu-item-form'
import type { ItemFilters } from '@/lib/types/restaurant'

// Single property setup - hardcoded property ID
const PROPERTY_ID = '571da531-4a8e-4e37-89e9-78667ec52847'

interface MenuManagementProps {}

export function MenuManagement({}: MenuManagementProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Fetch data
  const { data: categoriesWithCounts, isLoading: categoriesLoading } = useRestaurantCategoriesWithCounts(PROPERTY_ID)
  
  // Build filters for items
  const itemFilters: ItemFilters = {
    ...(selectedCategory !== 'all' && { category_id: [selectedCategory] }),
    ...(availabilityFilter !== 'all' && { is_available: availabilityFilter === 'available' }),
    ...(searchQuery && { search: searchQuery })
  }

  const { data: items, isLoading: itemsLoading } = useRestaurantItems(PROPERTY_ID, itemFilters)

  // Calculate stats
  const totalItems = items?.length || 0
  const availableItems = items?.filter(item => item.is_available).length || 0
  const totalCategories = categoriesWithCounts?.length || 0
  const activeCategories = categoriesWithCounts?.filter(cat => cat.is_active).length || 0

  const handleEditCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setShowCategoryForm(true)
  }

  const handleEditItem = (itemId: string) => {
    setSelectedItemId(itemId)
    setShowItemForm(true)
  }

  const handleCreateItem = (categoryId?: string) => {
    setSelectedCategoryId(categoryId || null)
    setSelectedItemId(null)
    setShowItemForm(true)
  }

  return (
    <div className="bg-white space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Menu</h2>
          <p className="text-gray-600 mt-1">
            Kelola kategori menu dan item makanan & minuman
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => setShowCategoryForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Kategori Baru
          </Button>
          <Button 
            className="bg-blue-400 hover:bg-blue-500"
            onClick={() => handleCreateItem()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Item Baru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Kategori</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
                <p className="text-xs text-gray-500">{activeCategories} aktif</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Item</p>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-gray-500">{availableItems} tersedia</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata Harga</p>
                <p className="text-2xl font-bold">
                  {items && items.length > 0 
                    ? formatIDR(items.reduce((sum, item) => sum + item.price, 0) / items.length)
                    : formatIDR(0)
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='border-0 shadow-lg'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Availability Rate</p>
                <p className="text-2xl font-bold">
                  {totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0}%
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-6">
          {/* Filters */}
          <Card className='border-0 shadow-lg'>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari nama item atau deskripsi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categoriesWithCounts?.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.itemCount || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Ketersediaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className='border-0 shadow-lg'>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>
                {totalItems} item ditemukan
                {selectedCategory !== 'all' && categoriesWithCounts && (
                  <span> dalam kategori "{categoriesWithCounts.find(c => c.id === selectedCategory)?.name}"</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <ChefHat className="w-8 h-8 animate-pulse mx-auto mb-2 text-warm-brown-600" />
                    <p className="text-gray-600">Memuat menu items...</p>
                  </div>
                </div>
              ) : !items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <ChefHat className="w-12 h-12 mb-2 opacity-50" />
                  <p>Tidak ada menu item ditemukan</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleCreateItem()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Item Pertama
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      onEdit={() => handleEditItem(item.id)}
                      onCreateSimilar={() => handleCreateItem(item.category_id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <MenuCategoryList
            categories={categoriesWithCounts || []}
            loading={categoriesLoading}
            onEdit={handleEditCategory}
            onCreate={() => setShowCategoryForm(true)}
            onCreateItem={handleCreateItem}
          />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <MenuCategoryForm
        categoryId={selectedCategoryId}
        propertyId={PROPERTY_ID}
        open={showCategoryForm}
        onOpenChange={(open) => {
          setShowCategoryForm(open)
          if (!open) setSelectedCategoryId(null)
        }}
        onSuccess={() => {
          setShowCategoryForm(false)
          setSelectedCategoryId(null)
        }}
      />

      <MenuItemForm
        itemId={selectedItemId}
        categoryId={selectedCategoryId}
        propertyId={PROPERTY_ID}
        open={showItemForm}
        onOpenChange={(open) => {
          setShowItemForm(open)
          if (!open) {
            setSelectedItemId(null)
            setSelectedCategoryId(null)
          }
        }}
        onSuccess={() => {
          setShowItemForm(false)
          setSelectedItemId(null)
          setSelectedCategoryId(null)
        }}
      />
    </div>
  )
}