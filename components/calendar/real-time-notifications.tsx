'use client'

import { useState } from 'react'
import { useRealtime } from './real-time-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  X
} from 'lucide-react'

interface RealtimeNotificationsProps {
  className?: string
}

export function RealtimeNotifications({ className }: RealtimeNotificationsProps) {
  const { 
    isConnected, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    connectionStatus 
  } = useRealtime()
  const [isOpen, setIsOpen] = useState(false)

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-600" />
      case 'connecting':
        return <AlertCircle className="w-3 h-3 text-yellow-600 animate-pulse" />
      case 'error':
        return <WifiOff className="w-3 h-3 text-red-600" />
      default:
        return <WifiOff className="w-3 h-3 text-gray-400" />
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation_created':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'reservation_updated':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'status_changed':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'reservation_cancelled':
        return <X className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} hari lalu`
    if (hours > 0) return `${hours} jam lalu`
    if (minutes > 0) return `${minutes} menit lalu`
    return 'Baru saja'
  }

  const handleNotificationClick = (notification: any) => {
    if (!('read' in notification) || !notification.read) {
      markAsRead(notification.id)
    }
  }

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
          >
            {unreadCount > 0 ? (
              <BellRing className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifikasi Real-time</span>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'Terhubung' : 
                 connectionStatus === 'connecting' ? 'Menghubungkan...' :
                 connectionStatus === 'error' ? 'Error' : 'Terputus'}
              </span>
            </div>
          </DropdownMenuLabel>
          
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-gray-500">
                  {notifications.length} notifikasi
                </span>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={markAllAsRead}
                    >
                      Tandai Semua
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={clearNotifications}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const isUnread = !('read' in notification) || !notification.read
                  
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${
                        isUnread ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}