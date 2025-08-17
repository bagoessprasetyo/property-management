'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isCollapsed: boolean
  setIsOpen: (open: boolean) => void
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false) // For mobile sidebar
  const [isCollapsed, setIsCollapsed] = useState(false) // For desktop sidebar

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('innSync:sidebarCollapsed')
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
    }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('innSync:sidebarCollapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const toggleCollapsed = () => setIsCollapsed(!isCollapsed)

  const value = {
    isOpen,
    isCollapsed,
    setIsOpen,
    setIsCollapsed,
    toggleSidebar,
    toggleCollapsed,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}