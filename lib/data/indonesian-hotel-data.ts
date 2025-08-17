// Indonesian hotel-specific data and configurations

export const INDONESIAN_CITIES = [
  'Jakarta',
  'Surabaya', 
  'Bandung',
  'Bekasi',
  'Medan',
  'Tangerang',
  'Depok',
  'Semarang',
  'Palembang',
  'Makassar',
  'Denpasar',
  'Yogyakarta',
  'Malang',
  'Bogor',
  'Batam',
  'Pekanbaru',
  'Bandar Lampung',
  'Padang',
  'Balikpapan',
  'Samarinda',
]

export const INDONESIAN_PROVINCES = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
]

export const ROOM_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Kamar standar dengan fasilitas dasar',
    capacity: 2,
    baseRate: 500000,
  },
  {
    id: 'superior',
    name: 'Superior',
    description: 'Kamar superior dengan view kota',
    capacity: 2,
    baseRate: 750000,
  },
  {
    id: 'deluxe',
    name: 'Deluxe',
    description: 'Kamar deluxe dengan balkon',
    capacity: 3,
    baseRate: 1000000,
  },
  {
    id: 'suite',
    name: 'Suite',
    description: 'Suite dengan ruang tamu terpisah',
    capacity: 4,
    baseRate: 1500000,
  },
  {
    id: 'family',
    name: 'Family Room',
    description: 'Kamar keluarga dengan tempat tidur tambahan',
    capacity: 4,
    baseRate: 1200000,
  },
  {
    id: 'presidential',
    name: 'Presidential Suite',
    description: 'Suite presidential dengan fasilitas mewah',
    capacity: 6,
    baseRate: 3000000,
  },
]

export const AMENITIES = [
  {
    id: 'wifi',
    name: 'WiFi Gratis',
    icon: 'wifi',
  },
  {
    id: 'ac',
    name: 'AC',
    icon: 'thermometer',
  },
  {
    id: 'tv',
    name: 'TV LED',
    icon: 'tv',
  },
  {
    id: 'minibar',
    name: 'Minibar',
    icon: 'wine',
  },
  {
    id: 'safe',
    name: 'Brankas',
    icon: 'lock',
  },
  {
    id: 'balcony',
    name: 'Balkon',
    icon: 'home',
  },
  {
    id: 'bathtub',
    name: 'Bathtub',
    icon: 'bath',
  },
  {
    id: 'breakfast',
    name: 'Sarapan',
    icon: 'coffee',
  },
  {
    id: 'parking',
    name: 'Parkir',
    icon: 'car',
  },
  {
    id: 'gym',
    name: 'Akses Gym',
    icon: 'dumbbell',
  },
  {
    id: 'pool',
    name: 'Akses Kolam Renang',
    icon: 'waves',
  },
  {
    id: 'spa',
    name: 'Akses Spa',
    icon: 'heart',
  },
]

export const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Tunai',
    description: 'Pembayaran tunai',
  },
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    description: 'Transfer ke rekening hotel',
  },
  {
    id: 'credit_card',
    name: 'Kartu Kredit',
    description: 'Visa, Mastercard, JCB',
  },
  {
    id: 'debit_card', 
    name: 'Kartu Debit',
    description: 'Debit BCA, Mandiri, BNI, BRI',
  },
  {
    id: 'digital_wallet',
    name: 'E-Wallet',
    description: 'GoPay, OVO, DANA, ShopeePay',
  },
]

export const INDONESIAN_HOLIDAYS_2024 = [
  { date: '2024-01-01', name: 'Tahun Baru Masehi' },
  { date: '2024-02-10', name: 'Tahun Baru Imlek' },
  { date: '2024-03-11', name: 'Hari Raya Nyepi' },
  { date: '2024-03-29', name: 'Wafat Isa Al Masih' },
  { date: '2024-04-10', name: 'Hari Raya Idul Fitri' },
  { date: '2024-04-11', name: 'Hari Raya Idul Fitri' },
  { date: '2024-05-01', name: 'Hari Buruh Internasional' },
  { date: '2024-05-09', name: 'Kenaikan Isa Al Masih' },
  { date: '2024-05-23', name: 'Hari Raya Waisak' },
  { date: '2024-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2024-06-17', name: 'Hari Raya Idul Adha' },
  { date: '2024-07-07', name: 'Tahun Baru Islam' },
  { date: '2024-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2024-09-16', name: 'Maulid Nabi Muhammad SAW' },
  { date: '2024-12-25', name: 'Hari Raya Natal' },
]

// Indonesian ID (KTP) validation
export function validateKTP(ktp: string): boolean {
  // Remove any non-digit characters
  const cleaned = ktp.replace(/\D/g, '')
  
  // KTP must be exactly 16 digits
  if (cleaned.length !== 16) return false
  
  // Basic format validation (province, regency, district codes)
  const provinceCode = cleaned.substring(0, 2)
  const regencyCode = cleaned.substring(2, 4)
  const districtCode = cleaned.substring(4, 6)
  
  // Province code should be between 11-94
  const province = parseInt(provinceCode)
  if (province < 11 || province > 94) return false
  
  // Regency and district codes should not be 00
  if (regencyCode === '00' || districtCode === '00') return false
  
  return true
}

// Format KTP for display
export function formatKTP(ktp: string): string {
  const cleaned = ktp.replace(/\D/g, '')
  if (cleaned.length !== 16) return ktp
  
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{6})(\d{4})/, '$1.$2.$3.$4.$5')
}

// Indonesian phone number validation and formatting
export function validateIndonesianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  
  // Indonesian mobile: +62, 62, or 0 followed by 8-12 digits
  const mobileRegex = /^(\+62|62|0)(8[1-9])\d{6,10}$/
  // Indonesian landline: +62, 62, or 0 followed by area code and number
  const landlineRegex = /^(\+62|62|0)(2[1-9]|6[1-9])\d{6,8}$/
  
  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned)
}

export function formatIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.slice(1)}`
  } else {
    return `+62${cleaned}`
  }
}