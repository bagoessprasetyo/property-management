import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Indonesian date and time formatting utilities
 */

export const formatDate = (date: Date | string, pattern: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, pattern, { locale: id })
}

export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd/MM', { locale: id })
}

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: id })
}

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'HH:mm', { locale: id })
}

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(dateObj)) {
    return `Hari ini ${formatTime(dateObj)}`
  }
  
  if (isTomorrow(dateObj)) {
    return `Besok ${formatTime(dateObj)}`
  }
  
  if (isYesterday(dateObj)) {
    return `Kemarin ${formatTime(dateObj)}`
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: id 
  })
}

export const formatCheckInOut = (checkIn: Date | string, checkOut: Date | string): string => {
  const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  
  return `${formatDate(checkInDate, 'dd MMM')} - ${formatDate(checkOutDate, 'dd MMM yyyy')}`
}

// Common Indonesian time zones
export const TIME_ZONES = {
  WIB: 'Asia/Jakarta',     // Western Indonesia Time (Jakarta, Bandung, Medan)
  WITA: 'Asia/Makassar',   // Central Indonesia Time (Denpasar, Makassar)
  WIT: 'Asia/Jayapura',    // Eastern Indonesia Time (Jayapura)
} as const

// Get current time in WIB (Jakarta timezone)
export const getCurrentWIBTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONES.WIB }))
}

// Hotel business hours helpers
export const BUSINESS_HOURS = {
  CHECK_IN: '14:00',
  CHECK_OUT: '12:00',
  FRONT_DESK_START: '06:00',
  FRONT_DESK_END: '23:00',
} as const