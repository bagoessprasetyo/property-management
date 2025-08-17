'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'
import { Loader2, Hotel } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-brown-50 via-white to-terracotta-50">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-warm-brown-600 rounded-2xl mb-4">
          <Hotel className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          InnSync
        </h1>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Memuat...</span>
        </div>
      </div>
    </div>
  )
}
