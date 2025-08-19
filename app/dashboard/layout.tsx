'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth-context'
import { useProperty } from '@/lib/context/property-context'
import { useSidebar } from '@/lib/context/sidebar-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { CommandPalette } from '@/components/layout/command-palette'
import { PropertySetupWizard } from '@/components/setup/property-setup-wizard'
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help'
import { useSmartPrefetch } from '@/lib/hooks/use-smart-prefetch'
import { ErrorBoundary } from '@/components/error/error-boundary'
import { NetworkStatusIndicator } from '@/components/ui/smart-loader'
import { usePerformanceMonitor, usePageLoadMonitor, useInteractionMonitor } from '@/lib/hooks/use-performance-monitor'
import { useLogger } from '@/lib/utils/logger'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const { properties, loading: propertyLoading } = useProperty()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [commandOpen, setCommandOpen] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Enable smart prefetching for better performance
  useSmartPrefetch()

  // Performance monitoring
  usePageLoadMonitor('dashboard')
  useInteractionMonitor()
  
  // Component logging
  const logger = useLogger('DashboardLayout')

  const loading = authLoading || propertyLoading

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-brown-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // This will be handled by middleware
  }

  // Show setup wizard if no properties exist
  if (!loading && properties.length === 0 && !showSetup) {
    setShowSetup(true)
  }

  if (showSetup && properties.length === 0) {
    return <PropertySetupWizard onComplete={() => setShowSetup(false)} />
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        
        {/* Main content */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300",
          // Adjust margin based on sidebar state on desktop
          "lg:ml-0" // Reset any margin, let flex handle the layout
        )}>
          {/* Header */}
          <ErrorBoundary>
            <Header 
              onMenuClick={toggleSidebar}
              onCommandClick={() => setCommandOpen(true)}
            />
          </ErrorBoundary>
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette 
          open={commandOpen} 
          onOpenChange={setCommandOpen}
          onShortcutsOpen={() => setShortcutsOpen(true)}
        />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />

        {/* Network Status Indicator */}
        <NetworkStatusIndicator />
      </div>
    </ErrorBoundary>
  )
}