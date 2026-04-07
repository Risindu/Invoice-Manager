import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Invoice, Client, Settings, DashboardData } from '../shared/types'

function loadDefaultLogo(): string {
  // Try multiple paths (dev vs production)
  const candidates = [
    join(process.cwd(), 'resources', 'company_logo.png'),
    join(__dirname, '..', '..', 'resources', 'company_logo.png'),
    join(process.resourcesPath || '', 'company_logo.png'),
  ]
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        const data = readFileSync(p)
        return `data:image/png;base64,${data.toString('base64')}`
      }
    } catch { /* skip */ }
  }
  return ''
}

const DATA_DIR = join(app.getPath('userData'), 'invoice-manager-data')

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJson<T>(filename: string, defaultValue: T): T {
  const filepath = join(DATA_DIR, filename)
  try {
    if (existsSync(filepath)) {
      return JSON.parse(readFileSync(filepath, 'utf-8'))
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e)
  }
  return defaultValue
}

function writeJson<T>(filename: string, data: T): void {
  const filepath = join(DATA_DIR, filename)
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  currencySymbol: '$',
  companyName: 'Your Company',
  companyAddress: '123 Business St, City, State 12345',
  companyEmail: 'contact@yourcompany.com',
  companyPhone: '+1 (555) 123-4567',
  companyLogo: '', // Will be populated with default logo at runtime
  taxRate: 10,
  paymentTerms: 'Net 30',
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1001
}

export class Store {
  private invoices: Invoice[]
  private clients: Client[]
  private settings: Settings

  constructor() {
    ensureDir()
    this.invoices = readJson<Invoice[]>('invoices.json', [])
    this.clients = readJson<Client[]>('clients.json', [])
    this.settings = readJson<Settings>('settings.json', DEFAULT_SETTINGS)

    // Auto-populate default company logo if none is set
    if (!this.settings.companyLogo) {
      const defaultLogo = loadDefaultLogo()
      if (defaultLogo) {
        this.settings.companyLogo = defaultLogo
        this.saveSettings()
      }
    }
  }

  private saveInvoices(): void { writeJson('invoices.json', this.invoices) }
  private saveClients(): void { writeJson('clients.json', this.clients) }
  private saveSettings(): void { writeJson('settings.json', this.settings) }

  getInvoices(): Invoice[] { return this.invoices }

  getInvoice(id: string): Invoice | null {
    return this.invoices.find(i => i.id === id) || null
  }

  createInvoice(data: any): Invoice {
    const invoice: Invoice = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.invoices.push(invoice)
    // Auto-increment invoice number
    this.settings.nextInvoiceNumber++
    this.saveSettings()
    this.saveInvoices()
    return invoice
  }

  updateInvoice(id: string, data: Partial<Invoice>): Invoice {
    const index = this.invoices.findIndex(i => i.id === id)
    if (index === -1) throw new Error('Invoice not found')
    this.invoices[index] = { ...this.invoices[index], ...data, updatedAt: new Date().toISOString() }
    this.saveInvoices()
    return this.invoices[index]
  }

  deleteInvoice(id: string): void {
    this.invoices = this.invoices.filter(i => i.id !== id)
    this.saveInvoices()
  }

  getClients(): Client[] { return this.clients }

  createClient(data: any): Client {
    const client: Client = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
    this.clients.push(client)
    this.saveClients()
    return client
  }

  updateClient(id: string, data: Partial<Client>): Client {
    const index = this.clients.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Client not found')
    this.clients[index] = { ...this.clients[index], ...data }
    this.saveClients()
    return this.clients[index]
  }

  deleteClient(id: string): void {
    this.clients = this.clients.filter(c => c.id !== id)
    this.saveClients()
  }

  getSettings(): Settings { return this.settings }

  updateSettings(data: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...data }
    this.saveSettings()
    return this.settings
  }

  getDashboardData(): DashboardData {
    const now = new Date()
    const paidInvs = this.invoices.filter(i => i.status === 'paid')
    const pendingInvs = this.invoices.filter(i => i.status === 'sent' || i.status === 'draft')
    const overdueInvs = this.invoices.filter(i => i.status === 'overdue')

    const totalRevenue = this.invoices.reduce((s, i) => s + i.total, 0)
    const paidAmount = paidInvs.reduce((s, i) => s + i.total, 0)
    const pendingAmount = pendingInvs.reduce((s, i) => s + i.total, 0)
    const overdueAmount = overdueInvs.reduce((s, i) => s + i.total, 0)

    const revenueByMonth: DashboardData['revenueByMonth'] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const mi = this.invoices.filter(inv => {
        const id2 = new Date(inv.issueDate)
        return id2.getMonth() === d.getMonth() && id2.getFullYear() === d.getFullYear()
      })
      revenueByMonth.push({
        month: monthStr,
        revenue: mi.reduce((s, inv) => s + inv.total, 0),
        paid: mi.filter(inv => inv.status === 'paid').reduce((s, inv) => s + inv.total, 0)
      })
    }

    const statusDistribution = [
      { name: 'Paid', value: paidInvs.length, color: '#10b981' },
      { name: 'Pending', value: pendingInvs.length, color: '#f59e0b' },
      { name: 'Overdue', value: overdueInvs.length, color: '#ef4444' },
      { name: 'Draft', value: this.invoices.filter(i => i.status === 'draft').length, color: '#6b7280' }
    ]

    const clientMap: Record<string, { name: string; total: number; count: number }> = {}
    for (const inv of this.invoices) {
      const key = inv.client?.name || 'Unknown'
      if (!clientMap[key]) clientMap[key] = { name: key, total: 0, count: 0 }
      clientMap[key].total += inv.total
      clientMap[key].count++
    }

    return {
      totalRevenue, paidAmount, pendingAmount, overdueAmount,
      totalInvoices: this.invoices.length,
      paidInvoices: paidInvs.length,
      pendingInvoices: pendingInvs.length,
      overdueInvoices: overdueInvs.length,
      revenueByMonth, statusDistribution,
      topClients: Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5),
      recentInvoices: [...this.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    }
  }
}
