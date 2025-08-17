'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProperty } from '@/lib/context/property-context'
import { useSearchGuests } from '@/lib/hooks/use-guests'
import { useRooms } from '@/lib/hooks/use-rooms'
import { useReservations } from '@/lib/hooks/use-reservations'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Calendar,
  Users,
  Bed,
  ClipboardList,
  CreditCard,
  Settings,
  FileText,
  TrendingUp,
  Plus,
  Search,
  LogOut,
  Home
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShortcutsOpen?: () => void
}

export function CommandPalette({ open, onOpenChange, onShortcutsOpen }: CommandPaletteProps) {
  const router = useRouter()
  const { currentProperty } = useProperty()
  const [search, setSearch] = useState('')
  
  // Use real data hooks
  const { data: searchGuests } = useSearchGuests(search)
  const { data: rooms } = useRooms(currentProperty?.id)
  const { data: reservations } = useReservations(currentProperty?.id)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command Palette toggle
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      
      // Quick navigation shortcuts (when command palette is closed)
      if (!open) {
        // New booking: Cmd+N / Ctrl+N
        if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          router.push('/dashboard/reservations?action=new')
        }
        
        // Quick search: Cmd+/ or Ctrl+/
        if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          onOpenChange(true)
        }
        
        // Navigate to sections with Cmd+Shift+[key]
        if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
          switch (e.key) {
            case 'D':
              e.preventDefault()
              router.push('/dashboard')
              break
            case 'R':
              e.preventDefault()
              router.push('/dashboard/reservations')
              break
            case 'G':
              e.preventDefault()
              router.push('/dashboard/guests')
              break
            case 'K':
              e.preventDefault()
              router.push('/dashboard/rooms')
              break
            case 'H':
              e.preventDefault()
              router.push('/dashboard/housekeeping')
              break
            case 'P':
              e.preventDefault()
              router.push('/dashboard/reports')
              break
          }
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange, router])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  // Filter real data based on search
  const filteredGuests = searchGuests || []
  
  const filteredRooms = rooms?.filter(room =>
    search.length > 0 && (
      room.room_number.includes(search) ||
      room.room_type.toLowerCase().includes(search.toLowerCase())
    )
  ) || []
  
  const filteredReservations = reservations?.filter(reservation =>
    search.length > 0 && (
      reservation.confirmation_number?.toLowerCase().includes(search.toLowerCase()) ||
      reservation.guests?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      reservation.guests?.last_name?.toLowerCase().includes(search.toLowerCase())
    )
  ).slice(0, 3) || [] // Limit to 3 results

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Ketik perintah atau cari..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
        
        {search.length === 0 && (
          <>
            <CommandGroup heading="Navigasi Cepat">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                <Home className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Dashboard</span>
                  <span className="text-xs text-gray-500">⌘⇧D</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reservations'))}>
                <Calendar className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Kalender Reservasi</span>
                  <span className="text-xs text-gray-500">⌘⇧R</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/guests'))}>
                <Users className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Daftar Tamu</span>
                  <span className="text-xs text-gray-500">⌘⇧G</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/rooms'))}>
                <Bed className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Manajemen Kamar</span>
                  <span className="text-xs text-gray-500">⌘⇧K</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/housekeeping'))}>
                <ClipboardList className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Housekeeping</span>
                  <span className="text-xs text-gray-500">⌘⇧H</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reports'))}>
                <TrendingUp className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Laporan & Analitik</span>
                  <span className="text-xs text-gray-500">⌘⇧P</span>
                </div>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Aksi Cepat">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reservations?action=new'))}>
                <Plus className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Booking Baru</span>
                  <span className="text-xs text-gray-500">⌘N</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reservations?action=check-in'))}>
                <LogOut className="mr-2 h-4 w-4 rotate-180" />
                <span>Check-in Tamu</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reservations?action=check-out'))}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Check-out Tamu</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => onShortcutsOpen?.())}>
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Bantuan Keyboard Shortcuts</span>
                  <span className="text-xs text-gray-500">⌘?</span>
                </div>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Tips Keyboard">
              <CommandItem disabled>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">⌘K atau ⌘/</span>
                    <span>Buka Command Palette</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">⌘N</span>
                    <span>Booking Baru</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">⌘⇧[Letter]</span>
                    <span>Navigasi Cepat</span>
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {search.length > 0 && filteredGuests.length > 0 && (
          <CommandGroup heading="Tamu">
            {filteredGuests.map((guest) => (
              <CommandItem 
                key={guest.id}
                onSelect={() => runCommand(() => router.push(`/dashboard/guests?id=${guest.id}`))}
              >
                <Users className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{guest.first_name} {guest.last_name}</span>
                  <span className="text-xs text-gray-500">
                    {guest.email} • {guest.phone}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {search.length > 0 && filteredRooms.length > 0 && (
          <CommandGroup heading="Kamar">
            {filteredRooms.map((room) => (
              <CommandItem 
                key={room.id}
                onSelect={() => runCommand(() => router.push(`/dashboard/rooms?id=${room.id}`))}
              >
                <Bed className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Kamar {room.room_number}</span>
                  <span className="text-xs text-gray-500">
                    {room.room_type} • {room.status === 'clean' ? 'Bersih' : 
                     room.status === 'dirty' ? 'Kotor' : 
                     room.status === 'inspected' ? 'Sudah Inspeksi' : 'Dalam Perbaikan'}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {search.length > 0 && filteredReservations.length > 0 && (
          <CommandGroup heading="Reservasi">
            {filteredReservations.map((reservation) => (
              <CommandItem 
                key={reservation.id}
                onSelect={() => runCommand(() => router.push(`/dashboard/reservations?id=${reservation.id}`))}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{reservation.confirmation_number}</span>
                  <span className="text-xs text-gray-500">
                    {reservation.guests?.first_name} {reservation.guests?.last_name} • 
                    Kamar {reservation.rooms?.room_number}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {search.length > 0 && filteredGuests.length === 0 && filteredRooms.length === 0 && filteredReservations.length === 0 && (
          <CommandGroup heading="Hasil Pencarian">
            <CommandItem disabled>
              <Search className="mr-2 h-4 w-4" />
              <span>Tidak ada hasil untuk "{search}"</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}