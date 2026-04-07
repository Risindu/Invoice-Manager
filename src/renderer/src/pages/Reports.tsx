import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, BarChart3, Users } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Invoice, Settings } from '../../../shared/types'

interface ReportsProps {
  invoices: Invoice[]
  settings: Settings | null
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  paid: 'success', sent: 'warning', overdue: 'danger', draft: 'secondary'
}

export function Reports({ invoices, settings }: ReportsProps) {
  const sym = settings?.currencySymbol || '$'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportStatus, setReportStatus] = useState('all')

  const filtered = invoices.filter(inv => {
    const matchStatus = reportStatus === 'all' || inv.status === reportStatus
    const matchFrom = !dateFrom || inv.issueDate >= dateFrom
    const matchTo = !dateTo || inv.issueDate <= dateTo
    return matchStatus && matchFrom && matchTo
  })

  const totalAmount = filtered.reduce((s, i) => s + i.total, 0)
  const paidAmount = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const pendingAmount = filtered.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + i.total, 0)

  const clientSummary: Record<string, { name: string; total: number; paid: number; count: number }> = {}
  filtered.forEach(inv => {
    const name = inv.client?.name || 'Unknown'
    if (!clientSummary[name]) clientSummary[name] = { name, total: 0, paid: 0, count: 0 }
    clientSummary[name].total += inv.total
    if (inv.status === 'paid') clientSummary[name].paid += inv.total
    clientSummary[name].count++
  })

  const generatePdf = async (type: 'invoice-list' | 'revenue' | 'client') => {
    const doc = new jsPDF()
    const companyName = settings?.companyName || 'Your Company'
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFillColor(79, 70, 229) // indigo
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')

    if (settings?.companyLogo) {
      try {
        // Extract image format to satisfy jsPDF requirements
        const formatMatch = settings.companyLogo.match(/data:image\/(.*?);base64/)
        const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG'
        
        doc.addImage(settings.companyLogo, format, 14, 8, 24, 24)
        doc.text(companyName, 42, 18)
      } catch (e) {
        console.error('Failed to add logo to PDF', e)
        doc.text(companyName, 14, 18)
      }
    } else {
      doc.text(companyName, 14, 18)
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const title = type === 'invoice-list' ? 'Invoice Report' : type === 'revenue' ? 'Revenue Summary' : 'Client Report'
    doc.text(title, 14, 28)
    const dateRange = dateFrom || dateTo ? `${dateFrom || 'Start'} — ${dateTo || 'Present'}` : 'All Time'
    doc.text(`Period: ${dateRange}`, 14, 34)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 34, { align: 'right' })

    doc.setTextColor(0, 0, 0)

    if (type === 'invoice-list') {
      // Summary boxes
      doc.setFontSize(9)
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(14, 46, 55, 20, 2, 2, 'F')
      doc.roundedRect(75, 46, 55, 20, 2, 2, 'F')
      doc.roundedRect(136, 46, 55, 20, 2, 2, 'F')
      doc.setFont('helvetica', 'normal')
      doc.text('Total', 25, 53)
      doc.text('Paid', 91, 53)
      doc.text('Pending', 152, 53)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(formatCurrency(totalAmount, sym), 25, 61)
      doc.text(formatCurrency(paidAmount, sym), 91, 61)
      doc.text(formatCurrency(pendingAmount, sym), 152, 61)

      autoTable(doc, {
        startY: 72,
        head: [['Invoice #', 'Client', 'Date', 'Due', 'Status', 'Amount']],
        body: filtered.map(inv => [
          inv.invoiceNumber,
          inv.client?.name || 'N/A',
          inv.issueDate,
          inv.dueDate,
          inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
          formatCurrency(inv.total, sym)
        ]),
        headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        foot: [['', '', '', '', 'TOTAL', formatCurrency(totalAmount, sym)]],
        footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold', fontSize: 9 }
      })
    } else if (type === 'client') {
      const clientData = Object.values(clientSummary).sort((a, b) => b.total - a.total)
      autoTable(doc, {
        startY: 48,
        head: [['Client', 'Invoices', 'Total Revenue', 'Paid', 'Outstanding']],
        body: clientData.map(c => [
          c.name, String(c.count), formatCurrency(c.total, sym), formatCurrency(c.paid, sym), formatCurrency(c.total - c.paid, sym)
        ]),
        headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      })
    } else {
      // Revenue summary by month
      const monthly: Record<string, { month: string; revenue: number; paid: number; count: number }> = {}
      filtered.forEach(inv => {
        const d = new Date(inv.issueDate)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        if (!monthly[key]) monthly[key] = { month: label, revenue: 0, paid: 0, count: 0 }
        monthly[key].revenue += inv.total
        if (inv.status === 'paid') monthly[key].paid += inv.total
        monthly[key].count++
      })
      const monthlyData = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
      autoTable(doc, {
        startY: 48,
        head: [['Month', 'Invoices', 'Revenue', 'Collected', 'Outstanding']],
        body: monthlyData.map(m => [
          m.month, String(m.count), formatCurrency(m.revenue, sym), formatCurrency(m.paid, sym), formatCurrency(m.revenue - m.paid, sym)
        ]),
        headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        foot: [['TOTAL', String(filtered.length), formatCurrency(totalAmount, sym), formatCurrency(paidAmount, sym), formatCurrency(totalAmount - paidAmount, sym)]],
        footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold', fontSize: 9 }
      })
    }

    const pdfData = doc.output('arraybuffer')
    await window.api.savePdf(Array.from(new Uint8Array(pdfData)), `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate PDF reports and export data</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[160px]" /></div>
            <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[160px]" /></div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground pb-2">{filtered.length} invoices matched</div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Invoice Report</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Revenue Summary</TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Client Report</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">Invoice Report</CardTitle><CardDescription>All invoices for the selected period</CardDescription></div>
              <Button onClick={() => generatePdf('invoice-list')} className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="stat-card stat-card-primary"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold mt-1">{formatCurrency(totalAmount, sym)}</p></div>
                <div className="stat-card stat-card-success"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold mt-1">{formatCurrency(paidAmount, sym)}</p></div>
                <div className="stat-card stat-card-warning"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold mt-1">{formatCurrency(pendingAmount, sym)}</p></div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.slice(0, 20).map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.client?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                      <TableCell><Badge variant={statusVariant[inv.status]}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(inv.total, sym)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 20 && <p className="text-xs text-muted-foreground text-center mt-3">Showing 20 of {filtered.length} — download PDF for full report</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">Revenue Summary</CardTitle><CardDescription>Monthly revenue breakdown</CardDescription></div>
              <Button onClick={() => generatePdf('revenue')} className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">{formatCurrency(totalAmount, sym)} <span className="text-sm font-normal text-muted-foreground">total revenue</span></p>
              <p className="text-sm text-muted-foreground">Download the PDF for a detailed monthly breakdown.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">Client Report</CardTitle><CardDescription>Revenue by client</CardDescription></div>
              <Button onClick={() => generatePdf('client')} className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Invoices</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Outstanding</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.values(clientSummary).sort((a, b) => b.total - a.total).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(c.total, sym)}</TableCell>
                      <TableCell className="text-right text-emerald-400">{formatCurrency(c.paid, sym)}</TableCell>
                      <TableCell className="text-right text-amber-400">{formatCurrency(c.total - c.paid, sym)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
