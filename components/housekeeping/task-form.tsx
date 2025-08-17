'use client'

import { useState, useEffect } from 'react'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateHousekeepingTask, useUpdateHousekeepingTask } from '@/lib/hooks/use-housekeeping'
import { useRooms } from '@/lib/hooks/use-rooms'
import { useProperty } from '@/lib/context/property-context'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Save,
  X,
  Bed,
  User,
  Clock,
  AlertTriangle,
  Calendar,
  Timer,
  MapPin,
  CheckSquare
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// Task types
const TASK_TYPES = [
  { value: 'cleaning', label: 'Pembersihan Rutin', icon: Sparkles },
  { value: 'deep_cleaning', label: 'Pembersihan Mendalam', icon: Sparkles },
  { value: 'checkout_cleaning', label: 'Pembersihan Check-out', icon: Sparkles },
  { value: 'checkin_preparation', label: 'Persiapan Check-in', icon: Bed },
  { value: 'maintenance', label: 'Perbaikan & Maintenance', icon: AlertTriangle },
  { value: 'inspection', label: 'Inspeksi Kamar', icon: CheckSquare },
  { value: 'preparation', label: 'Persiapan Khusus', icon: Bed },
]

// Task statuses
const TASK_STATUSES = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: 'inspected', label: 'Sudah Diperiksa', color: 'bg-purple-100 text-purple-800' },
  { value: 'failed_inspection', label: 'Perlu Diperbaiki', color: 'bg-red-100 text-red-800' },
]

// Priority levels
const PRIORITY_LEVELS = [
  { value: 1, label: 'Rendah', color: 'bg-gray-100 text-gray-800' },
  { value: 2, label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 3, label: 'Tinggi', color: 'bg-orange-100 text-orange-800' },
  { value: 4, label: 'Mendesak', color: 'bg-red-100 text-red-800' },
  { value: 5, label: 'Darurat', color: 'bg-red-200 text-red-900' },
]

// Form validation schema
const taskFormSchema = z.object({
  room_id: z.string().min(1, 'Kamar wajib dipilih'),
  task_type: z.string().min(1, 'Jenis tugas wajib dipilih'),
  assigned_to: z.string().optional(),
  priority: z.number().min(1).max(5),
  estimated_duration: z.number().min(1, 'Estimasi durasi minimal 1 menit'),
  status: z.string().min(1, 'Status wajib dipilih'),
  scheduled_date: z.string().min(1, 'Tanggal jadwal wajib diisi'),
  scheduled_time: z.string().optional(),
  notes: z.string().optional(),
  checklist: z.array(z.object({
    item: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
})

type TaskFormData = z.infer<typeof taskFormSchema>

interface TaskFormProps {
  task?: any // Existing task for editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  preselectedRoomId?: string
}

export function TaskForm({ task, open, onOpenChange, onSuccess, preselectedRoomId }: TaskFormProps) {
  const [checklistItems, setChecklistItems] = useState<Array<{item: string, completed: boolean}>>([])
  const isEditing = !!task
  const { currentProperty } = useProperty()

  const createTask = useCreateHousekeepingTask()
  const updateTask = useUpdateHousekeepingTask()
  const { data: rooms } = useRooms(currentProperty?.id)

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormData>,
    defaultValues: {
      room_id: task?.room_id || preselectedRoomId || '',
      task_type: task?.task_type || 'cleaning',
      assigned_to: task?.assigned_to || '',
      priority: task?.priority || 2,
      estimated_duration: task?.estimated_duration || 30,
      status: task?.status || 'pending',
      scheduled_date: task?.scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_time: task?.scheduled_time || '',
      notes: task?.notes || '',
      checklist: task?.checklist || [],
    },
  })

  // Initialize checklist from task data
  useEffect(() => {
    if (task?.checklist && Array.isArray(task.checklist)) {
      setChecklistItems(task.checklist)
    } else {
      // Default checklist based on task type
      const taskType = form.watch('task_type')
      setDefaultChecklist(taskType)
    }
  }, [task, form])

  const setDefaultChecklist = (taskType: string) => {
    const defaultChecklists = {
      cleaning: [
        { item: 'Bersihkan kamar mandi', completed: false },
        { item: 'Ganti seprai dan sarung bantal', completed: false },
        { item: 'Vacuum karpet', completed: false },
        { item: 'Bersihkan jendela', completed: false },
        { item: 'Cek dan isi perlengkapan mandi', completed: false },
      ],
      deep_cleaning: [
        { item: 'Pembersihan mendalam kamar mandi', completed: false },
        { item: 'Cuci karpet dan tirai', completed: false },
        { item: 'Bersihkan AC dan filter', completed: false },
        { item: 'Polish furniture', completed: false },
        { item: 'Desinfeksi seluruh ruangan', completed: false },
      ],
      maintenance: [
        { item: 'Periksa lampu dan saklar', completed: false },
        { item: 'Cek keran dan toilet', completed: false },
        { item: 'Periksa AC dan remote', completed: false },
        { item: 'Cek kunci dan handle pintu', completed: false },
        { item: 'Periksa furniture', completed: false },
      ],
      inspection: [
        { item: 'Cek kebersihan umum', completed: false },
        { item: 'Periksa kelengkapan amenities', completed: false },
        { item: 'Cek kondisi furniture', completed: false },
        { item: 'Periksa elektronik', completed: false },
        { item: 'Dokumentasi kondisi kamar', completed: false },
      ],
    }
    
    setChecklistItems(defaultChecklists[taskType as keyof typeof defaultChecklists] || [])
  }

  // Watch task type to update default checklist
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'task_type' && value.task_type && !isEditing) {
        setDefaultChecklist(value.task_type)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, isEditing])

  const onSubmit = async (data: TaskFormData) => {
    try {
      logger.info(`${isEditing ? 'Updating' : 'Creating'} housekeeping task`, { 
        taskId: task?.id,
        roomId: data.room_id,
        taskType: data.task_type
      })

      const formattedData = {
        ...data,
        property_id: currentProperty?.id,
        checklist: checklistItems,
        assigned_to: data.assigned_to || null,
        scheduled_time: data.scheduled_time || null,
        notes: data.notes || null,
      }

      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: formattedData
        })
        logger.info('Housekeeping task updated successfully', { taskId: task.id })
      } else {
        if (!currentProperty?.id) {
          throw new Error('Property ID is required')
        }
        await createTask.mutateAsync({
          ...formattedData,
          property_id: currentProperty.id
        })
        logger.info('Housekeeping task created successfully')
      }

      onOpenChange(false)
      form.reset()
      setChecklistItems([])
      onSuccess?.()
    } catch (error) {
      logger.error(`Failed to ${isEditing ? 'update' : 'create'} housekeeping task`, error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setChecklistItems([])
  }

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { item: '', completed: false }])
  }

  const updateChecklistItem = (index: number, field: 'item' | 'completed', value: string | boolean) => {
    const updated = [...checklistItems]
    updated[index] = { ...updated[index], [field]: value }
    setChecklistItems(updated)
  }

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index))
  }

  const selectedRoom = rooms?.find(r => r.id === form.watch('room_id'))
  const selectedTaskType = TASK_TYPES.find(t => t.value === form.watch('task_type'))

  const isLoading = createTask.isPending || updateTask.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {isEditing ? 'Edit Tugas Housekeeping' : 'Tambah Tugas Housekeeping'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Perbarui informasi tugas housekeeping'
              : 'Buat tugas housekeeping baru untuk kamar'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-96 overflow-y-auto space-y-4">
              {/* Room and Task Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Kamar *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kamar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rooms?.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Bed className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Kamar {room.room_number}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {room.room_type} • {room.status === 'clean' ? 'Bersih' : 
                                     room.status === 'dirty' ? 'Kotor' : 'Maintenance'}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="task_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Tugas *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis tugas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_TYPES.map(type => {
                            const Icon = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Selected Room Info */}
              {selectedRoom && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bed className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Kamar {selectedRoom.room_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedRoom.room_type} • Lantai {selectedRoom.floor || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={
                            selectedRoom.status === 'clean' ? 'bg-green-100 text-green-800' :
                            selectedRoom.status === 'dirty' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {selectedRoom.status === 'clean' ? 'Bersih' :
                             selectedRoom.status === 'dirty' ? 'Kotor' : 'Maintenance'}
                          </Badge>
                          {selectedTaskType && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <selectedTaskType.icon className="w-3 h-3" />
                              {selectedTaskType.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assignment and Priority */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ditugaskan Kepada</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama petugas housekeeping" {...field} />
                      </FormControl>
                      <FormDescription>Opsional - bisa ditugaskan nanti</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritas *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih prioritas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_LEVELS.map(priority => (
                            <SelectItem key={priority.value} value={priority.value.toString()}>
                              <Badge className={priority.color}>
                                {priority.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimasi Durasi (menit) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Schedule and Status */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Jadwal *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Jadwal</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>Opsional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Tugas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instruksi khusus atau catatan untuk petugas..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Checklist Tugas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>
                
                {checklistItems.length > 0 && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {checklistItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Item checklist..."
                            value={item.item}
                            onChange={(e) => updateChecklistItem(index, 'item', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChecklistItem(index)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditing ? 'Menyimpan...' : 'Membuat...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Simpan Perubahan' : 'Buat Tugas'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}