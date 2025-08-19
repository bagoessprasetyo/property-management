'use client'

import { useState } from 'react'
import { useProperty } from '@/lib/context/property-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Settings,
  Building,
  Users,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Database,
  Mail,
  Phone,
  MapPin,
  Clock,
  Palette,
  Save,
  Upload,
  Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/context/sidebar-context'

export default function SettingsPage() {
  const { currentProperty } = useProperty()
  const [activeTab, setActiveTab] = useState('property')
  const { isCollapsed } = useSidebar()
  // Property settings state
  const [propertySettings, setPropertySettings] = useState({
    name: currentProperty?.name || '',
    description: currentProperty?.description || '',
    address: currentProperty?.address || '',
    city: currentProperty?.city || '',
    state: currentProperty?.state || '',
    postal_code: currentProperty?.postal_code || '',
    country: 'Indonesia',
    phone: currentProperty?.phone || '',
    email: currentProperty?.email || '',
    website: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    tax_rate: 10,
    service_charge: 0
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_reservations: true,
    email_payments: true,
    email_reviews: false,
    sms_reservations: false,
    sms_payments: true,
    push_notifications: true,
    daily_reports: true,
    weekly_reports: true,
    monthly_reports: false
  })

  // User management settings
  const [userSettings, setUserSettings] = useState({
    max_concurrent_users: 10,
    session_timeout: 60,
    password_requirements: true,
    two_factor_auth: false,
    auto_logout: true
  })

  const handleSaveProperty = () => {
    // Save property settings
    console.log('Saving property settings:', propertySettings)
  }

  const handleSaveNotifications = () => {
    // Save notification settings
    console.log('Saving notification settings:', notifications)
  }

  const handleSaveUsers = () => {
    // Save user settings
    console.log('Saving user settings:', userSettings)
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h2>
            <p className="text-gray-600 mt-1">
              Kelola konfigurasi properti dan sistem
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="property" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Properti
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pengguna
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifikasi
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pembayaran
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Integrasi
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Sistem
            </TabsTrigger>
          </TabsList>

          {/* Property Settings */}
          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Informasi Properti
                </CardTitle>
                <CardDescription>
                  Kelola informasi dasar dan kontak properti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Properti</Label>
                    <Input
                      id="name"
                      value={propertySettings.name}
                      onChange={(e) => setPropertySettings({...propertySettings, name: e.target.value})}
                      placeholder="Nama hotel/properti"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                        <Phone className="w-4 h-4" />
                      </span>
                      <Input
                        id="phone"
                        value={propertySettings.phone}
                        onChange={(e) => setPropertySettings({...propertySettings, phone: e.target.value})}
                        placeholder="+62 xxx-xxxx-xxxx"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={propertySettings.description}
                    onChange={(e) => setPropertySettings({...propertySettings, description: e.target.value})}
                    placeholder="Deskripsi singkat tentang properti"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <Textarea
                      id="address"
                      value={propertySettings.address}
                      onChange={(e) => setPropertySettings({...propertySettings, address: e.target.value})}
                      placeholder="Jalan, nomor, RT/RW, Kelurahan"
                      className="rounded-l-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={propertySettings.city}
                      onChange={(e) => setPropertySettings({...propertySettings, city: e.target.value})}
                      placeholder="Jakarta"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Provinsi</Label>
                    <Input
                      id="state"
                      value={propertySettings.state}
                      onChange={(e) => setPropertySettings({...propertySettings, state: e.target.value})}
                      placeholder="DKI Jakarta"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                      id="postal_code"
                      value={propertySettings.postal_code}
                      onChange={(e) => setPropertySettings({...propertySettings, postal_code: e.target.value})}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                        <Mail className="w-4 h-4" />
                      </span>
                      <Input
                        id="email"
                        type="email"
                        value={propertySettings.email}
                        onChange={(e) => setPropertySettings({...propertySettings, email: e.target.value})}
                        placeholder="info@hotel.com"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                        <Globe className="w-4 h-4" />
                      </span>
                      <Input
                        id="website"
                        value={propertySettings.website}
                        onChange={(e) => setPropertySettings({...propertySettings, website: e.target.value})}
                        placeholder="https://hotel.com"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProperty} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Informasi Properti
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Operasional & Kebijakan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkin">Waktu Check-in</Label>
                    <Input
                      id="checkin"
                      type="time"
                      value={propertySettings.check_in_time}
                      onChange={(e) => setPropertySettings({...propertySettings, check_in_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout">Waktu Check-out</Label>
                    <Input
                      id="checkout"
                      type="time"
                      value={propertySettings.check_out_time}
                      onChange={(e) => setPropertySettings({...propertySettings, check_out_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Zona Waktu</Label>
                    <Select value={propertySettings.timezone} onValueChange={(value) => setPropertySettings({...propertySettings, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                        <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                        <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Select value={propertySettings.currency} onValueChange={(value) => setPropertySettings({...propertySettings, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax">Pajak (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={propertySettings.tax_rate}
                      onChange={(e) => setPropertySettings({...propertySettings, tax_rate: parseFloat(e.target.value)})}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service">Service Charge (%)</Label>
                    <Input
                      id="service"
                      type="number"
                      value={propertySettings.service_charge}
                      onChange={(e) => setPropertySettings({...propertySettings, service_charge: parseFloat(e.target.value)})}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Preferensi Notifikasi
                </CardTitle>
                <CardDescription>
                  Atur kapan dan bagaimana Anda ingin menerima notifikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-reservations">Reservasi Baru</Label>
                        <p className="text-sm text-gray-500">Notifikasi ketika ada reservasi baru</p>
                      </div>
                      <Switch
                        id="email-reservations"
                        checked={notifications.email_reservations}
                        onCheckedChange={(checked) => setNotifications({...notifications, email_reservations: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-payments">Pembayaran</Label>
                        <p className="text-sm text-gray-500">Notifikasi pembayaran berhasil atau gagal</p>
                      </div>
                      <Switch
                        id="email-payments"
                        checked={notifications.email_payments}
                        onCheckedChange={(checked) => setNotifications({...notifications, email_payments: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">SMS Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-reservations">Reservasi Mendesak</Label>
                        <p className="text-sm text-gray-500">SMS untuk reservasi hari ini</p>
                      </div>
                      <Switch
                        id="sms-reservations"
                        checked={notifications.sms_reservations}
                        onCheckedChange={(checked) => setNotifications({...notifications, sms_reservations: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-payments">Pembayaran Gagal</Label>
                        <p className="text-sm text-gray-500">SMS ketika pembayaran gagal</p>
                      </div>
                      <Switch
                        id="sms-payments"
                        checked={notifications.sms_payments}
                        onCheckedChange={(checked) => setNotifications({...notifications, sms_payments: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Laporan Otomatis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="daily-reports">Laporan Harian</Label>
                        <p className="text-sm text-gray-500">Dikirim setiap pagi</p>
                      </div>
                      <Switch
                        id="daily-reports"
                        checked={notifications.daily_reports}
                        onCheckedChange={(checked) => setNotifications({...notifications, daily_reports: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-reports">Laporan Mingguan</Label>
                        <p className="text-sm text-gray-500">Dikirim setiap Senin</p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notifications.weekly_reports}
                        onCheckedChange={(checked) => setNotifications({...notifications, weekly_reports: checked})}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Pengaturan Notifikasi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Manajemen Pengguna
                </CardTitle>
                <CardDescription>
                  Kelola akses dan keamanan pengguna sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-users">Maksimal Pengguna Bersamaan</Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={userSettings.max_concurrent_users}
                      onChange={(e) => setUserSettings({...userSettings, max_concurrent_users: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={userSettings.session_timeout}
                      onChange={(e) => setUserSettings({...userSettings, session_timeout: parseInt(e.target.value)})}
                      min="5"
                      max="480"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="password-req">Persyaratan Password Ketat</Label>
                      <p className="text-sm text-gray-500">Minimal 8 karakter, huruf besar, angka, dan simbol</p>
                    </div>
                    <Switch
                      id="password-req"
                      checked={userSettings.password_requirements}
                      onCheckedChange={(checked) => setUserSettings({...userSettings, password_requirements: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Wajibkan 2FA untuk semua pengguna</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={userSettings.two_factor_auth}
                      onCheckedChange={(checked) => setUserSettings({...userSettings, two_factor_auth: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-logout">Auto Logout</Label>
                      <p className="text-sm text-gray-500">Logout otomatis setelah idle</p>
                    </div>
                    <Switch
                      id="auto-logout"
                      checked={userSettings.auto_logout}
                      onCheckedChange={(checked) => setUserSettings({...userSettings, auto_logout: checked})}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveUsers} className="bg-warm-brown-600 hover:bg-warm-brown-700">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Pengaturan Pengguna
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pengaturan Pembayaran
                </CardTitle>
                <CardDescription>
                  Konfigurasi metode pembayaran dan gateway
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Pengaturan gateway pembayaran</p>
                  <p className="text-sm">Akan dikonfigurasi dengan provider pembayaran</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Integrasi Eksternal
                </CardTitle>
                <CardDescription>
                  Koneksi dengan sistem pihak ketiga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Integrasi OTA, Channel Manager, POS</p>
                  <p className="text-sm">Akan dikonfigurasi sesuai kebutuhan</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Pengaturan Sistem
                </CardTitle>
                <CardDescription>
                  Konfigurasi teknis dan maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Backup, maintenance, dan monitoring</p>
                  <p className="text-sm">Pengaturan tingkat sistem</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}