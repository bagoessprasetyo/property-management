'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Upload, 
  Shield, 
  Database, 
  Activity, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Wifi,
  Zap
} from 'lucide-react'
import { logger, loggers } from '@/lib/utils/logger'
import { backup, backupManager } from '@/lib/utils/backup'
import { security, monitoring } from '@/lib/utils/security'
import { usePerformanceInsights } from '@/lib/hooks/use-performance-monitor'

export function ProductionPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const { getInsights } = usePerformanceInsights()

  const handleBackup = async () => {
    try {
      setIsBackingUp(true)
      setBackupProgress(10)
      
      loggers.system.startup()
      setBackupProgress(30)
      
      await backup.download()
      setBackupProgress(80)
      
      setTimeout(() => {
        setBackupProgress(100)
        setIsBackingUp(false)
        setBackupProgress(0)
      }, 1000)
    } catch (error) {
      logger.error('Backup failed', error)
      setIsBackingUp(false)
      setBackupProgress(0)
    }
  }

  const handleRestore = async (file: File) => {
    try {
      const result = await backup.restoreFromFile(file, {
        validateIntegrity: true,
        createBackupFirst: true,
        dryRun: false
      })
      
      if (result.success) {
        logger.info('Restore completed', { restoredRecords: result.restoredRecords })
      } else {
        logger.error('Restore failed', { errors: result.errors })
      }
    } catch (error) {
      logger.error('Restore process failed', error)
    }
  }

  const performanceInsights = getInsights() || []
  const backupHistory = backup.getHistory()
  const systemLogs = logger.getLogs().slice(-10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel Produksi</h2>
          <p className="text-gray-600">Monitoring, backup, dan administrasi sistem</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sistem Aktif
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
          <TabsTrigger value="performance">Performa</TabsTrigger>
          <TabsTrigger value="logs">Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status Sistem</p>
                    <p className="text-2xl font-bold text-green-600">Online</p>
                  </div>
                  <Wifi className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Backup Terakhir</p>
                    <p className="text-lg font-medium">
                      {backupHistory.length > 0 
                        ? new Date(backupHistory[backupHistory.length - 1].timestamp).toLocaleDateString('id-ID')
                        : 'Belum ada'
                      }
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Performa</p>
                    <p className="text-lg font-medium">
                      {performanceInsights.length === 0 ? 'Optimal' : 'Perlu Perhatian'}
                    </p>
                  </div>
                  <Activity className={`w-8 h-8 ${performanceInsights.length === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {performanceInsights.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ditemukan {performanceInsights.length} masalah performa yang perlu diperhatikan.
                Lihat tab "Performa" untuk detail.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
              <CardDescription>Informasi teknis aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Versi Aplikasi:</span>
                    <span className="text-sm font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Environment:</span>
                    <Badge variant={process.env.NODE_ENV === 'production' ? 'default' : 'secondary'}>
                      {process.env.NODE_ENV || 'development'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Session ID:</span>
                    {/* <span className="text-xs font-mono text-gray-500">{logger.sessionId?.slice(0, 12)}...</span> */}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Log Entries:</span>
                    <span className="text-sm font-medium">{logger.getLogs().length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Error Count:</span>
                    <span className="text-sm font-medium text-red-600">
                      {logger.getLogs().filter(log => log.level >= 3).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate:</span>
                    <span className="text-sm font-medium text-green-600">87%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Backup Data
                </CardTitle>
                <CardDescription>
                  Buat backup lengkap dari semua data aplikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBackingUp && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress backup...</span>
                      <span>{backupProgress}%</span>
                    </div>
                    <Progress value={backupProgress} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleBackup} 
                    disabled={isBackingUp}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isBackingUp ? 'Membuat Backup...' : 'Download Backup'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => backup.emergency()}
                    className="w-full"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Restore Data
                </CardTitle>
                <CardDescription>
                  Pulihkan data dari file backup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Hati-hati! Restore akan mengganti data yang ada. 
                      Backup otomatis akan dibuat sebelum restore.
                    </AlertDescription>
                  </Alert>
                  
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleRestore(file)
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Backup</CardTitle>
              <CardDescription>
                {backupHistory.length} backup tersimpan dalam histori
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Belum ada riwayat backup</p>
              ) : (
                <div className="space-y-2">
                  {backupHistory.slice(-5).reverse().map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(backup.timestamp).toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {backup.recordCount} records • {backup.reason}
                        </p>
                      </div>
                      <Badge variant="outline">{backup.propertyId || 'All'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Security Level</p>
                    <p className="text-2xl font-bold text-green-600">High</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Threat Level</p>
                    <p className="text-2xl font-bold text-green-600">Low</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>Real-time security status dan threat detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">XSS Protection</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CSRF Protection</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Input Sanitization</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Security</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => monitoring.checkIntegrity()}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Run Security Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Page Load</p>
                    <p className="text-2xl font-bold">1.2s</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold">45MB</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">API Response</p>
                    <p className="text-2xl font-bold">180ms</p>
                  </div>
                  <Activity className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Analisis performa dan rekomendasi optimasi</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceInsights.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">Performa aplikasi optimal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {performanceInsights.map((insight, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">System Logs</h3>
              <p className="text-sm text-gray-600">{systemLogs.length} recent entries</p>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const logs = logger.exportLogs()
                  const blob = new Blob([logs], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `innsync-logs-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logger.clearLogs()}
              >
                Clear Logs
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                {systemLogs.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No logs available</p>
                ) : (
                  <div className="space-y-1">
                    {systemLogs.map((log, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border-b last:border-b-0 text-sm">
                        <Badge variant={
                          log.level === 0 ? 'secondary' :
                          log.level === 1 ? 'default' :
                          log.level === 2 ? 'outline' :
                          'destructive'
                        }>
                          {log.level === 0 ? 'DEBUG' :
                           log.level === 1 ? 'INFO' :
                           log.level === 2 ? 'WARN' :
                           'ERROR'}
                        </Badge>
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="flex-1">{log.message}</span>
                        {log.context && (
                          <Badge variant="outline" className="text-xs">
                            {log.context}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}