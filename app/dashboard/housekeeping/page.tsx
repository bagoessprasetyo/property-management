'use client'

import { useState } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { useHousekeepingTasks } from '@/lib/hooks/use-housekeeping'
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
  ClipboardList
} from 'lucide-react'

export default function HousekeepingPage() {
  const { currentProperty } = useProperty()
  const { data: tasks, isLoading } = useHousekeepingTasks(currentProperty?.id)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  // Filter tasks based on search and filters
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = 
      task.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  }) || []

  // Get unique assignees for filter
  const assignees = Array.from(new Set(
    tasks?.filter(t => t.assigned_to && t.assigned_to_name)
           .map(t => ({ id: t.assigned_to, name: t.assigned_to_name }))
           .map(t => JSON.stringify(t)) || []
  )).map(str => JSON.parse(str))

  const getStatusBadge = (status: string) => {
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
  }

  const getPriorityBadge = (priority: string) => {
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
  }

  const getTaskTypeLabel = (taskType: string) => {
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
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-warm-brown-600" />
              <p className="text-gray-600">Memuat data housekeeping...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Manajemen Housekeeping</h2>
            <p className="text-gray-600 mt-1">
              Kelola tugas pembersihan dan perawatan kamar
            </p>
          </div>
          <Button className="bg-warm-brown-600 hover:bg-warm-brown-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tugas
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tugas</p>
                  <p className="text-2xl font-bold">{tasks?.length || 0}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menunggu</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {tasks?.filter(t => t.status === 'pending').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dikerjakan</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tasks?.filter(t => t.status === 'in_progress').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Timer className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selesai Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks?.filter(t => {
                      const today = new Date().toISOString().split('T')[0]
                      const completedAt = t.completed_at ? new Date(t.completed_at).toISOString().split('T')[0] : null
                      return t.status === 'completed' && completedAt === today
                    }).length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nomor kamar, jenis tugas, atau nama petugas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
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
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="urgent">Mendesak</SelectItem>
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
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tugas Housekeeping</CardTitle>
            <CardDescription>
              {filteredTasks.length} dari {tasks?.length || 0} tugas ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
      </div>
    </div>
  )
}