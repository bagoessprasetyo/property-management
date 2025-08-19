// Room export utilities for various formats

import { formatIDR } from './currency'

export interface ExportRoomData {
  room_number: string
  room_type: string
  capacity: number
  base_rate: number
  floor?: number
  size_sqm?: number
  bed_type?: string
  status: string
  is_active: boolean
  is_smoking_allowed: boolean
  amenities?: string[]
  description?: string
  created_at: string
}

export function exportRoomsToCSV(rooms: any[]): string {
  const headers = [
    'Nomor Kamar',
    'Tipe Kamar', 
    'Kapasitas',
    'Tarif Dasar',
    'Lantai',
    'Luas (m²)',
    'Tipe Kasur',
    'Status',
    'Status Operasional',
    'Merokok Diizinkan',
    'Fasilitas',
    'Deskripsi',
    'Tanggal Dibuat'
  ]

  const csvContent = [
    headers.join(','),
    ...rooms.map(room => {
      const amenitiesList = Array.isArray(room.amenities) ? room.amenities.join('; ') : ''
      const row = [
        `"${room.room_number}"`,
        `"${room.room_type}"`,
        room.capacity,
        room.base_rate,
        room.floor || '',
        room.size_sqm || '',
        `"${room.bed_type || ''}"`,
        `"${getStatusLabel(room.status)}"`,
        room.is_active ? 'Aktif' : 'Tidak Aktif',
        room.is_smoking_allowed ? 'Ya' : 'Tidak',
        `"${amenitiesList}"`,
        `"${(room.description || '').replace(/"/g, '""')}"`,
        new Date(room.created_at).toLocaleDateString('id-ID')
      ]
      return row.join(',')
    })
  ].join('\n')

  return csvContent
}

export function exportRoomsToJSON(rooms: any[]): string {
  const exportData = rooms.map(room => ({
    room_number: room.room_number,
    room_type: room.room_type,
    capacity: room.capacity,
    base_rate: room.base_rate,
    floor: room.floor,
    size_sqm: room.size_sqm,
    bed_type: room.bed_type,
    status: room.status,
    is_active: room.is_active,
    is_smoking_allowed: room.is_smoking_allowed,
    amenities: room.amenities || [],
    description: room.description,
    created_at: room.created_at
  }))

  return JSON.stringify({ 
    exported_at: new Date().toISOString(),
    total_rooms: rooms.length,
    rooms: exportData 
  }, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportRoomsAsCSV(rooms: any[], propertyName: string = 'property') {
  const csvContent = exportRoomsToCSV(rooms)
  const filename = `${propertyName}-rooms-${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
}

export function exportRoomsAsJSON(rooms: any[], propertyName: string = 'property') {
  const jsonContent = exportRoomsToJSON(rooms)
  const filename = `${propertyName}-rooms-${new Date().toISOString().split('T')[0]}.json`
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;')
}

export function exportRoomsAsExcel(rooms: any[], propertyName: string = 'property') {
  // Simple Excel export using CSV format with .xlsx extension
  // For full Excel support, would need a library like xlsx or exceljs
  const csvContent = exportRoomsToCSV(rooms)
  const filename = `${propertyName}-rooms-${new Date().toISOString().split('T')[0]}.xlsx`
  downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

function getStatusLabel(status: string): string {
  const statusMap = {
    clean: 'Bersih',
    dirty: 'Kotor',
    inspected: 'Diperiksa',
    out_of_order: 'Perbaikan'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

export function generateRoomAnalyticsReport(rooms: any[]): string {
  const totalRooms = rooms.length
  const activeRooms = rooms.filter(r => r.is_active).length
  const cleanRooms = rooms.filter(r => r.status === 'clean').length
  const averageRate = rooms.reduce((sum, room) => sum + room.base_rate, 0) / totalRooms

  const report = `
LAPORAN ANALISA KAMAR
========================

Tanggal Export: ${new Date().toLocaleDateString('id-ID')}

RINGKASAN UMUM:
- Total Kamar: ${totalRooms}
- Kamar Aktif: ${activeRooms}
- Kamar Bersih: ${cleanRooms}
- Tarif Rata-rata: ${formatIDR(averageRate)}

DISTRIBUSI TIPE KAMAR:
${getRoomTypeDistribution(rooms)}

DISTRIBUSI STATUS:
${getStatusDistribution(rooms)}

DISTRIBUSI LANTAI:
${getFloorDistribution(rooms)}

FASILITAS POPULER:
${getAmenityPopularity(rooms)}
`

  return report.trim()
}

function getRoomTypeDistribution(rooms: any[]): string {
  const typeCount = rooms.reduce((acc, room) => {
    acc[room.room_type] = (acc[room.room_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(typeCount)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .map(([type, count]) => `- ${type}: ${count} kamar`)
    .join('\n')
}

function getStatusDistribution(rooms: any[]): string {
  const statusCount = rooms.reduce((acc, room) => {
    const status = getStatusLabel(room.status)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(statusCount)
    .map(([status, count]) => `- ${status}: ${count} kamar`)
    .join('\n')
}

function getFloorDistribution(rooms: any[]): string {
  const floorCount = rooms.reduce((acc, room) => {
    if (room.floor) {
      acc[room.floor] = (acc[room.floor] || 0) + 1
    }
    return acc
  }, {} as Record<number, number>)

  return Object.entries(floorCount)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([floor, count]) => `- Lantai ${floor}: ${count} kamar`)
    .join('\n')
}

function getAmenityPopularity(rooms: any[]): string {
  const amenityCount = rooms.reduce((acc, room) => {
    if (room.amenities && Array.isArray(room.amenities)) {
      room.amenities.forEach((amenity: string) => {
        acc[amenity] = (acc[amenity] || 0) + 1
      })
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(amenityCount)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([amenity, count]) => `- ${amenity}: ${count} kamar`)
    .join('\n')
}

export function exportRoomAnalyticsReport(rooms: any[], propertyName: string = 'property') {
  const report = generateRoomAnalyticsReport(rooms)
  const filename = `${propertyName}-room-analysis-${new Date().toISOString().split('T')[0]}.txt`
  downloadFile(report, filename, 'text/plain;charset=utf-8;')
}