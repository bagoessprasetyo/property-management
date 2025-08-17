export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string | null
          country: string
          postal_code: string | null
          phone: string | null
          email: string | null
          description: string | null
          total_rooms: number
          amenities: Json
          settings: Json
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state?: string | null
          country?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          description?: string | null
          total_rooms?: number
          amenities?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string | null
          country?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          description?: string | null
          total_rooms?: number
          amenities?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          property_id: string
          room_number: string
          room_type: string
          floor: number | null
          capacity: number
          base_rate: number
          amenities: Json
          status: Database['public']['Enums']['room_status']
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          property_id: string
          room_number: string
          room_type: string
          floor?: number | null
          capacity?: number
          base_rate: number
          amenities?: Json
          status?: Database['public']['Enums']['room_status']
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          property_id?: string
          room_number?: string
          room_type?: string
          floor?: number | null
          capacity?: number
          base_rate?: number
          amenities?: Json
          status?: Database['public']['Enums']['room_status']
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          }
        ]
      }
      guests: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          date_of_birth: string | null
          identification_type: string | null
          identification_number: string | null
          preferences: Json
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          date_of_birth?: string | null
          identification_type?: string | null
          identification_number?: string | null
          preferences?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          date_of_birth?: string | null
          identification_type?: string | null
          identification_number?: string | null
          preferences?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          property_id: string
          room_id: string
          guest_id: string
          confirmation_number: string
          check_in_date: string
          check_out_date: string
          adults: number
          children: number
          total_nights: number
          rate_per_night: number
          total_amount: number
          tax_amount: number
          status: Database['public']['Enums']['booking_status']
          special_requests: string | null
          notes: string | null
          source: string
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          property_id: string | undefined
          room_id: string
          guest_id: string
          confirmation_number?: string
          check_in_date: string
          check_out_date: string
          adults?: number
          children?: number
          rate_per_night: number
          total_amount: number
          tax_amount?: number
          status?: Database['public']['Enums']['booking_status']
          special_requests?: string | null
          notes?: string | null
          source?: string
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          property_id?: string
          room_id?: string
          guest_id?: string
          confirmation_number?: string
          check_in_date?: string
          check_out_date?: string
          adults?: number
          children?: number
          rate_per_night?: number
          total_amount?: number
          tax_amount?: number
          status?: Database['public']['Enums']['booking_status']
          special_requests?: string | null
          notes?: string | null
          source?: string
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          currency: string
          payment_method: Database['public']['Enums']['payment_method']
          payment_date: string
          status: Database['public']['Enums']['payment_status']
          transaction_id: string | null
          payment_gateway: string | null
          gateway_response: Json
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          currency?: string
          payment_method: Database['public']['Enums']['payment_method']
          payment_date?: string
          status?: Database['public']['Enums']['payment_status']
          transaction_id?: string | null
          payment_gateway?: string | null
          gateway_response?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          currency?: string
          payment_method?: Database['public']['Enums']['payment_method']
          payment_date?: string
          status?: Database['public']['Enums']['payment_status']
          transaction_id?: string | null
          payment_gateway?: string | null
          gateway_response?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      housekeeping: {
        Row: {
          id: string
          property_id: string
          room_id: string
          assigned_to: string | null
          task_type: string
          priority: number
          estimated_duration: number | null
          actual_duration: number | null
          status: string
          scheduled_date: string
          scheduled_time: string | null
          completed_at: string | null
          notes: string | null
          checklist: Json
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          property_id: string
          room_id: string
          assigned_to?: string | null
          task_type?: string
          priority?: number
          estimated_duration?: number | null
          actual_duration?: number | null
          status?: string
          scheduled_date?: string
          scheduled_time?: string | null
          completed_at?: string | null
          notes?: string | null
          checklist?: Json
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          property_id?: string
          room_id?: string
          assigned_to?: string | null
          task_type?: string
          priority?: number
          estimated_duration?: number | null
          actual_duration?: number | null
          status?: string
          scheduled_date?: string
          scheduled_time?: string | null
          completed_at?: string | null
          notes?: string | null
          checklist?: Json
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      staff: {
        Row: {
          id: string
          property_id: string
          user_id: string | null
          employee_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          role: string
          department: string | null
          hire_date: string | null
          hourly_rate: number | null
          is_active: boolean
          permissions: Json
          schedule: Json
          emergency_contact: Json
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          property_id: string
          user_id?: string | null
          employee_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          role: string
          department?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          is_active?: boolean
          permissions?: Json
          schedule?: Json
          emergency_contact?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string | null
          employee_id?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          role?: string
          department?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          is_active?: boolean
          permissions?: Json
          schedule?: Json
          emergency_contact?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          property_id: string
          category: Database['public']['Enums']['expense_category']
          subcategory: string | null
          amount: number
          currency: string
          vendor: string | null
          description: string
          expense_date: string
          receipt_url: string | null
          approved_by: string | null
          approved_at: string | null
          is_recurring: boolean
          recurring_pattern: Json
          tags: Json
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          property_id: string
          category: Database['public']['Enums']['expense_category']
          subcategory?: string | null
          amount: number
          currency?: string
          vendor?: string | null
          description: string
          expense_date?: string
          receipt_url?: string | null
          approved_by?: string | null
          approved_at?: string | null
          is_recurring?: boolean
          recurring_pattern?: Json
          tags?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          property_id?: string
          category?: Database['public']['Enums']['expense_category']
          subcategory?: string | null
          amount?: number
          currency?: string
          vendor?: string | null
          description?: string
          expense_date?: string
          receipt_url?: string | null
          approved_by?: string | null
          approved_at?: string | null
          is_recurring?: boolean
          recurring_pattern?: Json
          tags?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
      room_status: 'clean' | 'dirty' | 'inspected' | 'out_of_order'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
      payment_method: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'digital_wallet'
      expense_category: 'maintenance' | 'utilities' | 'supplies' | 'marketing' | 'staff' | 'insurance' | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}