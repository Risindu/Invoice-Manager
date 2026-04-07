export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Invoice {
  id: string
  invoiceNumber: string
  client: Client
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  notes: string
  paymentTerms: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  currency: string
  currencySymbol: string
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyLogo: string
  taxRate: number
  paymentTerms: string
  invoicePrefix: string
  nextInvoiceNumber: number
}

export interface DashboardData {
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  revenueByMonth: { month: string; revenue: number; paid: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  topClients: { name: string; total: number; count: number }[]
  recentInvoices: Invoice[]
}

export interface ElectronAPI {
  getInvoices: () => Promise<Invoice[]>
  getInvoice: (id: string) => Promise<Invoice | null>
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
  getClients: () => Promise<Client[]>
  createClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>
  updateClient: (id: string, client: Partial<Client>) => Promise<Client>
  deleteClient: (id: string) => Promise<void>
  getSettings: () => Promise<Settings>
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>
  getDashboardData: () => Promise<DashboardData>
  exportToExcel: (invoiceIds?: string[]) => Promise<boolean>
  savePdf: (data: number[], filename: string) => Promise<boolean>
}
