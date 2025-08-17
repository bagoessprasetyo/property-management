import { z } from 'zod'

/**
 * Common validation schemas for the application
 */

// Base validations with Indonesian locale
export const baseValidations = {
  email: z
    .string()
    .email('Format email tidak valid')
    .min(1, 'Email harus diisi'),
  
  phone: z
    .string()
    .min(1, 'Nomor telepon harus diisi')
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Format nomor telepon Indonesia tidak valid'),
  
  required: (fieldName: string) => z
    .string()
    .min(1, `${fieldName} harus diisi`),
  
  optionalString: z.string().optional(),
  
  positiveNumber: (fieldName: string) => z
    .number({ message: `${fieldName} harus berupa angka` })
    .positive(`${fieldName} harus lebih dari 0`),
  
  nonNegativeNumber: (fieldName: string) => z
    .number({ message: `${fieldName} harus berupa angka` })
    .min(0, `${fieldName} tidak boleh negatif`),
  
  date: z
    .string()
    .min(1, 'Tanggal harus diisi')
    .refine((date) => !isNaN(Date.parse(date)), 'Format tanggal tidak valid'),
  
  futureDate: z
    .string()
    .min(1, 'Tanggal harus diisi')
    .refine((date) => {
      const inputDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return inputDate >= today
    }, 'Tanggal harus hari ini atau yang akan datang'),
  
  pastDate: z
    .string()
    .min(1, 'Tanggal harus diisi')
    .refine((date) => {
      const inputDate = new Date(date)
      const today = new Date()
      return inputDate <= today
    }, 'Tanggal tidak boleh di masa depan')
}

// Guest validation schema
export const guestSchema = z.object({
  first_name: baseValidations.required('Nama depan'),
  last_name: baseValidations.required('Nama belakang'),
  email: baseValidations.email,
  phone: baseValidations.phone,
  id_type: z.enum(["ktp", "passport", "sim", "other"], {
    message: "Invalid document type",
  }),
  id_number: baseValidations.required('Nomor identitas'),
  nationality: baseValidations.required('Kewarganegaraan'),
  date_of_birth: baseValidations.pastDate,
  address: baseValidations.optionalString,
  city: baseValidations.optionalString,
  country: baseValidations.required('Negara'),
  notes: baseValidations.optionalString
})

// Room validation schema
export const roomSchema = z.object({
  room_number: baseValidations.required('Nomor kamar'),
  room_type: baseValidations.required('Tipe kamar'),
  floor: baseValidations.positiveNumber('Lantai'),
  max_occupancy: baseValidations.positiveNumber('Kapasitas maksimum'),
  base_rate: baseValidations.positiveNumber('Tarif dasar'),
  description: baseValidations.optionalString,
  amenities: z.array(z.string()).optional(),
  status: z.enum(['clean', 'dirty', 'inspected', 'out_of_order'], {
    message: 'Status kamar tidak valid'
  }),
  is_active: z.boolean().default(true)
})

// Reservation validation schema
export const reservationSchema = z.object({
  guest_id: baseValidations.required('Tamu harus dipilih'),
  room_id: baseValidations.required('Kamar harus dipilih'),
  check_in_date: baseValidations.futureDate,
  check_out_date: baseValidations.futureDate,
  adults: baseValidations.positiveNumber('Jumlah dewasa'),
  children: baseValidations.nonNegativeNumber('Jumlah anak'),
  special_requests: baseValidations.optionalString,
  source: z.enum(['direct', 'booking_com', 'agoda', 'airbnb', 'walk_in', 'phone', 'email', 'other'], {
    message: 'Sumber booking harus dipilih'
  }),
  total_amount: baseValidations.positiveNumber('Total pembayaran'),
  notes: baseValidations.optionalString
}).refine((data) => {
  const checkIn = new Date(data.check_in_date)
  const checkOut = new Date(data.check_out_date)
  return checkOut > checkIn
}, {
  message: 'Tanggal check-out harus setelah tanggal check-in',
  path: ['check_out_date']
}).refine((data) => {
  const checkIn = new Date(data.check_in_date)
  const checkOut = new Date(data.check_out_date)
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}, {
  message: 'Masa menginap tidak boleh lebih dari 30 hari',
  path: ['check_out_date']
})

// Payment validation schema
export const paymentSchema = z.object({
  reservation_id: baseValidations.required('Reservasi harus dipilih'),
  amount: baseValidations.positiveNumber('Jumlah pembayaran'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'ewallet', 'qris'], {
    message: 'Metode pembayaran harus dipilih'
  }),
  payment_date: baseValidations.date,
  reference_number: baseValidations.optionalString,
  notes: baseValidations.optionalString
})

// Property validation schema
export const propertySchema = z.object({
  name: baseValidations.required('Nama properti'),
  address: baseValidations.required('Alamat'),
  city: baseValidations.required('Kota'),
  state: baseValidations.required('Provinsi'),
  country: baseValidations.required('Negara'),
  postal_code: baseValidations.required('Kode pos'),
  phone: baseValidations.phone,
  email: baseValidations.email,
  website: z.string().url('Format website tidak valid').optional().or(z.literal('')),
  total_rooms: baseValidations.positiveNumber('Total kamar'),
  property_type: z.enum(['hotel', 'motel', 'hostel', 'apartment', 'villa', 'other'], {
    message: 'Jenis properti harus dipilih'
  }),
  star_rating: z.number().min(1).max(5).optional(),
  description: baseValidations.optionalString
})

/**
 * Validation error handler
 */
export function handleValidationError(error: z.ZodError) {
  const errors: Record<string, string> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

/**
 * Safe validation function that returns either data or errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: handleValidationError(error) }
    }
    return { 
      success: false, 
      errors: { general: 'Terjadi kesalahan validasi yang tidak terduga' }
    }
  }
}

/**
 * Business rule validations
 */
export const businessRules = {
  // Check if room is available for given dates
  isRoomAvailable: (reservations: any[], roomId: string, checkIn: string, checkOut: string, excludeReservationId?: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    const conflictingReservations = reservations.filter(reservation => {
      if (excludeReservationId && reservation.id === excludeReservationId) {
        return false
      }
      
      if (reservation.room_id !== roomId) {
        return false
      }
      
      if (reservation.status === 'cancelled') {
        return false
      }
      
      const reservationCheckIn = new Date(reservation.check_in_date)
      const reservationCheckOut = new Date(reservation.check_out_date)
      
      // Check for date overlap
      return checkInDate < reservationCheckOut && checkOutDate > reservationCheckIn
    })
    
    return {
      available: conflictingReservations.length === 0,
      conflictingReservations
    }
  },

  // Validate guest capacity
  validateGuestCapacity: (adults: number, children: number, roomMaxOccupancy: number) => {
    const totalGuests = adults + children
    return {
      valid: totalGuests <= roomMaxOccupancy,
      message: totalGuests > roomMaxOccupancy 
        ? `Jumlah tamu (${totalGuests}) melebihi kapasitas kamar (${roomMaxOccupancy})`
        : null
    }
  },

  // Validate payment amount
  validatePaymentAmount: (paymentAmount: number, reservationTotal: number, existingPayments: number = 0) => {
    const remainingAmount = reservationTotal - existingPayments
    
    if (paymentAmount <= 0) {
      return { valid: false, message: 'Jumlah pembayaran harus lebih dari 0' }
    }
    
    if (paymentAmount > remainingAmount) {
      return { 
        valid: false, 
        message: `Jumlah pembayaran (${paymentAmount}) melebihi sisa tagihan (${remainingAmount})` 
      }
    }
    
    return { valid: true, message: null }
  },

  // Validate check-in/check-out business rules
  validateReservationDates: (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if check-in is not in the past
    if (checkInDate < today) {
      return { valid: false, message: 'Tanggal check-in tidak boleh di masa lalu' }
    }
    
    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return { valid: false, message: 'Tanggal check-out harus setelah tanggal check-in' }
    }
    
    // Check minimum stay (1 day)
    const diffTime = checkOutDate.getTime() - checkInDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 1) {
      return { valid: false, message: 'Minimal menginap 1 hari' }
    }
    
    // Check maximum stay (30 days for most properties)
    if (diffDays > 30) {
      return { valid: false, message: 'Maksimal menginap 30 hari' }
    }
    
    return { valid: true, message: null }
  }
}

/**
 * Async validation helpers
 */
export const asyncValidations = {
  // Check if email is unique
  checkEmailUnique: async (email: string, excludeId?: string): Promise<boolean> => {
    // In a real app, this would check against your database
    // For now, we'll simulate an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate some emails being taken
        const takenEmails = ['admin@example.com', 'test@example.com']
        resolve(!takenEmails.includes(email.toLowerCase()))
      }, 500)
    })
  },

  // Check if room number is unique within property
  checkRoomNumberUnique: async (roomNumber: string, propertyId: string, excludeId?: string): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true) // For demo, assume it's unique
      }, 300)
    })
  }
}