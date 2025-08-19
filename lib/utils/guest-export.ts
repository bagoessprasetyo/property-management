// Guest data export utilities

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  fields?: string[]
  filename?: string
}

export function exportGuestData(guests: any[], options: ExportOptions) {
  const { format, fields, filename } = options
  const timestamp = new Date().toISOString().split('T')[0]
  const defaultFilename = `guests-export-${timestamp}`
  const finalFilename = filename || defaultFilename

  switch (format) {
    case 'csv':
      return exportToCSV(guests, fields, finalFilename)
    case 'excel':
      return exportToExcel(guests, fields, finalFilename)
    case 'pdf':
      return exportToPDF(guests, fields, finalFilename)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

function exportToCSV(guests: any[], fields?: string[], filename = 'guests-export') {
  const defaultFields = [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'identification_type',
    'identification_number',
    'nationality',
    'city',
    'state',
    'created_at'
  ]

  const exportFields = fields || defaultFields
  
  // Create CSV headers
  const headers = exportFields.map(field => {
    const fieldLabels: Record<string, string> = {
      first_name: 'Nama Depan',
      last_name: 'Nama Belakang',
      email: 'Email',
      phone: 'Telepon',
      identification_type: 'Tipe Identitas',
      identification_number: 'Nomor Identitas',
      nationality: 'Kewarganegaraan',
      city: 'Kota',
      state: 'Provinsi',
      created_at: 'Tanggal Bergabung'
    }
    return fieldLabels[field] || field
  }).join(',')

  // Create CSV data rows
  const rows = guests.map(guest => {
    return exportFields.map(field => {
      let value = guest[field] || ''
      
      // Format specific fields
      if (field === 'created_at') {
        value = new Date(value).toLocaleDateString('id-ID')
      }
      
      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    }).join(',')
  })

  const csvContent = [headers, ...rows].join('\n')
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

function exportToExcel(guests: any[], fields?: string[], filename = 'guests-export') {
  // For now, export as CSV with .xlsx extension
  // In a real implementation, you would use a library like SheetJS
  console.log('Excel export not fully implemented. Exporting as CSV instead.')
  exportToCSV(guests, fields, filename)
}

function exportToPDF(guests: any[], fields?: string[], filename = 'guests-export') {
  // Create a simple table HTML for PDF export
  const defaultFields = [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'identification_type',
    'identification_number',
    'nationality',
    'city'
  ]

  const exportFields = fields || defaultFields
  
  const fieldLabels: Record<string, string> = {
    first_name: 'Nama Depan',
    last_name: 'Nama Belakang',
    email: 'Email',
    phone: 'Telepon',
    identification_type: 'Tipe Identitas',
    identification_number: 'Nomor Identitas',
    nationality: 'Kewarganegaraan',
    city: 'Kota',
    state: 'Provinsi',
    created_at: 'Tanggal Bergabung'
  }

  const headers = exportFields.map(field => fieldLabels[field] || field)
  
  const tableRows = guests.map(guest => {
    return exportFields.map(field => {
      let value = guest[field] || '-'
      if (field === 'created_at') {
        value = new Date(value).toLocaleDateString('id-ID')
      }
      return value
    })
  })

  // Create HTML table
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daftar Tamu - ${new Date().toLocaleDateString('id-ID')}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .meta { text-align: center; color: #666; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Daftar Tamu</h1>
      <div class="meta">
        <p>Diekspor pada: ${new Date().toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p>Total: ${guests.length} tamu</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Also open in new window for printing to PDF
    const printWindow = window.open(url)
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    }
  }
}

export function getAvailableFields() {
  return [
    { key: 'first_name', label: 'Nama Depan' },
    { key: 'last_name', label: 'Nama Belakang' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telepon' },
    { key: 'identification_type', label: 'Tipe Identitas' },
    { key: 'identification_number', label: 'Nomor Identitas' },
    { key: 'nationality', label: 'Kewarganegaraan' },
    { key: 'date_of_birth', label: 'Tanggal Lahir' },
    { key: 'gender', label: 'Jenis Kelamin' },
    { key: 'address', label: 'Alamat' },
    { key: 'city', label: 'Kota' },
    { key: 'state', label: 'Provinsi' },
    { key: 'country', label: 'Negara' },
    { key: 'postal_code', label: 'Kode Pos' },
    { key: 'emergency_contact_name', label: 'Kontak Darurat' },
    { key: 'emergency_contact_phone', label: 'Telepon Darurat' },
    { key: 'dietary_restrictions', label: 'Pantangan Makanan' },
    { key: 'special_requests', label: 'Permintaan Khusus' },
    { key: 'notes', label: 'Catatan' },
    { key: 'created_at', label: 'Tanggal Bergabung' }
  ]
}