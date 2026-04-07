import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Save, X, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { generateId, formatCurrency } from '@/lib/utils'
import type { Invoice, Client, Settings, InvoiceItem } from '../../../shared/types'

interface InvoiceFormProps {
  clients: Client[]
  settings: Settings | null
  editingInvoice: Invoice | null
  onSave: () => void
  onCancel: () => void
}

function emptyItem(): InvoiceItem {
  return { id: generateId(), description: '', quantity: 1, unitPrice: 0, amount: 0 }
}

export function InvoiceForm({ clients, settings, editingInvoice, onSave, onCancel }: InvoiceFormProps) {
  const sym = settings?.currencySymbol || '$'
  const isEdit = !!editingInvoice

  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<string>('draft')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()])
  const [taxRate, setTaxRate] = useState(settings?.taxRate || 0)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState(settings?.paymentTerms || 'Net 30')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingInvoice) {
      setClientId(editingInvoice.client?.id || '')
      setStatus(editingInvoice.status)
      setIssueDate(editingInvoice.issueDate)
      setDueDate(editingInvoice.dueDate)
      setItems(editingInvoice.items?.length ? editingInvoice.items : [emptyItem()])
      setTaxRate(editingInvoice.taxRate)
      setDiscount(editingInvoice.discount)
      setNotes(editingInvoice.notes || '')
      setPaymentTerms(editingInvoice.paymentTerms || '')
    } else {
      // Default due date: 30 days from now
      const dd = new Date()
      dd.setDate(dd.getDate() + 30)
      setDueDate(dd.toISOString().split('T')[0])
    }
  }, [editingInvoice])

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].amount = updated[index].quantity * updated[index].unitPrice
      }
      return updated
    })
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (index: number) => {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discount

  const handleSaveNewClient = async () => {
    if (!newClient.name.trim()) return
    const created = await window.api.createClient(newClient)
    setClientId(created.id)
    setShowNewClient(false)
    setNewClient({ name: '', email: '', phone: '', address: '' })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const client = clients.find(c => c.id === clientId) || { id: '', name: 'Walk-in', email: '', phone: '', address: '', createdAt: '' }
      const invoiceNumber = isEdit
        ? editingInvoice!.invoiceNumber
        : `${settings?.invoicePrefix || 'INV'}-${String(settings?.nextInvoiceNumber || 1001).padStart(4, '0')}`

      const data = {
        invoiceNumber,
        client,
        status: status as any,
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        notes,
        paymentTerms
      }

      if (isEdit) {
        await window.api.updateInvoice(editingInvoice!.id, data)
      } else {
        await window.api.createInvoice(data)
      }
      onSave()
    } catch (err) {
      console.error('Failed to save invoice:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEdit ? `Editing ${editingInvoice?.invoiceNumber}` : 'Create a new invoice'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Invoice'}</Button>
        </div>
      </div>

      {/* Client & Dates */}
      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setShowNewClient(true)}><UserPlus className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="w-4 h-4" /> Add Item</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1"></div>
          </div>
          <Separator />
          {items.map((item, i) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center animate-fade-in">
              <div className="col-span-5">
                <Input placeholder="Item description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Input type="number" min="0" step="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-2">
                <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-2 text-right font-medium text-sm px-2">
                {formatCurrency(item.amount, sym)}
              </div>
              <div className="col-span-1 flex justify-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(i)} disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Totals */}
          <Separator className="mt-4" />
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, sym)}</span></div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Tax (%)</span>
                <Input type="number" min="0" step="0.5" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right text-xs" />
                <span className="font-medium w-20 text-right">{formatCurrency(taxAmount, sym)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right text-xs" />
                <span className="font-medium w-20 text-right">-{formatCurrency(discount, sym)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(total, sym)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Additional Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes for the client..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* New Client Dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Address</Label><Textarea value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClient(false)}>Cancel</Button>
            <Button onClick={handleSaveNewClient}>Save Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
