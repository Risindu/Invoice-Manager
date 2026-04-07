import ExcelJS from 'exceljs'
import type { Invoice, Settings } from '../shared/types'

export async function exportToExcel(invoices: Invoice[], settings: Settings, filePath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = settings.companyName
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Invoice Summary', {
    properties: { tabColor: { argb: '4F46E5' } }
  })

  sheet.columns = [
    { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Issue Date', key: 'issueDate', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'Tax', key: 'taxAmount', width: 12 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Total', key: 'total', width: 15 }
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 30

  for (const inv of invoices) {
    const row = sheet.addRow({
      invoiceNumber: inv.invoiceNumber,
      client: inv.client?.name || 'N/A',
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      discount: inv.discount,
      total: inv.total
    })
    row.alignment = { vertical: 'middle' }
  }

  const fmt = `${settings.currencySymbol}#,##0.00`
  ;['subtotal', 'taxAmount', 'discount', 'total'].forEach(key => {
    sheet.getColumn(key).numFmt = fmt
  })

  for (let i = 2; i <= invoices.length + 1; i++) {
    if (i % 2 === 0) {
      sheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }
    }
  }

  const totalRow = sheet.addRow({
    client: 'TOTAL',
    subtotal: invoices.reduce((s, i) => s + i.subtotal, 0),
    taxAmount: invoices.reduce((s, i) => s + i.taxAmount, 0),
    discount: invoices.reduce((s, i) => s + i.discount, 0),
    total: invoices.reduce((s, i) => s + i.total, 0)
  })
  totalRow.font = { bold: true, size: 11 }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8E8E8' } }

  sheet.autoFilter = { from: 'A1', to: `I${invoices.length + 1}` }

  await workbook.xlsx.writeFile(filePath)
}
