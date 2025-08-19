// Housekeeping analytics and performance metrics utilities

export interface HousekeepingAnalytics {
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  inspectedTasks: number
  failedInspectionTasks: number
  
  // Performance metrics
  completionRate: number
  averageCompletionTime: number
  onTimeCompletionRate: number
  qualityScore: number
  
  // Staff metrics
  staffProductivity: Array<{
    staffId: string
    staffName: string
    assignedTasks: number
    completedTasks: number
    averageTime: number
    productivityScore: number
  }>
  
  // Task type analytics
  taskTypeDistribution: Array<{
    type: string
    count: number
    percentage: number
    averageTime: number
  }>
  
  // Priority analytics
  priorityDistribution: Array<{
    priority: number
    label: string
    count: number
    percentage: number
  }>
  
  // Room analytics
  roomEfficiency: Array<{
    roomNumber: string
    tasksCount: number
    averageTime: number
    lastCleaned: string
    status: string
  }>
  
  // Time-based trends
  dailyTrends: Array<{
    date: string
    completed: number
    pending: number
    efficiency: number
  }>
  
  // Performance indicators
  kpis: {
    efficiency: number
    quality: number
    timeliness: number
    utilization: number
  }
}

export interface StaffPerformance {
  totalStaff: number
  activeStaff: number
  averageTasksPerStaff: number
  topPerformer: {
    name: string
    score: number
    tasksCompleted: number
  } | null
  staffWorkload: Array<{
    staffName: string
    currentTasks: number
    capacity: number
    utilization: number
  }>
}

export function calculateHousekeepingAnalytics(tasks: any[]): HousekeepingAnalytics {
  const totalTasks = tasks.length
  
  // Status counts
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inspectedTasks = tasks.filter(t => t.status === 'inspected').length
  const failedInspectionTasks = tasks.filter(t => t.status === 'failed_inspection').length
  
  // Performance calculations
  const completionRate = totalTasks > 0 ? (completedTasks + inspectedTasks) / totalTasks * 100 : 0
  
  // Average completion time
  const completedTasksWithTime = tasks.filter(t => 
    (t.status === 'completed' || t.status === 'inspected') && 
    t.actual_duration
  )
  const averageCompletionTime = completedTasksWithTime.length > 0 
    ? completedTasksWithTime.reduce((sum, t) => sum + (t.actual_duration || 0), 0) / completedTasksWithTime.length
    : 0
  
  // On-time completion rate (tasks completed within estimated time)
  const onTimeCompletions = completedTasksWithTime.filter(t => 
    t.actual_duration <= (t.estimated_duration || 30)
  ).length
  const onTimeCompletionRate = completedTasksWithTime.length > 0 
    ? (onTimeCompletions / completedTasksWithTime.length) * 100 
    : 0
  
  // Quality score (based on inspection pass rate)
  const totalInspected = inspectedTasks + failedInspectionTasks
  const qualityScore = totalInspected > 0 ? (inspectedTasks / totalInspected) * 100 : 0
  
  // Staff productivity analysis
  const staffStats = tasks.reduce((acc, task) => {
    if (task.assigned_to && task.assigned_to_name) {
      if (!acc[task.assigned_to]) {
        acc[task.assigned_to] = {
          staffId: task.assigned_to,
          staffName: task.assigned_to_name,
          assignedTasks: 0,
          completedTasks: 0,
          totalTime: 0,
          completedCount: 0
        }
      }
      
      acc[task.assigned_to].assignedTasks++
      
      if (['completed', 'inspected'].includes(task.status)) {
        acc[task.assigned_to].completedTasks++
        if (task.actual_duration) {
          acc[task.assigned_to].totalTime += task.actual_duration
          acc[task.assigned_to].completedCount++
        }
      }
    }
    return acc
  }, {} as Record<string, any>)
  
  const staffProductivity = Object.values(staffStats).map((staff: any) => {
    const averageTime = staff.completedCount > 0 ? staff.totalTime / staff.completedCount : 0
    const completionRate = staff.assignedTasks > 0 ? staff.completedTasks / staff.assignedTasks : 0
    const productivityScore = Math.round((completionRate * 70) + ((averageTime > 0 ? Math.max(0, 100 - averageTime/2) : 50) * 30) / 100 * 100)
    
    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      assignedTasks: staff.assignedTasks,
      completedTasks: staff.completedTasks,
      averageTime: Math.round(averageTime),
      productivityScore
    }
  }).sort((a, b) => b.productivityScore - a.productivityScore)
  
  // Task type distribution
  const taskTypeStats = tasks.reduce((acc, task) => {
    const type = task.task_type || 'unknown'
    if (!acc[type]) {
      acc[type] = { count: 0, totalTime: 0, completedCount: 0 }
    }
    acc[type].count++
    if (task.actual_duration) {
      acc[type].totalTime += task.actual_duration
      acc[type].completedCount++
    }
    return acc
  }, {} as Record<string, any>)
  
  const taskTypeDistribution = Object.entries(taskTypeStats).map(([type, stats]: [string, any]) => ({
    type,
    count: stats.count,
    percentage: totalTasks > 0 ? (stats.count / totalTasks) * 100 : 0,
    averageTime: stats.completedCount > 0 ? Math.round(stats.totalTime / stats.completedCount) : 0
  })).sort((a, b) => b.count - a.count)
  
  // Priority distribution
  const priorityStats = tasks.reduce((acc, task) => {
    const priority = task.priority || 2
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const priorityLabels = {
    1: 'Rendah',
    2: 'Normal', 
    3: 'Tinggi',
    4: 'Mendesak',
    5: 'Darurat'
  }
  
  const priorityDistribution = Object.entries(priorityStats).map(([priority, count]) => ({
    priority: parseInt(priority),
    label: priorityLabels[parseInt(priority) as keyof typeof priorityLabels] || 'Normal',
    count: count as number,
    percentage: totalTasks > 0 ? ((count as number) / totalTasks) * 100 : 0
  })).sort((a, b) => a.priority - b.priority)
  
  // Room efficiency analysis
  const roomStats = tasks.reduce((acc, task) => {
    if (task.room_number) {
      if (!acc[task.room_number]) {
        acc[task.room_number] = {
          roomNumber: task.room_number,
          tasksCount: 0,
          totalTime: 0,
          completedCount: 0,
          lastCleaned: '',
          status: 'clean'
        }
      }
      
      acc[task.room_number].tasksCount++
      
      if (task.actual_duration) {
        acc[task.room_number].totalTime += task.actual_duration
        acc[task.room_number].completedCount++
      }
      
      if (['completed', 'inspected'].includes(task.status) && task.completed_at) {
        const completedDate = new Date(task.completed_at)
        if (!acc[task.room_number].lastCleaned || completedDate > new Date(acc[task.room_number].lastCleaned)) {
          acc[task.room_number].lastCleaned = task.completed_at
        }
      }
    }
    return acc
  }, {} as Record<string, any>)
  
  const roomEfficiency = Object.values(roomStats).map((room: any) => ({
    roomNumber: room.roomNumber,
    tasksCount: room.tasksCount,
    averageTime: room.completedCount > 0 ? Math.round(room.totalTime / room.completedCount) : 0,
    lastCleaned: room.lastCleaned,
    status: room.status
  })).sort((a, b) => b.tasksCount - a.tasksCount)
  
  // Daily trends (last 7 days)
  const dailyTrends = generateDailyTrends(tasks)
  
  // KPI calculations
  const kpis = {
    efficiency: Math.round(completionRate), // Overall completion rate
    quality: Math.round(qualityScore), // Inspection pass rate
    timeliness: Math.round(onTimeCompletionRate), // On-time completion
    utilization: Math.round(inProgressTasks > 0 ? (inProgressTasks / (inProgressTasks + pendingTasks)) * 100 : 0) // Active vs pending ratio
  }
  
  return {
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    inspectedTasks,
    failedInspectionTasks,
    completionRate,
    averageCompletionTime: Math.round(averageCompletionTime),
    onTimeCompletionRate,
    qualityScore,
    staffProductivity,
    taskTypeDistribution,
    priorityDistribution,
    roomEfficiency,
    dailyTrends,
    kpis
  }
}

export function calculateStaffPerformance(tasks: any[]): StaffPerformance {
  const staffStats = tasks.reduce((acc, task) => {
    if (task.assigned_to && task.assigned_to_name) {
      if (!acc[task.assigned_to]) {
        acc[task.assigned_to] = {
          name: task.assigned_to_name,
          assignedTasks: 0,
          completedTasks: 0,
          currentTasks: 0
        }
      }
      
      acc[task.assigned_to].assignedTasks++
      
      if (['completed', 'inspected'].includes(task.status)) {
        acc[task.assigned_to].completedTasks++
      }
      
      if (task.status === 'in_progress') {
        acc[task.assigned_to].currentTasks++
      }
    }
    return acc
  }, {} as Record<string, any>)
  
  const staffList = Object.values(staffStats)
  const totalStaff = staffList.length
  const activeStaff = staffList.filter((staff: any) => staff.currentTasks > 0).length
  const averageTasksPerStaff = totalStaff > 0 ? tasks.length / totalStaff : 0
  
  // Top performer
  const topPerformer = staffList.reduce((top: { name: string; score: number; tasksCompleted: number } | null, staff: any) => {
    const score = staff.assignedTasks > 0 ? (staff.completedTasks / staff.assignedTasks) * 100 : 0
    if (!top || score > top.score) {
      return {
        name: staff.name,
        score: Math.round(score),
        tasksCompleted: staff.completedTasks
      }
    }
    return top
  }, null as { name: string; score: number; tasksCompleted: number } | null)
  
  // Staff workload (assuming 8 tasks per day capacity)
  const staffWorkload = staffList.map((staff: any) => ({
    staffName: staff.name,
    currentTasks: staff.currentTasks,
    capacity: 8, // Default capacity
    utilization: Math.round((staff.currentTasks / 8) * 100)
  }))
  
  return {
    totalStaff,
    activeStaff,
    averageTasksPerStaff: Math.round(averageTasksPerStaff),
    topPerformer,
    staffWorkload
  }
}

function generateDailyTrends(tasks: any[]): Array<{ date: string; completed: number; pending: number; efficiency: number }> {
  const trends = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Filter tasks for this date
    const dayTasks = tasks.filter(task => {
      const scheduledDate = task.scheduled_date
      return scheduledDate === dateStr
    })
    
    const completed = dayTasks.filter(t => ['completed', 'inspected'].includes(t.status)).length
    const pending = dayTasks.filter(t => t.status === 'pending').length
    const total = dayTasks.length
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0
    
    trends.push({
      date: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      completed,
      pending,
      efficiency
    })
  }
  
  return trends
}

export function getTaskStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    inspected: 'text-purple-600',
    failed_inspection: 'text-red-600'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
}

export function getTaskStatusBadgeClass(status: string): string {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    inspected: 'bg-purple-100 text-purple-800 border-purple-200',
    failed_inspection: 'bg-red-100 text-red-800 border-red-200'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function getPriorityLabel(priority: number): string {
  const labels = {
    1: 'Rendah',
    2: 'Normal',
    3: 'Tinggi', 
    4: 'Mendesak',
    5: 'Darurat'
  }
  return labels[priority as keyof typeof labels] || 'Normal'
}

export function getPriorityColor(priority: number): string {
  const colors = {
    1: 'text-gray-600',
    2: 'text-blue-600',
    3: 'text-orange-600',
    4: 'text-red-600',
    5: 'text-red-800'
  }
  return colors[priority as keyof typeof colors] || 'text-blue-600'
}

export function calculateTaskEfficiency(estimatedDuration: number, actualDuration: number): number {
  if (!actualDuration || !estimatedDuration) return 0
  return Math.round(Math.max(0, (estimatedDuration / actualDuration) * 100))
}

export function getTaskTypeIcon(taskType: string): string {
  const icons = {
    cleaning: 'Sparkles',
    deep_cleaning: 'Sparkles',
    maintenance: 'AlertTriangle',
    inspection: 'CheckSquare',
    preparation: 'Bed',
    checkout_cleaning: 'Sparkles',
    checkin_preparation: 'Bed'
  }
  return icons[taskType as keyof typeof icons] || 'Sparkles'
}

export function generateTaskSummary(tasks: any[]): string {
  const analytics = calculateHousekeepingAnalytics(tasks)
  
  return `
RINGKASAN HOUSEKEEPING
=====================

Total Tugas: ${analytics.totalTasks}
- Menunggu: ${analytics.pendingTasks}
- Dikerjakan: ${analytics.inProgressTasks}  
- Selesai: ${analytics.completedTasks}
- Diperiksa: ${analytics.inspectedTasks}
- Perlu Diperbaiki: ${analytics.failedInspectionTasks}

PERFORMA:
- Tingkat Penyelesaian: ${analytics.completionRate.toFixed(1)}%
- Waktu Rata-rata: ${analytics.averageCompletionTime} menit
- Ketepatan Waktu: ${analytics.onTimeCompletionRate.toFixed(1)}%
- Skor Kualitas: ${analytics.qualityScore.toFixed(1)}%

TOP PERFORMER:
${analytics.staffProductivity.length > 0 ? 
  `${analytics.staffProductivity[0].staffName} (${analytics.staffProductivity[0].productivityScore} poin)` : 
  'Belum ada data'
}
`.trim()
}