/**
 * Indonesian currency and number formatting utilities
 */

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatIDRCompact = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('id-ID').format(number)
}

export const parseIDR = (value: string): number => {
  // Remove currency symbol, dots, and commas, then parse
  const cleaned = value.replace(/[^\d]/g, '')
  return parseInt(cleaned, 10) || 0
}

// Indonesian tax rates
export const TAX_RATES = {
  PPN: 0.11, // 11% VAT
  SERVICE_CHARGE: 0.10, // 10% service charge (common in Indonesian hotels)
} as const

export const calculateTax = (amount: number, taxRate: number = TAX_RATES.PPN): number => {
  return Math.round(amount * taxRate)
}

export const calculateTotal = (amount: number, includeTax: boolean = true, includeService: boolean = false): number => {
  let total = amount
  
  if (includeService) {
    total += calculateTax(amount, TAX_RATES.SERVICE_CHARGE)
  }
  
  if (includeTax) {
    total += calculateTax(amount, TAX_RATES.PPN)
  }
  
  return Math.round(total)
}