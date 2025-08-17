'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useProperty } from '@/lib/context/property-context'
import { useAuth } from '@/lib/context/auth-context'
import { useSidebar } from '@/lib/context/sidebar-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Hotel,
  LayoutDashboard,
  Calendar,
  Users,
  Bed,
  ClipboardList,
  CreditCard,
  Settings,
  FileText,
  TrendingUp,
  ChevronLeft,
  Menu,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    count: null,
  },
  {
    name: 'Kalender Reservasi',
    href: '/dashboard/reservations',
    icon: Calendar,
    count: 3, // New bookings
  },
  {
    name: 'Tamu',
    href: '/dashboard/guests',
    icon: Users,
    count: null,
  },
  {
    name: 'Kamar',
    href: '/dashboard/rooms',
    icon: Bed,
    count: null,
  },
  {
    name: 'Housekeeping',
    href: '/dashboard/housekeeping',
    icon: ClipboardList,
    count: 5, // Pending tasks
  },
  {
    name: 'Pembayaran',
    href: '/dashboard/payments',
    icon: CreditCard,
    count: null,
  },
  {
    name: 'Laporan',
    href: '/dashboard/reports',
    icon: FileText,
    count: null,
  },
  {
    name: 'Analitik',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    count: null,
  },
  {
    name: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
    count: null,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { currentProperty } = useProperty()
  const { user, signOut } = useAuth()
  const { isOpen, isCollapsed, setIsOpen, toggleCollapsed } = useSidebar()

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Hotel className="w-8 h-8 text-warm-brown-600" />
          {(!isCollapsed || mobile) && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">InnSync</h1>
              <p className="text-xs text-gray-500">{currentProperty?.name || 'Loading...'}</p>
            </div>
          )}
        </div>
        {!mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="p-2"
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-warm-brown-100 text-warm-brown-900 border border-warm-brown-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                onClick={() => mobile && setIsOpen(false)}
              >
                <item.icon className={cn(
                  "flex-shrink-0 w-5 h-5",
                  isCollapsed && !mobile ? "mr-0" : "mr-3"
                )} />
                {(!isCollapsed || mobile) && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.count && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto bg-warm-brown-100 text-warm-brown-700"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User info and logout */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-warm-brown-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          {(!isCollapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        
        {(!isCollapsed || mobile) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        )}
        
        {isCollapsed && !mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full p-2 justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col bg-white border-r border-gray-200 transition-all duration-300 h-full",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        className
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>
    </>
  )
}