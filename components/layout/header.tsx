'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { formatDate, getCurrentWIBTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Command,
  Home,
  ChevronRight
} from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
  onCommandClick: () => void
}

export function Header({ onMenuClick, onCommandClick }: HeaderProps) {
  const { user, signOut } = useAuth()
  const [notifications] = useState([
    {
      id: 1,
      title: 'Check-in Baru',
      message: 'Budi Santoso telah check-in ke kamar 201',
      time: '5 menit yang lalu',
      unread: true,
    },
    {
      id: 2,
      title: 'Pembayaran Diterima',
      message: 'Pembayaran untuk reservasi #1234 telah dikonfirmasi',
      time: '15 menit yang lalu',
      unread: true,
    },
    {
      id: 3,
      title: 'Housekeeping Selesai',
      message: 'Kamar 305 telah selesai dibersihkan',
      time: '30 menit yang lalu',
      unread: false,
    },
  ])

  const unreadCount = notifications.filter(n => n.unread).length
  const currentTime = getCurrentWIBTime()

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Dashboard</span>
          </nav>

          {/* Date and time */}
          <div className="hidden md:block text-sm text-gray-600">
            {formatDate(currentTime, 'EEEE, dd MMMM yyyy')} • {formatDate(currentTime, 'HH:mm')} WIB
          </div>
        </div>

        {/* Right side - Search, notifications, user menu */}
        <div className="flex items-center space-x-4">
          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center space-x-2 w-64 justify-start text-gray-500"
            onClick={onCommandClick}
          >
            <Search className="w-4 h-4" />
            <span>Cari tamu, kamar, booking...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </Button>

          {/* Search icon for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={onCommandClick}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifikasi
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} baru</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.slice(0, 3).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex-col items-start space-y-1 p-3">
                  <div className="flex items-center space-x-2 w-full">
                    <span className="font-medium text-sm">{notification.title}</span>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400">{notification.time}</p>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600 cursor-pointer">
                Lihat semua notifikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-warm-brown-600 text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin Hotel</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}