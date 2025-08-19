'use client'

import { useState } from 'react'
import { useHousekeepingTask, useUpdateTaskStatus } from '@/lib/hooks/use-housekeeping'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Edit,
  Clock,
  CheckCircle,
  Timer,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Bed
} from 'lucide-react'
import { TaskForm } from './task-form'
import { logger } from '@/lib/utils/logger'

interface TaskDetailProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetail({ taskId, open, onOpenChange }: TaskDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const { data: task, isLoading: taskLoading } = useHousekeepingTask(taskId)
  const updateStatus = useUpdateTaskStatus()

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return

    setIsUpdatingStatus(true)
    try {
      await updateStatus.mutateAsync({
        id: task.id,
        status: newStatus
      })
      logger.info('Task status updated', { taskId: task.id, newStatus })
    } catch (error) {
      logger.error('Failed to update task status', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      },
      in_progress: { 
        label: 'Sedang Dikerjakan', 
        color: 'bg-blue-100 text-blue-800',
        icon: Timer 
      },
      completed: { 
        label: 'Selesai', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      inspected: { 
        label: 'Sudah Diperiksa', 
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

  const getPriorityBadge = (priority: number) => {
    const priorityConfig = {
      1: { label: 'Rendah', color: 'bg-gray-100 text-gray-800' },
      2: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'Tinggi', color: 'bg-orange-100 text-orange-800' },
      4: { label: 'Mendesak', color: 'bg-red-100 text-red-800' },
      5: { label: 'Darurat', color: 'bg-red-200 text-red-900' },
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2]
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTaskTypeLabel = (taskType: string) => {
    const typeLabels = {
      cleaning: 'Pembersihan Rutin',
      maintenance: 'Perbaikan & Maintenance',
      inspection: 'Inspeksi Kamar',
      deep_cleaning: 'Pembersihan Mendalam',
      preparation: 'Persiapan Khusus',
      checkout_cleaning: 'Pembersihan Check-out',
      checkin_preparation: 'Persiapan Check-in'
    }
    
    return typeLabels[taskType as keyof typeof typeLabels] || taskType
  }

  const calculateProgress = () => {
    if (!task?.checklist || !Array.isArray(task.checklist)) return 0
    const completed = task.checklist.filter((item: { completed: any }) => item.completed).length
    return task.checklist.length > 0 ? (completed / task.checklist.length) * 100 : 0
  }

  const canStart = task?.status === 'pending'
  const canComplete = task?.status === 'in_progress'
  const canInspect = task?.status === 'completed'
  const canRedo = task?.status === 'failed_inspection'

  if (taskLoading || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">Memuat detail tugas...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const progress = calculateProgress()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {getTaskTypeLabel(task.task_type)} - Kamar {task.room_number}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {canStart && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={isUpdatingStatus}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Mulai
                  </Button>
                )}
                {canComplete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('completed')}
                    disabled={isUpdatingStatus}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                )}
                {canInspect && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('inspected')}
                    disabled={isUpdatingStatus}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Inspeksi
                  </Button>
                )}
                {canRedo && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('pending')}
                    disabled={isUpdatingStatus}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Ulangi
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detail</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Information */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Sparkles className="w-4 h-4 text-gray-600" />
                      Informasi Tugas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Kamar</p>
                        <p className="font-medium">Kamar {task.room_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Jenis Tugas</p>
                        <p className="font-medium">{getTaskTypeLabel(task.task_type)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Prioritas</p>
                        <div className="mt-1">
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Timer className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Estimasi Durasi</p>
                        <p className="font-medium">{task.estimated_duration || 30} menit</p>
                      </div>
                    </div>

                    {task.actual_duration && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Durasi Aktual</p>
                          <p className="font-medium">{task.actual_duration} menit</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment Information */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <User className="w-4 h-4 text-gray-600" />
                      Informasi Penugasan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Ditugaskan Kepada</p>
                        <p className="font-medium">{task.assigned_to_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Tanggal Jadwal</p>
                        <p className="font-medium">
                          {new Date(task.scheduled_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {task.scheduled_time && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Waktu Jadwal</p>
                          <p className="font-medium">{task.scheduled_time} WIB</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Dibuat</p>
                        <p className="font-medium">
                          {new Date(task.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>

                    {task.completed_at && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-600">Selesai</p>
                          <p className="font-medium">
                            {new Date(task.completed_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {task.notes && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <FileText className="w-4 h-4 text-gray-600" />
                      Catatan Tugas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{task.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="space-y-4 max-h-96 overflow-y-auto">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-medium">
                      <CheckSquare className="w-4 h-4 text-gray-600" />
                      Checklist Tugas
                    </div>
                    <div className="text-sm text-gray-600">
                      {task.checklist?.filter((item: { completed: any }) => item.completed).length || 0} / {task.checklist?.length || 0} selesai
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Progress penyelesaian tugas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {task.checklist && task.checklist.length > 0 ? (
                    <div className="space-y-3">
                      {task.checklist.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <Checkbox 
                            checked={item.completed} 
                            disabled 
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.item}
                          </span>
                          {item.completed && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Tidak ada checklist untuk tugas ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 max-h-96 overflow-y-auto">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Riwayat Tugas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border-0 shadow-sm rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Tugas Dibuat</p>
                      <p className="text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </p>
                    </div>
                  </div>

                  {task.status === 'in_progress' && (
                    <div className="flex items-center gap-3 p-3 border-0 shadow-sm rounded-lg">
                      <Play className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">Tugas Dimulai</p>
                        <p className="text-sm text-gray-600">Sedang dikerjakan</p>
                      </div>
                    </div>
                  )}

                  {task.completed_at && (
                    <div className="flex items-center gap-3 p-3 border-0 shadow-sm rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Tugas Selesai</p>
                        <p className="text-sm text-gray-600">
                          {new Date(task.completed_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </p>
                      </div>
                    </div>
                  )}

                  {task.status === 'inspected' && (
                    <div className="flex items-center gap-3 p-3 border-0 shadow-sm rounded-lg bg-purple-50">
                      <CheckSquare className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-800">Tugas Diperiksa</p>
                        <p className="text-sm text-purple-600">
                          Tugas telah lulus inspeksi kualitas
                        </p>
                      </div>
                    </div>
                  )}

                  {task.status === 'failed_inspection' && (
                    <div className="flex items-center gap-3 p-3 border-0 shadow-sm rounded-lg bg-red-50">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-red-800">Perlu Diperbaiki</p>
                        <p className="text-sm text-red-600">
                          Tugas tidak lulus inspeksi dan perlu dikerjakan ulang
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <TaskForm
        task={task}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={() => setShowEditForm(false)}
      />
    </>
  )
}