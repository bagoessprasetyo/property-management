import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantAnalytics } from '@/lib/types/restaurant'

const supabase = createClient()

// Query keys
export const restaurantAnalyticsKeys = {
  all: ['restaurant-analytics'] as const,
  summary: (filters: Record<string, any>) => [...restaurantAnalyticsKeys.all, 'summary', filters] as const,
  revenue: (filters: Record<string, any>) => [...restaurantAnalyticsKeys.all, 'revenue', filters] as const,
  items: (filters: Record<string, any>) => [...restaurantAnalyticsKeys.all, 'items', filters] as const,
  performance: (filters: Record<string, any>) => [...restaurantAnalyticsKeys.all, 'performance', filters] as const,
}

// Get restaurant analytics summary
export function useRestaurantAnalytics(
  propertyId?: string, 
  dateFrom?: string, 
  dateTo?: string
) {
  return useQuery({
    queryKey: restaurantAnalyticsKeys.summary({ propertyId, dateFrom, dateTo }),
    queryFn: async (): Promise<RestaurantAnalytics> => {
      // Build base query for orders
      let ordersQuery = supabase
        .from('restaurant_orders')
        .select(`
          id,
          status,
          order_type,
          total_amount,
          created_at,
          items:restaurant_order_items(
            quantity,
            item:restaurant_items(id, name)
          )
        `)
        .neq('status', 'cancelled')

      if (propertyId) {
        ordersQuery = ordersQuery.eq('property_id', propertyId)
      }

      if (dateFrom) {
        ordersQuery = ordersQuery.gte('created_at', dateFrom)
      }

      if (dateTo) {
        ordersQuery = ordersQuery.lte('created_at', dateTo)
      }

      const { data: orders, error: ordersError } = await ordersQuery

      if (ordersError) throw ordersError

      // Calculate basic metrics
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate orders by type
      const ordersByType = orders.reduce((acc, order) => {
        acc[order.order_type] = (acc[order.order_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate popular items
      const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
      
      orders.forEach(order => {
        order.items?.forEach((orderItem: any) => {
          const itemId = orderItem.item.id
          const itemName = orderItem.item.name
          const quantity = orderItem.quantity || 0
          const revenue = (orderItem.quantity || 0) * (orderItem.unit_price || 0)

          if (!itemSales[itemId]) {
            itemSales[itemId] = { name: itemName, quantity: 0, revenue: 0 }
          }

          itemSales[itemId].quantity += quantity
          itemSales[itemId].revenue += revenue
        })
      })

      const popularItems = Object.entries(itemSales)
        .map(([itemId, data]) => ({
          item_id: itemId,
          item_name: data.name,
          quantity_sold: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 10)

      // Calculate peak hours
      const hourlyOrders: Record<number, number> = {}
      orders.forEach(order => {
        const hour = new Date(order.created_at).getHours()
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1
      })

      const peakHours = Object.entries(hourlyOrders)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          order_count: count
        }))
        .sort((a, b) => b.order_count - a.order_count)

      // Get outstanding bills info
      let billsQuery = supabase
        .from('restaurant_bills')
        .select('outstanding_amount')
        .eq('status', 'outstanding')

      if (propertyId) {
        billsQuery = billsQuery.eq('property_id', propertyId)
      }

      const { data: bills, error: billsError } = await billsQuery

      if (billsError) throw billsError

      const outstandingBills = {
        count: bills.length,
        total_amount: bills.reduce((sum, bill) => sum + (bill.outstanding_amount || 0), 0)
      }

      return {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
        popular_items: popularItems,
        orders_by_status: ordersByStatus,
        orders_by_type: ordersByType,
        peak_hours: peakHours,
        outstanding_bills: outstandingBills
      }
    },
  })
}

// Get revenue analytics over time
export function useRestaurantRevenueAnalytics(
  propertyId?: string,
  period: 'day' | 'week' | 'month' = 'day',
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: restaurantAnalyticsKeys.revenue({ propertyId, period, dateFrom, dateTo }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_orders')
        .select('total_amount, created_at')
        .neq('status', 'cancelled')

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      // Group by period
      const revenueByPeriod: Record<string, number> = {}
      
      data.forEach(order => {
        const date = new Date(order.created_at)
        let periodKey: string

        switch (period) {
          case 'day':
            periodKey = date.toISOString().split('T')[0]
            break
          case 'week':
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            periodKey = weekStart.toISOString().split('T')[0]
            break
          case 'month':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            break
          default:
            periodKey = date.toISOString().split('T')[0]
        }

        revenueByPeriod[periodKey] = (revenueByPeriod[periodKey] || 0) + (order.total_amount || 0)
      })

      return Object.entries(revenueByPeriod)
        .map(([period, revenue]) => ({ period, revenue }))
        .sort((a, b) => a.period.localeCompare(b.period))
    },
  })
}

// Get item performance analytics
export function useRestaurantItemAnalytics(
  propertyId?: string,
  categoryId?: string,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: restaurantAnalyticsKeys.items({ propertyId, categoryId, dateFrom, dateTo }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_order_items')
        .select(`
          quantity,
          unit_price,
          item:restaurant_items(
            id,
            name,
            category_id,
            price,
            category:restaurant_categories(name)
          ),
          order:restaurant_orders!inner(
            created_at,
            property_id,
            status
          )
        `)
        .neq('order.status', 'cancelled')

      if (propertyId) {
        query = query.eq('order.property_id', propertyId)
      }

      if (categoryId) {
        query = query.eq('item.category_id', categoryId)
      }

      if (dateFrom) {
        query = query.gte('order.created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('order.created_at', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      // Aggregate item data
      const itemStats: Record<string, {
        id: string
        name: string
        category_name: string
        quantity_sold: number
        revenue: number
        orders_count: number
        avg_price: number
}> = {} as Record<string, {
        id: string;
        name: string;
        category_name: string;
        quantity_sold: number;
        revenue: number;
        orders_count: number;
        avg_price: number;
      }>

      (data as any[]).forEach((orderItem: { item: { id: any; name: any; category: { name: any }; price: any }; quantity: number; unit_price: any }) => {
        const itemId = orderItem.item.id
        const quantity = orderItem.quantity || 0
        const revenue = quantity * (orderItem.unit_price || 0)

        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            id: itemId,
            name: orderItem.item.name,
            category_name: orderItem.item.category?.name || 'Unknown',
            quantity_sold: 0,
            revenue: 0,
            orders_count: 0,
            avg_price: orderItem.item.price || 0
          }
        }

        itemStats[itemId].quantity_sold += quantity
        itemStats[itemId].revenue += revenue
        itemStats[itemId].orders_count += 1
      })

      return Object.values(itemStats)
        .sort((a, b) => b.revenue - a.revenue)
    },
  })
}

// Get operational performance metrics
export function useRestaurantPerformanceAnalytics(
  propertyId?: string,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: restaurantAnalyticsKeys.performance({ propertyId, dateFrom, dateTo }),
    queryFn: async () => {
      let query = supabase
        .from('restaurant_orders')
        .select(`
          id,
          status,
          order_type,
          created_at,
          estimated_ready_time,
          completed_at,
          items:restaurant_order_items(
            item:restaurant_items(preparation_time)
          )
        `)

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      const completedOrders = data.filter(order => 
        order.status === 'delivered' && order.completed_at
      )

      // Calculate average preparation time
      const preparationTimes = completedOrders
        .filter(order => order.estimated_ready_time)
        .map(order => {
          const estimated = new Date(order.estimated_ready_time!).getTime()
          const completed = new Date(order.completed_at!).getTime()
          return Math.max(0, completed - estimated) / (1000 * 60) // minutes
        })

      const avgPreparationTime = preparationTimes.length > 0
        ? preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length
        : 0

      // Calculate order fulfillment rate
      const totalOrders = data.length
      const fulfilledOrders = data.filter(order => order.status === 'delivered').length
      const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0

      // Calculate average order processing time (from creation to completion)
      const processingTimes = completedOrders.map(order => {
        const created = new Date(order.created_at).getTime()
        const completed = new Date(order.completed_at!).getTime()
        return (completed - created) / (1000 * 60) // minutes
      })

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0

      // Orders by time of day
      const ordersByHour = data.reduce((acc, order) => {
        const hour = new Date(order.created_at).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      return {
        total_orders: totalOrders,
        completed_orders: fulfilledOrders,
        fulfillment_rate: fulfillmentRate,
        avg_preparation_time: avgPreparationTime,
        avg_processing_time: avgProcessingTime,
        orders_by_hour: ordersByHour,
        peak_hour: Object.entries(ordersByHour)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '12'
      }
    },
  })
}