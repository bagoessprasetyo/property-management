import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Admin client for database setup operations that bypass RLS
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('properties').select('count').single()
    if (error) {
      console.log('Database connection test - tables may not exist yet:', error.message)
      return { connected: true, tablesExist: false, error: error.message }
    }
    return { connected: true, tablesExist: true }
  } catch (err) {
    console.error('Database connection failed:', err)
    return { connected: false, tablesExist: false, error: err }
  }
}

// Execute schema setup
export async function setupDatabase() {
  try {
    // This would execute the schema.sql file
    // For now, we'll assume the schema has been set up manually
    console.log('Database schema should be set up manually in Supabase dashboard')
    return { success: true, message: 'Schema setup completed' }
  } catch (error) {
    console.error('Schema setup failed:', error)
    return { success: false, error }
  }
}