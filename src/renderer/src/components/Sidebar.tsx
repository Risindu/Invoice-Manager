import React from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FileText, PlusCircle, BarChart3, Settings,
  Receipt, ChevronLeft, ChevronRight
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'new-invoice', label: 'New Invoice', icon: PlusCircle },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold tracking-tight">Invoice Manager</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Professional Suite</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-fade-in" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
