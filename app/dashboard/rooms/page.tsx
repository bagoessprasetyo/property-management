'use client'

import { useState, useMemo, useEffect } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { useRooms } from '@/lib/hooks/use-rooms'
import { formatIDR } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Bed, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Settings,
  Users,
  DollarSign,
  Loader2,
  Download,
  Grid3X3,
  List,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Building,
  Wifi,
  Coffee,
  Car,
  Bath,
  Wind,
  Tv,
  Phone,
  Refrigerator,
  MoreHorizontal,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileJson,
  BarChart3,
  HelpCircle,
  Keyboard,
  Cigarette
} from 'lucide-react'
import { RoomForm } from '@/components/rooms/room-form'
import { RoomDetail } from '@/components/rooms/room-detail'
import { RoomAnalytics } from '@/components/rooms/room-analytics'
import { 
  exportRoomsAsCSV, 
  exportRoomsAsJSON, 
  exportRoomsAsExcel, 
  exportRoomAnalyticsReport 
} from '@/lib/utils/room-export'
import { useSidebar } from '@/lib/context/sidebar-context'
import { cn } from '@/lib/utils'

export default function RoomsPage() {
  const { currentProperty } = useProperty()
  const { isCollapsed } = useSidebar()
  const { data: allRooms, isLoading } = useRooms()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [amenityFilter, setAmenityFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [showRoomDetail, setShowRoomDetail] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1)

  // Enhanced filtering logic
  const filteredRooms = useMemo(() => {
    if (!allRooms) return []
    
    return allRooms.filter(room => {
      // Search filter
      const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           room.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter
      
      // Type filter
      const matchesType = typeFilter === 'all' || room.room_type === typeFilter
      
      // Floor filter
      const matchesFloor = floorFilter === 'all' || room.floor?.toString() === floorFilter
      
      // Amenity filter
      const matchesAmenity = amenityFilter === 'all' || 
                            (room.amenities && room.amenities.includes(amenityFilter))
      
      return matchesSearch && matchesStatus && matchesType && matchesFloor && matchesAmenity
    })
  }, [allRooms, searchQuery, statusFilter, typeFilter, floorFilter, amenityFilter])

  // Get filter options
  const roomTypes = Array.from(new Set(allRooms?.map(room => room.room_type) || []))
  const floors = Array.from(new Set(allRooms?.map(room => room.floor).filter(Boolean) || [])).sort((a, b) => a - b)
  const amenities = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'ac', label: 'AC' },
    { id: 'tv', label: 'TV' },
    { id: 'minibar', label: 'Minibar' },
    { id: 'coffee', label: 'Coffee/Tea' },
    { id: 'bathroom', label: 'Kamar Mandi Dalam' },
    { id: 'phone', label: 'Telepon' },
    { id: 'parking', label: 'Parkir' }
  ]

  const rooms = filteredRooms

  const handleViewRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setShowRoomDetail(true)
  }

  const handleEditRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setShowCreateForm(true)
  }

  const handleExport = (format: 'csv' | 'json' | 'excel' | 'report') => {
    const propertyName = currentProperty?.name?.toLowerCase().replace(/\s+/g, '-') || 'property'
    
    switch (format) {
      case 'csv':
        exportRoomsAsCSV(filteredRooms, propertyName)
        break
      case 'json':
        exportRoomsAsJSON(filteredRooms, propertyName)
        break
      case 'excel':
        exportRoomsAsExcel(filteredRooms, propertyName)
        break
      case 'report':
        exportRoomAnalyticsReport(filteredRooms, propertyName)
        break
    }
    
    setShowExportMenu(false)
  }

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + N to create new room
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault()
        setShowCreateForm(true)
      }
      
      // Cmd/Ctrl + E to export
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault()
        setShowExportMenu(true)
      }
      
      // Arrow key navigation for table/grid
      if (event.key === 'ArrowDown' && filteredRooms.length > 0) {
        event.preventDefault()
        if (viewMode === 'table') {
          setSelectedRowIndex(prev => 
            prev < filteredRooms.length - 1 ? prev + 1 : 0
          )
        } else {
          // Grid navigation - move down by 4 items (assuming 4 columns on large screens)
          setSelectedRowIndex(prev => {
            const columns = window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
            const newIndex = prev + columns
            return newIndex < filteredRooms.length ? newIndex : prev
          })
        }
      }
      
      if (event.key === 'ArrowUp' && filteredRooms.length > 0) {
        event.preventDefault()
        if (viewMode === 'table') {
          setSelectedRowIndex(prev => 
            prev > 0 ? prev - 1 : filteredRooms.length - 1
          )
        } else {
          // Grid navigation - move up by 4 items (assuming 4 columns on large screens)
          setSelectedRowIndex(prev => {
            const columns = window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
            const newIndex = prev - columns
            return newIndex >= 0 ? newIndex : prev
          })
        }
      }
      
      // Left/Right arrow keys for grid navigation
      if (event.key === 'ArrowLeft' && filteredRooms.length > 0 && viewMode === 'grid') {
        event.preventDefault()
        setSelectedRowIndex(prev => 
          prev > 0 ? prev - 1 : filteredRooms.length - 1
        )
      }
      
      if (event.key === 'ArrowRight' && filteredRooms.length > 0 && viewMode === 'grid') {
        event.preventDefault()
        setSelectedRowIndex(prev => 
          prev < filteredRooms.length - 1 ? prev + 1 : 0
        )
      }
      
      // Enter to view selected room
      if (event.key === 'Enter' && selectedRowIndex >= 0 && filteredRooms[selectedRowIndex]) {
        event.preventDefault()
        handleViewRoom(filteredRooms[selectedRowIndex].id)
      }
      
      // Escape to clear selection
      if (event.key === 'Escape') {
        setSelectedRowIndex(-1)
        setShowExportMenu(false)
        setShowCreateForm(false)
        setShowRoomDetail(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredRooms, selectedRowIndex, viewMode])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      clean: { label: 'Bersih', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      dirty: { label: 'Kotor', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      inspected: { label: 'Diperiksa', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      out_of_order: { label: 'Perbaikan', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.clean
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600 bg-blue-100 p-1 rounded-full" />
              <p className="text-gray-600">Memuat data kamar...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6">
      <div className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        // Responsive container width based on sidebar state
        isCollapsed 
          ? "max-w-[calc(100vw-6rem)] xl:max-w-[1400px]" // Wider when sidebar is collapsed
          : "max-w-7xl" // Standard width when sidebar is expanded
      )}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50 p-8 border border-blue-200/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <Bed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Manajemen Kamar</h2>
                  <p className="text-blue-700">
                    Kelola kamar, fasilitas, dan status housekeeping dengan mudah
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Keyboard className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold">Keyboard Shortcuts:</div>
                      <div className="space-y-1">
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl+N</kbd> Tambah kamar baru</div>
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl+E</kbd> Export data</div>
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd> Navigasi {viewMode === 'table' ? 'baris' : 'vertikal'}</div>
                        {viewMode === 'grid' && (
                          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">←→</kbd> Navigasi horizontal</div>
                        )}
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> Lihat detail</div>
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> Batalkan</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu open={showExportMenu} onOpenChange={setShowExportMenu}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export sebagai CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export sebagai Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Export sebagai JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('report')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Laporan Analisa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                className="bg-gradient-to-r from-blue-200  hover:from-blue-400 hover:to-blue-600 shadow-lg"
                onClick={() => setShowCreateForm(true)}
                aria-label="Tambah kamar baru (Cmd/Ctrl+N)"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kamar
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <RoomAnalytics rooms={allRooms || []} />

        {/* Enhanced Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari nomor kamar, tipe, atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="clean">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Bersih
                      </div>
                    </SelectItem>
                    <SelectItem value="dirty">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Kotor
                      </div>
                    </SelectItem>
                    <SelectItem value="inspected">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Diperiksa
                      </div>
                    </SelectItem>
                    <SelectItem value="out_of_order">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Perbaikan
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipe Kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {roomTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={floorFilter} onValueChange={setFloorFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Lantai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Lantai</SelectItem>
                    {floors.map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>Lantai {floor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={amenityFilter} onValueChange={setAmenityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Fasilitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Fasilitas</SelectItem>
                    {amenities.map(amenity => (
                      <SelectItem key={amenity.id} value={amenity.id}>{amenity.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Reset Filters */}
                {(statusFilter !== 'all' || typeFilter !== 'all' || floorFilter !== 'all' || amenityFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setStatusFilter('all')
                      setTypeFilter('all')
                      setFloorFilter('all')
                      setAmenityFilter('all')
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
              
              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Menampilkan {filteredRooms.length} dari {allRooms?.length || 0} kamar
                </span>
                {(statusFilter !== 'all' || typeFilter !== 'all' || floorFilter !== 'all' || amenityFilter !== 'all') && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Filter aktif
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Display */}
        <Card className='border-0 shadow-lg'>
          <CardHeader>
            <CardTitle>Daftar Kamar</CardTitle>
            <CardDescription>
              {filteredRooms.length} dari {rooms?.length || 0} kamar ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Kamar</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead>Tarif Dasar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lantai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Bed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada kamar ditemukan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room, index) => (
                      <TableRow 
                        key={room.id} 
                        className={`${selectedRowIndex === index ? 'bg-blue-50 border-blue-200' : ''} 
                          hover:bg-gray-50 focus-within:bg-blue-50 cursor-pointer transition-colors`}
                        tabIndex={0}
                        role="button"
                        aria-label={`Kamar ${room.room_number}, ${room.room_type}, Kapasitas ${room.capacity}`}
                        onClick={() => handleViewRoom(room.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleViewRoom(room.id)
                          }
                        }}
                      >
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell>{room.room_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {room.capacity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                            {formatIDR(room.base_rate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                        <TableCell>Lantai {room.floor || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewRoom(room.id)
                              }}
                              aria-label={`Lihat detail kamar ${room.room_number}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRoom(room.id)
                              }}
                              aria-label={`Edit kamar ${room.room_number}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            ) : (
              // Grid View
              <div>
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      <Bed className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Tidak ada kamar ditemukan</p>
                      <p className="text-sm">Coba ubah filter pencarian Anda</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRooms.map((room, index) => (
                      <Card 
                        key={room.id} 
                        className={`border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                          selectedRowIndex === index ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        tabIndex={0}
                        role="button"
                        aria-label={`Kamar ${room.room_number}, ${room.room_type}, Kapasitas ${room.capacity}`}
                        onClick={() => handleViewRoom(room.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleViewRoom(room.id)
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          {/* Room Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                <Bed className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">
                                  {room.room_number}
                                </h3>
                                <p className="text-sm text-gray-600">{room.room_type}</p>
                              </div>
                            </div>
                            {getStatusBadge(room.status)}
                          </div>

                          {/* Room Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>Kapasitas</span>
                              </div>
                              <span className="font-medium text-gray-900">{room.capacity} tamu</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>Tarif</span>
                              </div>
                              <span className="font-medium text-green-600">
                                {formatIDR(room.base_rate)}
                              </span>
                            </div>
                            
                            {room.floor && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Building className="w-4 h-4" />
                                  <span>Lantai</span>
                                </div>
                                <span className="font-medium text-gray-900">Lantai {room.floor}</span>
                              </div>
                            )}
                            
                            {room.size_sqm && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Settings className="w-4 h-4" />
                                  <span>Luas</span>
                                </div>
                                <span className="font-medium text-gray-900">{room.size_sqm} m²</span>
                              </div>
                            )}
                          </div>

                          {/* Amenities Preview */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium text-gray-700 mb-2">Fasilitas:</p>
                              <div className="flex flex-wrap gap-1">
                                {room.amenities.slice(0, 3).map((amenityId: string) => {
                                  const amenityIcons = {
                                    wifi: Wifi,
                                    ac: Wind,
                                    tv: Tv,
                                    minibar: Refrigerator,
                                    coffee: Coffee,
                                    bathroom: Bath,
                                    phone: Phone,
                                    parking: Car,
                                  }
                                  const Icon = amenityIcons[amenityId as keyof typeof amenityIcons]
                                  return Icon ? (
                                    <div key={amenityId} className="p-1 bg-gray-100 rounded">
                                      <Icon className="w-3 h-3 text-gray-600" />
                                    </div>
                                  ) : null
                                })}
                                {room.amenities.length > 3 && (
                                  <div className="p-1 bg-gray-100 rounded">
                                    <span className="text-xs font-medium text-gray-600">
                                      +{room.amenities.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status Indicators */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                              {!room.is_active && (
                                <Badge variant="destructive" className="text-xs">
                                  Tidak Aktif
                                </Badge>
                              )}
                              {room.is_smoking_allowed && (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Cigarette className="w-3 h-3" />
                                  <span className="text-xs">Merokok OK</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewRoom(room.id)
                                }}
                                aria-label={`Lihat detail kamar ${room.room_number}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditRoom(room.id)
                                }}
                                aria-label={`Edit kamar ${room.room_number}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Form Dialog */}
        <RoomForm
          room={selectedRoomId ? rooms?.find(r => r.id === selectedRoomId) : undefined}
          open={showCreateForm}
          onOpenChange={(open: boolean) => {
            setShowCreateForm(open)
            if (!open) setSelectedRoomId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedRoomId(null)
          }}
        />

        {/* Room Detail Dialog */}
        <RoomDetail
          roomId={selectedRoomId}
          open={showRoomDetail}
          onOpenChange={(open: boolean) => {
            setShowRoomDetail(open)
            if (!open) setSelectedRoomId(null)
          }}
        />
      </div>
    </div>
  )
}