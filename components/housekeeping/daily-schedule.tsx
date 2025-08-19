'use client'

import { useState } from 'react'
import { useHousekeepingSchedule } from '@/lib/hooks/use-housekeeping'
import { useProperty } from '@/lib/context/property-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Clock,
  Timer,
  User,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { TaskForm } from './task-form'
import { TaskDetail } from './task-detail'

interface DailyScheduleProps {
  selectedDate?: string
}

export function DailySchedule({ selectedDate = new Date().toISOString().split('T')[0] }: DailyScheduleProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  
  const { currentProperty } = useProperty()
  const { data: tasks, isLoading } = useHousekeepingSchedule('', currentDate)

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setCurrentDate(date.toISOString().split('T')[0])
  }

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

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'border-l-gray-400',
      2: 'border-l-blue-400',
      3: 'border-l-orange-400',
      4: 'border-l-red-400',
      5: 'border-l-red-600',
    }
    return colors[priority as keyof typeof colors] || colors[2]
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

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowTaskDetail(true)
  }

  // Group tasks by time or priority
  const groupedTasks = tasks?.sort((a, b) => {
    // Sort by scheduled time, then by priority
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time)
    }
    if (a.scheduled_time && !b.scheduled_time) return -1
    if (!a.scheduled_time && b.scheduled_time) return 1
    return b.priority - a.priority
  }) || []

  const currentDateFormatted = new Date(currentDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">Memuat jadwal...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                Jadwal Harian
              </CardTitle>
              <CardDescription className="text-sm">
                {currentDateFormatted} • {tasks?.length || 0} tugas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
                className="text-sm font-medium"
              >
                Hari Ini
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groupedTasks.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Tidak ada tugas untuk hari ini</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Tambah Tugas
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={`border-l-4 ${getPriorityColor(task.priority)} cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 bg-white`}
                  onClick={() => handleViewTask(task.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">Kamar {task.room_number}</span>
                          </div>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {getTaskTypeLabel(task.task_type)}
                          </span>
                          {task.scheduled_time && (
                            <>
                              <span className="text-sm text-gray-400">•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600 font-medium">
                                  {task.scheduled_time} WIB
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(task.status)}
                            {task.assigned_to_name && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <User className="w-3 h-3" />
                                {task.assigned_to_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Timer className="w-3 h-3" />
                              {task.estimated_duration || 30} menit
                            </div>
                          </div>
                        </div>
                        
                        {task.notes && (
                          <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <TaskForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => setShowCreateForm(false)}
        preselectedRoomId={undefined}
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
    </>
  )
}