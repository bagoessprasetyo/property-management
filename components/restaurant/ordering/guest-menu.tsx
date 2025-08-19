'use client'

import { useState, useMemo } from 'react'
import { Search, ShoppingCart, Filter, Clock, Leaf, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { useAvailableRestaurantItems } from '@/lib/hooks/use-restaurant-items'
import { useActiveRestaurantCategories } from '@/lib/hooks/use-restaurant-categories'
import { formatIDR } from '@/lib/utils/currency'
import { ShoppingCartSidebar } from './shopping-cart-sidebar'
import type { RestaurantItemWithCategory, CartItem, Cart, DietaryType, OrderType } from '@/lib/types/restaurant'
import { DIETARY_TYPE_CONFIG } from '@/lib/types/restaurant'

interface GuestMenuProps {
  propertyId?: string
  guestId?: string
  roomId?: string
  reservationId?: string
  onOrderSubmit?: (cart: Cart, orderData: {
    orderType: OrderType
    specialInstructions?: string
    deliveryTime?: string
  }) => void
}

export function GuestMenu({ 
  propertyId, 
  guestId, 
  roomId, 
  reservationId,
  onOrderSubmit 
}: GuestMenuProps) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 })
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [dietaryFilter, setDietaryFilter] = useState<DietaryType[]>([])

  const { data: categories } = useActiveRestaurantCategories(propertyId)
  const { data: items, isLoading } = useAvailableRestaurantItems(propertyId)

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!item.name.toLowerCase().includes(query) && 
            !item.description?.toLowerCase().includes(query)) {
          return false
        }
      }

      // Dietary filter
      if (dietaryFilter.length > 0) {
        const itemDietary = Array.isArray(item.dietary_info) ? item.dietary_info : []
        if (!dietaryFilter.some(diet => itemDietary.includes(diet))) {
          return false
        }
      }

      return true
    })
  }, [items, selectedCategory, searchQuery, dietaryFilter])

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, RestaurantItemWithCategory[]> = {}
    
    filteredItems.forEach(item => {
      const categoryName = item.category?.name || 'Lainnya'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(item)
    })

    return grouped
  }, [filteredItems])

  const addToCart = (item: RestaurantItemWithCategory) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(cartItem => cartItem.item.id === item.id)
      
      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = prevCart.items.map((cartItem, index) => 
          index === existingItemIndex 
            ? { 
                ...cartItem, 
                quantity: cartItem.quantity + 1,
                subtotal: (cartItem.quantity + 1) * cartItem.item.price
              }
            : cartItem
        )
      } else {
        // Add new item to cart
        const newCartItem: CartItem = {
          item,
          quantity: 1,
          subtotal: item.price
        }
        newItems = [...prevCart.items, newCartItem]
      }

      const total = newItems.reduce((sum, cartItem) => sum + cartItem.subtotal, 0)
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0)

      return { items: newItems, total, itemCount }
    })
  }

  const updateCartItem = (itemId: string, quantity: number, specialInstructions?: string) => {
    setCart(prevCart => {
      const newItems = prevCart.items
        .map(cartItem => {
          if (cartItem.item.id === itemId) {
            if (quantity <= 0) return null // Will be filtered out
            return {
              ...cartItem,
              quantity,
              subtotal: quantity * cartItem.item.price,
              special_instructions: specialInstructions
            }
          }
          return cartItem
        })
        .filter(Boolean) as CartItem[]

      const total = newItems.reduce((sum, cartItem) => sum + cartItem.subtotal, 0)
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0)

      return { items: newItems, total, itemCount }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(cartItem => cartItem.item.id !== itemId)
      const total = newItems.reduce((sum, cartItem) => sum + cartItem.subtotal, 0)
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0)

      return { items: newItems, total, itemCount }
    })
  }

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 })
  }

  const handleOrderSubmit = (orderData: {
    orderType: OrderType
    specialInstructions?: string
    deliveryTime?: string
  }) => {
    if (onOrderSubmit) {
      onOrderSubmit(cart, orderData)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white flex items-center justify-center h-96">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 animate-pulse mx-auto mb-4 text-warm-brown-600" />
          <p className="text-gray-600">Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-whitespace-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Menu Restoran</h2>
          <p className="text-gray-600 mt-1">Pilih makanan dan minuman favorit Anda</p>
        </div>
        <Button 
          onClick={() => setCartOpen(true)}
          className="bg-warm-brown-600 hover:bg-warm-brown-700 relative"
          disabled={cart.itemCount === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Keranjang ({cart.itemCount})
          {cart.itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari makanan atau minuman..."
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
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dietaryFilter.join(',')} onValueChange={(value) => {
              setDietaryFilter(value ? value.split(',') as DietaryType[] : [])
            }}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter Diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                {Object.entries(DIETARY_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center">
                      <Leaf className="w-3 h-3 mr-2" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Content */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada menu ditemukan</h3>
            <p className="text-gray-600">Coba ubah filter atau kata kunci pencarian</p>
          </CardContent>
        </Card>
      ) : selectedCategory === 'all' ? (
        // Show by categories
        <div className="space-y-8">
          {Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
            <div key={categoryName}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{categoryName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => addToCart(item)}
                    cartQuantity={cart.items.find(cartItem => cartItem.item.id === item.id)?.quantity || 0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show single category
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={() => addToCart(item)}
              cartQuantity={cart.items.find(cartItem => cartItem.item.id === item.id)?.quantity || 0}
            />
          ))}
        </div>
      )}

      {/* Shopping Cart Sidebar */}
      <ShoppingCartSidebar
        cart={cart}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onSubmitOrder={handleOrderSubmit}
        guestId={guestId}
        roomId={roomId}
        reservationId={reservationId}
      />
    </div>
  )
}

// Menu Item Card Component
interface MenuItemCardProps {
  item: RestaurantItemWithCategory
  onAddToCart: () => void
  cartQuantity: number
}

function MenuItemCard({ item, onAddToCart, cartQuantity }: MenuItemCardProps) {
  const dietaryInfo = Array.isArray(item.dietary_info) ? item.dietary_info as string[] : []
  const allergens = Array.isArray(item.allergens) ? item.allergens : []

  return (
    <Card className="group hover:shadow-lg transition-shadow">
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
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {cartQuantity > 0 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-warm-brown-600">
                {cartQuantity} di keranjang
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
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
            <div className="flex flex-wrap gap-1 mb-3">
              {dietaryInfo.slice(0, 2).map((diet, index) => (
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

          <Button 
            onClick={onAddToCart}
            className="w-full bg-warm-brown-600 hover:bg-warm-brown-700"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Tambah ke Keranjang
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}