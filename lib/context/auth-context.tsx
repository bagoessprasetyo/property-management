'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle navigation based on auth state
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Translate common auth errors to Indonesian
        const translatedError = translateAuthError(error.message)
        return { error: { ...error, message: translatedError } }
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.' 
        } 
      }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        const translatedError = translateAuthError(error.message)
        return { error: { ...error, message: translatedError } }
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.' 
        } 
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        const translatedError = translateAuthError(error.message)
        return { error: { ...error, message: translatedError } }
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: 'Terjadi kesalahan saat mengirim email reset. Silakan coba lagi.' 
        } 
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to translate auth errors to Indonesian
function translateAuthError(errorMessage: string): string {
  const errorTranslations: Record<string, string> = {
    'Invalid login credentials': 'Email atau kata sandi salah',
    'Email not confirmed': 'Email belum dikonfirmasi. Periksa kotak masuk Anda.',
    'Password should be at least 6 characters': 'Kata sandi harus minimal 6 karakter',
    'User already registered': 'Pengguna sudah terdaftar dengan email ini',
    'Invalid email': 'Format email tidak valid',
    'Signup requires a valid password': 'Pendaftaran memerlukan kata sandi yang valid',
    'User not found': 'Pengguna tidak ditemukan',
    'Too many requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
    'Email rate limit exceeded': 'Batas email terlampaui. Silakan tunggu beberapa menit.',
    'Invalid refresh token': 'Sesi telah berakhir. Silakan masuk kembali.',
    'Email address not authorized': 'Alamat email tidak diotorisasi untuk menggunakan aplikasi ini',
    'Database error saving new user': 'Terjadi kesalahan saat menyimpan data pengguna baru',
    'Weak password': 'Kata sandi terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.',
  }

  // Try to find exact match first
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage]
  }

  // Try to find partial matches
  for (const [englishError, indonesianError] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(englishError.toLowerCase())) {
      return indonesianError
    }
  }

  // Default fallback
  return 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.'
}