import { format } from 'date-fns'

interface ExportReservation {
  id: string
  guest_name: string
  room_number: string
  check_in_date: string
  check_out_date: string
  status: string
  total_amount: number
  confirmation_number: string
  adults: number
  children: number
  special_requests?: string
}

// Export to CSV format
export function exportToCSV(reservations: ExportReservation[], filename?: string) {
  const headers = [
    'Konfirmasi',
    'Tamu',
    'Kamar',
    'Check-in',
    'Check-out',
    'Status',
    'Total',
    'Dewasa',
    'Anak',
    'Permintaan Khusus'
  ]

  const csvContent = [
    headers.join(','),
    ...reservations.map(reservation => [
      reservation.confirmation_number,
      `"${reservation.guest_name}"`,
      reservation.room_number,
      reservation.check_in_date,
      reservation.check_out_date,
      reservation.status,
      reservation.total_amount,
      reservation.adults,
      reservation.children,
      `"${reservation.special_requests || ''}"`
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `reservations-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export to iCal format (for calendar integration)
export function exportToICalendar(reservations: ExportReservation[], filename?: string) {
  const formatDate = (dateString: string, time = '14:00') => {
    const date = new Date(`${dateString}T${time}:00`)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InnSync//Property Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...reservations.flatMap(reservation => [
      'BEGIN:VEVENT',
      `UID:${reservation.id}@innsync.com`,
      `DTSTART:${formatDate(reservation.check_in_date, '14:00')}`,
      `DTEND:${formatDate(reservation.check_out_date, '12:00')}`,
      `SUMMARY:${reservation.guest_name} - Kamar ${reservation.room_number}`,
      `DESCRIPTION:Konfirmasi: ${reservation.confirmation_number}\\nTamu: ${reservation.adults} dewasa${reservation.children > 0 ? `, ${reservation.children} anak` : ''}\\nTotal: Rp ${reservation.total_amount.toLocaleString('id-ID')}${reservation.special_requests ? `\\nPermintaan: ${reservation.special_requests}` : ''}`,
      `LOCATION:Kamar ${reservation.room_number}`,
      `STATUS:${reservation.status.toUpperCase()}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'DESCRIPTION:Reminder: Check-in dalam 1 jam',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT'
    ]),
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export to Excel format (XLSX)
export function exportToExcel(reservations: ExportReservation[], filename?: string) {
  // Create a simple tab-separated format that Excel can open
  const headers = [
    'Konfirmasi',
    'Tamu',
    'Kamar',
    'Check-in',
    'Check-out',
    'Status',
    'Total (IDR)',
    'Dewasa',
    'Anak',
    'Permintaan Khusus'
  ]

  const xlsContent = [
    headers.join('\t'),
    ...reservations.map(reservation => [
      reservation.confirmation_number,
      reservation.guest_name,
      reservation.room_number,
      reservation.check_in_date,
      reservation.check_out_date,
      reservation.status,
      reservation.total_amount,
      reservation.adults,
      reservation.children,
      reservation.special_requests || ''
    ].join('\t'))
  ].join('\n')

  const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `reservations-${format(new Date(), 'yyyy-MM-dd')}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export to PDF format (basic table)
export function exportToPDF(reservations: ExportReservation[], filename?: string) {
  // Create HTML content for PDF conversion
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Laporan Reservasi</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
            .pending { background-color: #fef3c7; color: #92400e; }
            .confirmed { background-color: #dbeafe; color: #1e40af; }
            .checked_in { background-color: #d1fae5; color: #065f46; }
            .checked_out { background-color: #f3f4f6; color: #374151; }
        </style>
    </head>
    <body>
        <h1>Laporan Reservasi InnSync</h1>
        <p>Tanggal Export: ${format(new Date(), 'dd MMMM yyyy HH:mm')} WIB</p>
        <table>
            <thead>
                <tr>
                    <th>Konfirmasi</th>
                    <th>Tamu</th>
                    <th>Kamar</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Tamu</th>
                </tr>
            </thead>
            <tbody>
                ${reservations.map(reservation => `
                    <tr>
                        <td>${reservation.confirmation_number}</td>
                        <td>${reservation.guest_name}</td>
                        <td>${reservation.room_number}</td>
                        <td>${format(new Date(reservation.check_in_date), 'dd/MM/yyyy')}</td>
                        <td>${format(new Date(reservation.check_out_date), 'dd/MM/yyyy')}</td>
                        <td><span class="status ${reservation.status}">${reservation.status}</span></td>
                        <td>Rp ${reservation.total_amount.toLocaleString('id-ID')}</td>
                        <td>${reservation.adults}${reservation.children > 0 ? ` +${reservation.children} anak` : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
            Generated by InnSync Property Management System
        </p>
    </body>
    </html>
  `

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// Generate sharing link for calendar view
export function generateCalendarShareLink(filters: {
  propertyId?: string
  startDate: string
  endDate: string
  viewType: string
}): string {
  const baseUrl = window.location.origin
  const params = new URLSearchParams({
    start: filters.startDate,
    end: filters.endDate,
    view: filters.viewType,
    ...(filters.propertyId && { property: filters.propertyId })
  })
  
  return `${baseUrl}/calendar/shared?${params.toString()}`
}

// Export all available formats
export const exportFormats = {
  csv: { label: 'CSV', icon: '📊', export: exportToCSV },
  excel: { label: 'Excel', icon: '📈', export: exportToExcel },
  ical: { label: 'Calendar (iCal)', icon: '📅', export: exportToICalendar },
  pdf: { label: 'PDF', icon: '📄', export: exportToPDF }
} as const