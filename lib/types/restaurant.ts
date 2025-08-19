import type { Database } from './database'

// Base types from database
export type RestaurantCategory = Database['public']['Tables']['restaurant_categories']['Row']
export type RestaurantCategoryInsert = Database['public']['Tables']['restaurant_categories']['Insert']
export type RestaurantCategoryUpdate = Database['public']['Tables']['restaurant_categories']['Update']

export type RestaurantItem = Database['public']['Tables']['restaurant_items']['Row']
export type RestaurantItemInsert = Database['public']['Tables']['restaurant_items']['Insert']
export type RestaurantItemUpdate = Database['public']['Tables']['restaurant_items']['Update']

export type RestaurantOrder = Database['public']['Tables']['restaurant_orders']['Row']
export type RestaurantOrderInsert = Database['public']['Tables']['restaurant_orders']['Insert']
export type RestaurantOrderUpdate = Database['public']['Tables']['restaurant_orders']['Update']

export type RestaurantOrderItem = Database['public']['Tables']['restaurant_order_items']['Row']
export type RestaurantOrderItemInsert = Database['public']['Tables']['restaurant_order_items']['Insert']
export type RestaurantOrderItemUpdate = Database['public']['Tables']['restaurant_order_items']['Update']

export type RestaurantBill = Database['public']['Tables']['restaurant_bills']['Row']
export type RestaurantBillInsert = Database['public']['Tables']['restaurant_bills']['Insert']
export type RestaurantBillUpdate = Database['public']['Tables']['restaurant_bills']['Update']

// Enum types
export type OrderStatus = Database['public']['Enums']['order_status']
export type OrderType = Database['public']['Enums']['order_type']
export type BillStatus = Database['public']['Enums']['bill_status']
export type DietaryType = Database['public']['Enums']['dietary_type']

// Extended types with relationships
export interface RestaurantItemWithCategory extends RestaurantItem {
  category?: RestaurantCategory
}

export interface RestaurantOrderWithDetails extends RestaurantOrder {
  items?: RestaurantOrderItemWithItem[]
  guest?: {
    id: string
    first_name: string
    last_name: string
    phone?: string
  }
  room?: {
    id: string
    room_number: string
    room_type: string
  }
  reservation?: {
    id: string
    confirmation_number: string
  }
}

export interface RestaurantOrderItemWithItem extends RestaurantOrderItem {
  item?: RestaurantItemWithCategory
}

export interface RestaurantBillWithDetails extends RestaurantBill {
  orders?: RestaurantOrderWithDetails[]
  guest?: {
    id: string
    first_name: string
    last_name: string
    phone?: string
  }
  reservation?: {
    id: string
    confirmation_number: string
    check_out_date: string
  }
}

// Cart and ordering types
export interface CartItem {
  item: RestaurantItemWithCategory
  quantity: number
  special_instructions?: string
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

// Menu management types
export interface MenuCategory extends RestaurantCategory {
  items?: RestaurantItem[]
  itemCount?: number
}

// Order management types
export interface OrderSummary {
  id: string
  order_number: string
  status: OrderStatus
  order_type: OrderType
  total_amount: number
  guest_name: string
  room_number?: string
  estimated_ready_time?: string
  created_at: string
}

// Kitchen display types
export interface KitchenOrderItem {
  id: string
  item_name: string
  quantity: number
  special_instructions?: string
  preparation_time?: number
}

export interface KitchenOrder {
  id: string
  order_number: string
  status: OrderStatus
  order_type: OrderType
  items: KitchenOrderItem[]
  guest_name: string
  room_number?: string
  special_instructions?: string
  estimated_ready_time?: string
  created_at: string
  total_prep_time: number
}

// Analytics types
export interface RestaurantAnalytics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  popular_items: {
    item_id: string
    item_name: string
    quantity_sold: number
    revenue: number
  }[]
  orders_by_status: Record<OrderStatus, number>
  orders_by_type: Record<OrderType, number>
  peak_hours: {
    hour: number
    order_count: number
  }[]
  outstanding_bills: {
    count: number
    total_amount: number
  }
}

// Form types
export interface CreateOrderFormData {
  guest_id?: string
  room_id?: string
  reservation_id?: string
  order_type: OrderType
  items: {
    item_id: string
    quantity: number
    unit_price: number
    special_instructions?: string
  }[]
  special_instructions?: string
  delivery_time?: string
}

export interface CategoryFormData {
  name: string
  description?: string
  display_order?: number
  is_active?: boolean
}

export interface ItemFormData {
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  ingredients?: string[]
  allergens?: string[]
  dietary_info?: DietaryType[]
  preparation_time?: number
  is_available?: boolean
  availability_schedule?: {
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
  }
}

// API response types
export interface RestaurantStatsResponse {
  categories_count: number
  items_count: number
  active_orders: number
  pending_orders: number
  completed_orders_today: number
  revenue_today: number
  outstanding_bills_count: number
  outstanding_bills_amount: number
}

// Filters and search types
export interface OrderFilters {
  status?: OrderStatus[]
  order_type?: OrderType[]
  date_from?: string
  date_to?: string
  guest_name?: string
  room_number?: string
}

export interface ItemFilters {
  category_id?: string[]
  is_available?: boolean
  dietary_info?: DietaryType[]
  price_min?: number
  price_max?: number
  search?: string
}

// Helper utility types
export type CreateOrderData = Omit<RestaurantOrderInsert, 'id' | 'created_at' | 'updated_at' | 'version'>
export type UpdateOrderData = Omit<RestaurantOrderUpdate, 'id' | 'updated_at' | 'version'>
export type CreateItemData = Omit<RestaurantItemInsert, 'id' | 'created_at' | 'updated_at' | 'version'>
export type UpdateItemData = Omit<RestaurantItemUpdate, 'id' | 'updated_at' | 'version'>

// Status configuration
export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  icon: string
}> = {
  pending: {
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock'
  },
  confirmed: {
    label: 'Dikonfirmasi',
    color: 'bg-blue-100 text-blue-800',
    icon: 'CheckCircle'
  },
  preparing: {
    label: 'Sedang Disiapkan',
    color: 'bg-orange-100 text-orange-800',
    icon: 'ChefHat'
  },
  ready: {
    label: 'Siap',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle2'
  },
  delivered: {
    label: 'Diantar',
    color: 'bg-gray-100 text-gray-800',
    icon: 'Truck'
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle'
  }
}

export const ORDER_TYPE_CONFIG: Record<OrderType, {
  label: string
  color: string
  icon: string
}> = {
  room_service: {
    label: 'Room Service',
    color: 'bg-blue-100 text-blue-800',
    icon: 'Bed'
  },
  dine_in: {
    label: 'Dine In',
    color: 'bg-green-100 text-green-800',
    icon: 'Utensils'
  },
  takeaway: {
    label: 'Takeaway',
    color: 'bg-purple-100 text-purple-800',
    icon: 'ShoppingBag'
  }
}

export const DIETARY_TYPE_CONFIG: Record<DietaryType, {
  label: string
  color: string
  icon: string
}> = {
  vegetarian: {
    label: 'Vegetarian',
    color: 'bg-green-100 text-green-800',
    icon: 'Leaf'
  },
  vegan: {
    label: 'Vegan',
    color: 'bg-emerald-100 text-emerald-800',
    icon: 'Sprout'
  },
  halal: {
    label: 'Halal',
    color: 'bg-teal-100 text-teal-800',
    icon: 'Star'
  },
  gluten_free: {
    label: 'Gluten Free',
    color: 'bg-amber-100 text-amber-800',
    icon: 'Wheat'
  },
  dairy_free: {
    label: 'Dairy Free',
    color: 'bg-sky-100 text-sky-800',
    icon: 'Milk'
  },
  nut_free: {
    label: 'Nut Free',
    color: 'bg-orange-100 text-orange-800',
    icon: 'Nut'
  }
}