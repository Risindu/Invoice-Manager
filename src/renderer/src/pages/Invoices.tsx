import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Download, Trash2, Edit3, FileText, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, Settings } from '../../../shared/types'

interface InvoicesProps {
  invoices: Invoice[]
  settings: Settings | null
  onEdit: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onNewInvoice: () => void
  onRefresh: () => void
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  paid: 'success', sent: 'warning', overdue: 'danger', draft: 'secondary'
}

export function Invoices({ invoices, settings, onEdit, onDelete, onNewInvoice, onRefresh }: InvoicesProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)
  const sym = settings?.currencySymbol || '$'

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleExport = async () => {
    await window.api.exportToExcel()
    onRefresh()
  }

  const handleMarkPaid = async (inv: Invoice) => {
    await window.api.updateInvoice(inv.id, { status: 'paid' })
    onRefresh()
  }

  const handleMarkSent = async (inv: Invoice) => {
    await window.api.updateInvoice(inv.id, { status: 'sent' })
    onRefresh()
  }

  const confirmDelete = async () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">{invoices.length} total invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
          <Button onClick={onNewInvoice} className="gap-2">
            <Plus className="w-4 h-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No invoices found</p>
              <p className="text-xs mt-1">Create your first invoice to get started</p>
              <Button className="mt-4" onClick={onNewInvoice}><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(inv => (
                  <TableRow key={inv.id} className="group">
                    <TableCell className="font-semibold">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.client?.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[inv.status] || 'secondary'}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(inv.total, sym)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailInvoice(inv)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(inv)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(inv.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete this invoice? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailInvoice !== null} onOpenChange={() => setDetailInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {detailInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {detailInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <span className="font-medium ml-1">{detailInvoice.client?.name}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusVariant[detailInvoice.status]} className="ml-1">{detailInvoice.status}</Badge></div>
                <div><span className="text-muted-foreground">Issue Date:</span> <span className="ml-1">{formatDate(detailInvoice.issueDate)}</span></div>
                <div><span className="text-muted-foreground">Due Date:</span> <span className="ml-1">{formatDate(detailInvoice.dueDate)}</span></div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {detailInvoice.items?.map((item, i) => (
                    <TableRow key={i}><TableCell>{item.description}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">{formatCurrency(item.unitPrice, sym)}</TableCell><TableCell className="text-right">{formatCurrency(item.amount, sym)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <div className="space-y-1 text-sm w-48">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(detailInvoice.subtotal, sym)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax ({detailInvoice.taxRate}%)</span><span>{formatCurrency(detailInvoice.taxAmount, sym)}</span></div>
                  {detailInvoice.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(detailInvoice.discount, sym)}</span></div>}
                  <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>{formatCurrency(detailInvoice.total, sym)}</span></div>
                </div>
              </div>
              <DialogFooter>
                {detailInvoice.status === 'draft' && <Button variant="outline" onClick={() => { handleMarkSent(detailInvoice); setDetailInvoice(null) }}>Mark as Sent</Button>}
                {detailInvoice.status !== 'paid' && <Button onClick={() => { handleMarkPaid(detailInvoice); setDetailInvoice(null) }}>Mark as Paid</Button>}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
