'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useProperties } from '@/lib/hooks/use-properties'
import type { Database } from '@/lib/types/database'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyContextType {
  currentProperty: Property | null
  properties: Property[]
  setCurrentProperty: (property: Property | null) => void
  loading: boolean
  error: Error | null
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)
  const { data: properties, isLoading, error } = useProperties()

  // Auto-select first property if none selected
  useEffect(() => {
    if (properties && properties.length > 0 && !currentProperty) {
      // Check localStorage for saved property
      const savedPropertyId = localStorage.getItem('innSync:currentPropertyId')
      
      if (savedPropertyId) {
        const savedProperty = properties.find(p => p.id === savedPropertyId)
        if (savedProperty) {
          setCurrentProperty(savedProperty)
          return
        }
      }
      
      // Default to first property
      setCurrentProperty(properties[0])
    }
  }, [properties, currentProperty])

  // Save current property to localStorage
  useEffect(() => {
    if (currentProperty) {
      localStorage.setItem('innSync:currentPropertyId', currentProperty.id)
    }
  }, [currentProperty])

  const value = {
    currentProperty,
    properties: properties || [],
    setCurrentProperty,
    loading: isLoading,
    error: error as Error | null,
  }

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const context = useContext(PropertyContext)
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider')
  }
  return context
}