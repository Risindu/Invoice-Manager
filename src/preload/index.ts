import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
  getInvoice: (id: string) => ipcRenderer.invoke('invoices:get', id),
  createInvoice: (invoice: any) => ipcRenderer.invoke('invoices:create', invoice),
  updateInvoice: (id: string, invoice: any) => ipcRenderer.invoke('invoices:update', id, invoice),
  deleteInvoice: (id: string) => ipcRenderer.invoke('invoices:delete', id),

  getClients: () => ipcRenderer.invoke('clients:getAll'),
  createClient: (client: any) => ipcRenderer.invoke('clients:create', client),
  updateClient: (id: string, client: any) => ipcRenderer.invoke('clients:update', id, client),
  deleteClient: (id: string) => ipcRenderer.invoke('clients:delete', id),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),

  getDashboardData: () => ipcRenderer.invoke('dashboard:getData'),
  exportToExcel: (invoiceIds?: string[]) => ipcRenderer.invoke('excel:export', invoiceIds),
  savePdf: (data: number[], filename: string) => ipcRenderer.invoke('pdf:save', data, filename)
}

contextBridge.exposeInMainWorld('api', api)
