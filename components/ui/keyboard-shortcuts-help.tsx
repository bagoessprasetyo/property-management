'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Keyboard,
  Command,
  Navigation,
  Plus,
  Search,
  Calendar,
  Users,
  Bed,
  ClipboardList,
  TrendingUp,
  Settings,
  Home
} from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Help shortcut: Cmd+? or Ctrl+?
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      
      // Close on Escape
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const shortcutGroups = [
    {
      title: 'Command Palette & Search',
      icon: Command,
      shortcuts: [
        { keys: ['⌘', 'K'], description: 'Buka/tutup Command Palette' },
        { keys: ['⌘', '/'], description: 'Buka Command Palette (alternatif)' },
        { keys: ['⌘', '?'], description: 'Tampilkan bantuan keyboard shortcuts' },
        { keys: ['Esc'], description: 'Tutup dialog atau palette' }
      ]
    },
    {
      title: 'Navigasi Cepat',
      icon: Navigation,
      shortcuts: [
        { keys: ['⌘', '⇧', 'D'], description: 'Dashboard', icon: Home },
        { keys: ['⌘', '⇧', 'R'], description: 'Reservasi', icon: Calendar },
        { keys: ['⌘', '⇧', 'G'], description: 'Daftar Tamu', icon: Users },
        { keys: ['⌘', '⇧', 'K'], description: 'Manajemen Kamar', icon: Bed },
        { keys: ['⌘', '⇧', 'H'], description: 'Housekeeping', icon: ClipboardList },
        { keys: ['⌘', '⇧', 'P'], description: 'Laporan & Analitik', icon: TrendingUp }
      ]
    },
    {
      title: 'Aksi Cepat',
      icon: Plus,
      shortcuts: [
        { keys: ['⌘', 'N'], description: 'Booking/Reservasi Baru' },
        { keys: ['⌘', 'E'], description: 'Edit item terpilih' },
        { keys: ['⌘', 'S'], description: 'Simpan perubahan' },
        { keys: ['⌘', 'Enter'], description: 'Konfirmasi aksi' }
      ]
    }
  ]

  const KeyBadge = ({ children }: { children: React.ReactNode }) => (
    <Badge variant="outline" className="px-2 py-1 font-mono text-xs bg-gray-50">
      {children}
    </Badge>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Keyboard className="w-5 h-5 mr-2" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Gunakan shortcuts ini untuk navigasi dan aksi yang lebih cepat di InnSync
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcutGroups.map((group, groupIndex) => {
            const GroupIcon = group.icon
            return (
              <Card key={groupIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <GroupIcon className="w-5 h-5 mr-2" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                          {'icon' in shortcut && shortcut.icon && <shortcut.icon className="w-4 h-4 mr-2 text-gray-500" />}
                          <span className="text-sm">{shortcut.description}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <KeyBadge key={keyIndex}>{key}</KeyBadge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Platform specific note */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Catatan Platform:</p>
                  <p>Pada Windows/Linux, gunakan <KeyBadge>Ctrl</KeyBadge> sebagai pengganti <KeyBadge>⌘</KeyBadge></p>
                  <p className="mt-1">Tekan <KeyBadge>⌘</KeyBadge><KeyBadge>?</KeyBadge> kapan saja untuk membuka panduan ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}