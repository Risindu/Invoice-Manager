st import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Check, Upload, X as XIcon, Image as ImageIcon } from 'lucide-react'
import type { Settings } from '../../../shared/types'

// Add safe constant for reasonable max image size (2MB)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024

interface SettingsPageProps {
  settings: Settings | null
  onUpdate: (settings: Partial<Settings>) => void
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
]

export function SettingsPage({ settings, onUpdate }: SettingsPageProps) {
  const [form, setForm] = useState<Partial<Settings>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  const handleSave = () => {
    onUpdate(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCurrencyChange = (code: string) => {
    const cur = currencies.find(c => c.code === code)
    if (cur) {
      setForm(prev => ({ ...prev, currency: cur.code, currencySymbol: cur.symbol }))
    }
  }

  const updateField = (field: keyof Settings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Image is too large. Please use an image under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      updateField('companyLogo', base64)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    updateField('companyLogo', '')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your invoice defaults and company info</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
          <CardDescription>This information appears on your invoices and PDF reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.companyName || ''} onChange={e => updateField('companyName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.companyEmail || ''} onChange={e => updateField('companyEmail', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.companyPhone || ''} onChange={e => updateField('companyPhone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={form.companyAddress || ''} onChange={e => updateField('companyAddress', e.target.value)} rows={3} />
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-6 transition-all hover:bg-card">
                {form.companyLogo ? (
                  <div className="relative group w-full flex flex-col items-center justify-center">
                    <div className="w-32 h-32 relative rounded-md overflow-hidden bg-white/5 flex items-center justify-center mb-4">
                      <img src={form.companyLogo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <Button variant="destructive" size="sm" onClick={removeLogo} className="gap-2 text-xs">
                      <XIcon className="w-3.5 h-3.5" /> Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                    <div className="text-sm font-medium">No logo selected</div>
                    <div className="text-xs text-muted-foreground mt-1 mb-4">Upload a PNG or JPG (max 2MB)</div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2">
                        <Upload className="w-4 h-4" /> Choose File
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </Label>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1 text-center">
                This logo will appear on the top left of your generated PDF invoices. Deep/transparent backgrounds look best.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Defaults</CardTitle>
          <CardDescription>Default values for new invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency || 'USD'} onValueChange={handleCurrencyChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input type="number" min="0" step="0.5" value={form.taxRate || 0} onChange={e => updateField('taxRate', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input value={form.invoicePrefix || ''} onChange={e => updateField('invoicePrefix', e.target.value)} placeholder="INV" />
            </div>
            <div className="space-y-2">
              <Label>Next Invoice Number</Label>
              <Input type="number" min="1" value={form.nextInvoiceNumber || 1001} onChange={e => updateField('nextInvoiceNumber', parseInt(e.target.value) || 1001)} />
            </div>
            <div className="space-y-2">
              <Label>Default Payment Terms</Label>
              <Input value={form.paymentTerms || ''} onChange={e => updateField('paymentTerms', e.target.value)} placeholder="Net 30" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-xs text-muted-foreground text-center pb-4">
        Invoice Manager v1.0.0 • Data is stored locally on your device
      </div>
    </div>
  )
}
