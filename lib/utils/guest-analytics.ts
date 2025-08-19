// Guest analytics and statistics utilities

export interface GuestAnalytics {
  totalGuests: number
  localGuests: number
  foreignGuests: number
  vipGuests: number
  newGuestsThisMonth: number
  newGuestsThisWeek: number
  guestGrowthRate: number
  topCities: Array<{ city: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
  registrationTrend: Array<{ date: string; count: number }>
  guestTypeDistribution: Array<{ type: string; count: number; percentage: number }>
  averageGuestsPerMonth: number
}

export function calculateGuestAnalytics(guests: any[]): GuestAnalytics {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear
  
  // Basic counts
  const totalGuests = guests.length
  const localGuests = guests.filter(g => 
    g.identification_type === 'KTP' || g.nationality === 'Indonesia'
  ).length
  const foreignGuests = totalGuests - localGuests
  const vipGuests = guests.filter(g => 
    g.special_requests?.toLowerCase().includes('vip') || 
    g.notes?.toLowerCase().includes('vip')
  ).length

  // Time-based counts
  const newGuestsThisMonth = guests.filter(g => {
    const createdAt = new Date(g.created_at)
    return createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear
  }).length

  const newGuestsLastMonth = guests.filter(g => {
    const createdAt = new Date(g.created_at)
    return createdAt.getMonth() === lastMonth && createdAt.getFullYear() === lastMonthYear
  }).length

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newGuestsThisWeek = guests.filter(g => 
    new Date(g.created_at) >= weekAgo
  ).length

  // Growth rate calculation
  const guestGrowthRate = newGuestsLastMonth > 0 
    ? ((newGuestsThisMonth - newGuestsLastMonth) / newGuestsLastMonth) * 100
    : newGuestsThisMonth > 0 ? 100 : 0

  // Top cities
  const cityCount = guests.reduce((acc, guest) => {
    if (guest.city) {
      acc[guest.city] = (acc[guest.city] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const topCities = Object.entries(cityCount)
    .map(([city, count]) => ({ city, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Top countries
  const countryCount = guests.reduce((acc, guest) => {
    const country = guest.country || guest.nationality || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCountries = Object.entries(countryCount)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Registration trend (last 12 months)
  const registrationTrend: Array<{ date: string; count: number }> = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthGuests = guests.filter(g => {
      const createdAt = new Date(g.created_at)
      return createdAt.getMonth() === date.getMonth() && 
             createdAt.getFullYear() === date.getFullYear()
    }).length
    
    registrationTrend.push({
      date: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      count: monthGuests
    })
  }

  // Guest type distribution
  const guestTypeDistribution = [
    { type: 'Lokal', count: localGuests, percentage: (localGuests / totalGuests) * 100 },
    { type: 'Asing', count: foreignGuests, percentage: (foreignGuests / totalGuests) * 100 },
    { type: 'VIP', count: vipGuests, percentage: (vipGuests / totalGuests) * 100 }
  ]

  // Average guests per month
  const monthsOfData = Math.max(1, Math.ceil(
    (now.getTime() - new Date(guests[guests.length - 1]?.created_at || now).getTime()) / 
    (30 * 24 * 60 * 60 * 1000)
  ))
  const averageGuestsPerMonth = totalGuests / monthsOfData

  return {
    totalGuests,
    localGuests,
    foreignGuests,
    vipGuests,
    newGuestsThisMonth,
    newGuestsThisWeek,
    guestGrowthRate,
    topCities,
    topCountries,
    registrationTrend,
    guestTypeDistribution,
    averageGuestsPerMonth
  }
}

export function formatGrowthRate(rate: number): string {
  const formattedRate = Math.abs(rate).toFixed(1)
  if (rate > 0) return `+${formattedRate}%`
  if (rate < 0) return `-${formattedRate}%`
  return '0%'
}

export function getGrowthColor(rate: number): string {
  if (rate > 0) return 'text-green-600'
  if (rate < 0) return 'text-red-600'
  return 'text-gray-600'
}

export function getGrowthIcon(rate: number): 'up' | 'down' | 'same' {
  if (rate > 0) return 'up'
  if (rate < 0) return 'down'
  return 'same'
}