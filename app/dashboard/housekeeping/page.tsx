'use client'

import { useState, useMemo, useCallback } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { useHousekeepingTasks } from '@/lib/hooks/use-housekeeping'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
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
  Sparkles,
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Loader2,
  Calendar,
  Timer,
  ClipboardList,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  BarChart3,
  Grid3X3,
  List,
  HelpCircle
} from 'lucide-react'
import { TaskForm } from '@/components/housekeeping/task-form'
import { TaskDetail } from '@/components/housekeeping/task-detail'
import { DailySchedule } from '@/components/housekeeping/daily-schedule'
import { HousekeepingAnalytics } from '@/components/housekeeping/housekeeping-analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/context/sidebar-context'

export default function HousekeepingPage() {
  const { currentProperty } = useProperty()
  const { isCollapsed } = useSidebar()
  const { data: tasks, isLoading } = useHousekeepingTasks()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Filter tasks based on search and filters with memoization
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    
    return tasks.filter(task => {
      const matchesSearch = 
        task.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter])

  // Get unique assignees for filter with memoization
  const assignees = useMemo(() => {
    if (!tasks) return []
    
    return Array.from(new Set(
      tasks.filter(t => t.assigned_to && t.assigned_to_name)
           .map(t => ({ id: t.assigned_to, name: t.assigned_to_name }))
           .map(t => JSON.stringify(t))
    )).map(str => JSON.parse(str))
  }, [tasks])

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      },
      in_progress: { 
        label: 'Dikerjakan', 
        color: 'bg-blue-100 text-blue-800',
        icon: Timer 
      },
      completed: { 
        label: 'Selesai', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      inspected: { 
        label: 'Diperiksa', 
        color: 'bg-purple-100 text-purple-800',
        icon: CheckCircle 
      },
      failed_inspection: { 
        label: 'Perlu Diperbaiki', 
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle 
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }, [])

  const getPriorityBadge = useCallback((priority: string) => {
    const priorityConfig = {
      low: { label: 'Rendah', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Tinggi', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Mendesak', color: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }, [])

  const getTaskTypeLabel = useCallback((taskType: string) => {
    const typeLabels = {
      cleaning: 'Pembersihan',
      maintenance: 'Perbaikan',
      inspection: 'Inspeksi',
      deep_cleaning: 'Pembersihan Mendalam',
      preparation: 'Persiapan Kamar',
      checkout_cleaning: 'Pembersihan Check-out',
      checkin_preparation: 'Persiapan Check-in'
    }
    
    return typeLabels[taskType as keyof typeof typeLabels] || taskType
  }, [])

  const handleViewTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setShowTaskDetail(true)
  }, [])

  const handleEditTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setShowCreateForm(true)
  }, [])

  const handleExport = useCallback((format: 'csv' | 'json' | 'excel' | 'report') => {
    toast.info(`Export ${format.toUpperCase()} akan diimplementasikan dalam fase selanjutnya`)
    setShowExportMenu(false)
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">Memuat data housekeeping...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        // Responsive container width based on sidebar state
        isCollapsed 
          ? "max-w-[calc(100vw-6rem)] xl:max-w-[1400px]" // Wider when sidebar is collapsed
          : "max-w-7xl" // Standard width when sidebar is expanded
      )}>
        {/* Modern Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Manajemen Housekeeping</h1>
                  <p className="text-sm text-gray-600">
                    Kelola tugas pembersihan dan perawatan kamar dengan efisien
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
                      className="text-gray-600 hover:bg-gray-50"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold">Keyboard Shortcuts:</div>
                      <div className="space-y-1">
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl+N</kbd> Tambah tugas baru</div>
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl+E</kbd> Export data</div>
                        <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd> Navigasi baris</div>
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
                    size="sm"
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
                    Laporan Performa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tugas
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tugas</p>
                  <p className="text-2xl font-semibold text-gray-900">{tasks?.length || 0}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menunggu</p>
                  <p className="text-2xl font-semibold text-amber-600">
                    {tasks?.filter(t => t.status === 'pending').length || 0}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dikerjakan</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {tasks?.filter(t => t.status === 'in_progress').length || 0}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Timer className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selesai Hari Ini</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {tasks?.filter(t => {
                      const today = new Date().toISOString().split('T')[0]
                      const completedAt = t.completed_at ? new Date(t.completed_at).toISOString().split('T')[0] : null
                      return t.status === 'completed' && completedAt === today
                    }).length || 0}
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Semua Tugas</TabsTrigger>
            <TabsTrigger value="schedule">Jadwal Harian</TabsTrigger>
          </TabsList>

          {/* All Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Filters and Search */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Cari nomor kamar, jenis tugas, atau nama petugas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-gray-300"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="in_progress">Dikerjakan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="inspected">Diperiksa</SelectItem>
                      <SelectItem value="failed_inspection">Perlu Diperbaiki</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Prioritas</SelectItem>
                      <SelectItem value="1">Rendah</SelectItem>
                      <SelectItem value="2">Normal</SelectItem>
                      <SelectItem value="3">Tinggi</SelectItem>
                      <SelectItem value="4">Mendesak</SelectItem>
                      <SelectItem value="5">Darurat</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Petugas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Petugas</SelectItem>
                      {assignees.map(assignee => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          {assignee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Daftar Tugas Housekeeping</CardTitle>
                <CardDescription>
                  {filteredTasks.length} dari {tasks?.length || 0} tugas ditampilkan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kamar & Tugas</TableHead>
                        <TableHead>Prioritas</TableHead>
                        <TableHead>Petugas</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Estimasi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="text-gray-500">
                              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Tidak ada tugas housekeeping ditemukan</p>
                              {searchQuery && (
                                <p className="text-sm mt-1">
                                  Coba gunakan kata kunci yang berbeda
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div>
                                <div className="flex items-center font-medium">
                                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                  Kamar {task.room_number}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {getTaskTypeLabel(task.task_type)}
                                </div>
                                {task.notes && (
                                  <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                    {task.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPriorityBadge(task.priority)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {task.assigned_to_name || 'Belum ditugaskan'}
                                  </div>
                                  {task.assigned_at && (
                                    <div className="text-xs text-gray-500">
                                      Ditugaskan {new Date(task.assigned_at).toLocaleDateString('id-ID')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                  {new Date(task.scheduled_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </div>
                                {task.scheduled_time && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {task.scheduled_time} WIB
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(task.status)}
                              {task.started_at && task.status === 'in_progress' && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Dimulai {new Date(task.started_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <Timer className="w-3 h-3 mr-1 text-gray-400" />
                                  {task.estimated_duration || 30} menit
                                </div>
                                {task.actual_duration && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Aktual: {task.actual_duration} menit
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewTask(task.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditTask(task.id)}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <DailySchedule />
          </TabsContent>
        </Tabs>

        {/* Task Form Dialog */}
        <TaskForm
          task={selectedTaskId ? tasks?.find(t => t.id === selectedTaskId) : undefined}
          open={showCreateForm}
          onOpenChange={(open) => {
            setShowCreateForm(open)
            if (!open) setSelectedTaskId(null)
          }}
          onSuccess={() => {
            setShowCreateForm(false)
            setSelectedTaskId(null)
          }}
        />

        {/* Task Detail Dialog */}
        <TaskDetail
          taskId={selectedTaskId}
          open={showTaskDetail}
          onOpenChange={(open) => {
            setShowTaskDetail(open)
            if (!open) setSelectedTaskId(null)
          }}
        />
      </div>
    </div>
  )
}