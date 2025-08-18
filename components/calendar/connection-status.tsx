'use client'

import { useRealtime } from './real-time-provider'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface ConnectionStatusProps {
  className?: string
  showText?: boolean
}

export function ConnectionStatus({ className, showText = true }: ConnectionStatusProps) {
  const { connectionStatus, isConnected } = useRealtime()

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Terhubung',
          description: 'Sistem sedang menerima pembaruan real-time'
        }
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Menghubungkan',
          description: 'Sedang mencoba terhubung ke server'
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Error',
          description: 'Terjadi masalah koneksi, data mungkin tidak real-time'
        }
      default:
        return {
          icon: WifiOff,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Terputus',
          description: 'Tidak terhubung ke server real-time'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className} transition-all duration-200`}
    >
      <Icon 
        className={`w-3 h-3 ${showText ? 'mr-1' : ''} ${
          connectionStatus === 'connecting' ? 'animate-spin' : ''
        }`} 
      />
      {showText && (
        <span className="text-xs font-medium">{config.text}</span>
      )}
    </Badge>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
          {connectionStatus === 'connected' && (
            <p className="text-xs text-gray-400 mt-1">
              Pembaruan otomatis setiap 30 detik
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}