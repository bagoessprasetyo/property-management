'use client'

import { useQueryClient } from '@tanstack/react-query'
// Removed property context for single property setup
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Smart prefetching hook that anticipates user actions and preloads data
 * Based on current page and user patterns
 * Currently simplified for single property setup
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient()
  // Removed currentProperty for single property setup
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Smart prefetching temporarily disabled for single property setup
    // This can be re-enabled later with simplified logic that doesn't depend on propertyId
    console.log('Smart prefetch disabled for single property setup')
  }, [pathname, queryClient])
}