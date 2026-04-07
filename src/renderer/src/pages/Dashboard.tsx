import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle, ArrowUpRight, Plus, FileText
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Settings, DashboardData } from '../../../shared/types'

interface DashboardProps {
  settings: Settings | null
  onNavigate: (page: string) => void
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  paid: 'success', sent: 'warning', overdue: 'danger', draft: 'secondary'
}

export function Dashboard({ settings, onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const sym = settings?.currencySymbol || '$'

  useEffect(() => {
    window.api.getDashboardData().then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue, sym), icon: DollarSign, change: `${data.totalInvoices} invoices`, cls: 'stat-card-primary', iconBg: 'bg-indigo-500/10 text-indigo-400' },
    { label: 'Paid', value: formatCurrency(data.paidAmount, sym), icon: TrendingUp, change: `${data.paidInvoices} paid`, cls: 'stat-card-success', iconBg: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Pending', value: formatCurrency(data.pendingAmount, sym), icon: Clock, change: `${data.pendingInvoices} pending`, cls: 'stat-card-warning', iconBg: 'bg-amber-500/10 text-amber-400' },
    { label: 'Overdue', value: formatCurrency(data.overdueAmount, sym), icon: AlertTriangle, change: `${data.overdueInvoices} overdue`, cls: 'stat-card-danger', iconBg: 'bg-red-500/10 text-red-400' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's your invoice overview.</p>
        </div>
        <Button onClick={() => onNavigate('new-invoice')} className="gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.cls} animate-slide-up`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueByMonth}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(222 47% 10%)', border: '1px solid hsl(217 33% 17%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="paid" stroke="#10b981" fill="url(#paidGrad)" strokeWidth={2} name="Paid" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusDistribution.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {data.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(222 47% 10%)', border: '1px solid hsl(217 33% 17%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {data.statusDistribution.filter(d => d.value > 0).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('invoices')} className="text-xs gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No invoices yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate('new-invoice')}>
                  Create your first invoice
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentInvoices.slice(0, 5).map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.client?.name || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[inv.status] || 'secondary'}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(inv.total, sym)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No client data yet</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(222 47% 10%)', border: '1px solid hsl(217 33% 17%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
