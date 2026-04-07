import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { Invoices } from '@/pages/Invoices'
import { InvoiceForm } from '@/pages/InvoiceForm'
import { Reports } from '@/pages/Reports'
import { SettingsPage } from '@/pages/Settings'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Invoice, Client, Settings } from '../../shared/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const loadData = useCallback(async () => {
    const [invs, cls, sets] = await Promise.all([
      window.api.getInvoices(),
      window.api.getClients(),
      window.api.getSettings()
    ])
    setInvoices(invs)
    setClients(cls)
    setSettings(sets)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleNavigate = (page: string) => {
    if (page !== 'new-invoice') setEditingInvoice(null)
    setCurrentPage(page)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setCurrentPage('new-invoice')
  }

  const handleSaveInvoice = async () => {
    await loadData()
    setEditingInvoice(null)
    setCurrentPage('invoices')
  }

  const handleDeleteInvoice = async (id: string) => {
    await window.api.deleteInvoice(id)
    await loadData()
  }

  const handleUpdateSettings = async (newSettings: Partial<Settings>) => {
    const updated = await window.api.updateSettings(newSettings)
    setSettings(updated)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard settings={settings} onNavigate={handleNavigate} />
      case 'invoices':
        return (
          <Invoices
            invoices={invoices}
            settings={settings}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onNewInvoice={() => handleNavigate('new-invoice')}
            onRefresh={loadData}
          />
        )
      case 'new-invoice':
        return (
          <InvoiceForm
            clients={clients}
            settings={settings}
            editingInvoice={editingInvoice}
            onSave={handleSaveInvoice}
            onCancel={() => handleNavigate('invoices')}
          />
        )
      case 'reports':
        return <Reports invoices={invoices} settings={settings} />
      case 'settings':
        return <SettingsPage settings={settings} onUpdate={handleUpdateSettings} />
      default:
        return <Dashboard settings={settings} onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 lg:p-8 min-h-screen">
            {renderPage()}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
