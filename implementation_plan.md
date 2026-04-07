# Invoice Manager Desktop App — Implementation Plan

## Overview

A professional desktop application for managing invoices, built with **Electron + React + Shadcn/UI + Tailwind CSS**. The app provides:

1. **Invoice Management** — Create, edit, delete, and search invoices
2. **Excel Integration** — Export invoice data to Excel sheets
3. **Dashboard** — Visual analytics with charts (revenue trends, payment status, top clients)
4. **PDF Reports** — Generate professional PDF invoices and summary reports

> [!NOTE]
> You mentioned "Java and Shadcn based desktop app". Shadcn/UI is a React component library, so the natural fit is **Electron** (JavaScript/TypeScript runtime) + **React** + **Shadcn/UI**. This gives you a true desktop app with native system access (file dialogs, system tray, etc.) while using Shadcn for the UI. If you strictly need a Java backend, we can add a Spring Boot service layer, but for an invoice manager all logic can run efficiently in the Electron process.

---

## User Review Required

> [!IMPORTANT]
> **Technology Stack Clarification**: The plan uses Electron + React + Shadcn/UI (JavaScript/TypeScript). If you need a Java backend (e.g., Spring Boot), please confirm and I'll adjust the architecture to include IPC between Electron and a Java process.

> [!IMPORTANT]
> **Data Storage**: The plan uses **local SQLite** via `better-sqlite3` for persistent invoice storage. This means data lives on the user's machine. If you need cloud sync or multi-user support, please let me know.

> [!WARNING]
> **Excel "Input"**: You mentioned "input data into an Excel sheet." The plan interprets this as:
> - Users create invoices in the app UI → data is stored in SQLite → can be **exported** to Excel.
> - Optionally, users can **import** invoices from an existing Excel file.
> If you mean the app should literally use Excel as the primary data entry interface, that changes the architecture significantly — please clarify.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Electron Main                  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  SQLite   │  │   File   │  │   PDF Gen    │ │
│  │   (DB)    │  │  System  │  │  (jsPDF)     │ │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│        │              │               │         │
│        └──────────┬───┴───────────────┘         │
│                   │ IPC Bridge                  │
├───────────────────┼─────────────────────────────┤
│                   │                             │
│  ┌────────────────▼───────────────────────────┐ │
│  │         React Renderer Process             │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────┐ │ │
│  │  │Dashboard │ │ Invoices  │ │  Reports  │ │ │
│  │  │ (Charts) │ │ (CRUD)    │ │  (PDF)    │ │ │
│  │  └──────────┘ └───────────┘ └───────────┘ │ │
│  │         Shadcn/UI + Tailwind CSS           │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Shell | Electron 33+ | Native desktop wrapper |
| Build Tool | Vite + electron-vite | Fast HMR, optimized builds |
| UI Framework | React 18 | Component-based UI |
| UI Components | Shadcn/UI | Premium, customizable components |
| Styling | Tailwind CSS v3 | Utility-first CSS |
| Charts | Recharts | Dashboard visualizations |
| Database | better-sqlite3 | Local persistent storage |
| Excel | ExcelJS | Read/write .xlsx files |
| PDF | jsPDF + jspdf-autotable | Generate PDF invoices |
| State | React Context + hooks | Simple state management |
| Icons | Lucide React | Consistent icon set |

---

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] `package.json`
Root package.json with all dependencies, scripts for dev/build.

#### [NEW] `electron.vite.config.ts`
Vite configuration for Electron main, preload, and renderer processes.

#### [NEW] `electron-builder.yml`
Build configuration for packaging the app as a Windows installer.

---

### 2. Electron Main Process

#### [NEW] `src/main/index.ts`
- App lifecycle management (ready, window-all-closed, activate)
- Create BrowserWindow with proper security settings
- Register IPC handlers for all backend operations

#### [NEW] `src/main/database.ts`
- SQLite database initialization and schema creation
- Tables: `invoices`, `invoice_items`, `clients`, `settings`
- CRUD operations exposed via IPC

#### [NEW] `src/main/excel.ts`
- Export invoices to .xlsx using ExcelJS
- Import invoices from .xlsx files
- Styled Excel output with headers, formatting, totals

#### [NEW] `src/main/pdf.ts`
- Generate PDF invoice documents
- Generate PDF summary reports
- Professional layout with company branding

---

### 3. Preload Bridge

#### [NEW] `src/preload/index.ts`
- Secure `contextBridge` exposing API to renderer
- Typed IPC channels for invoices, Excel, PDF, dashboard data

---

### 4. React Renderer (UI)

#### [NEW] `src/renderer/src/main.tsx`
Entry point, renders App with providers.

#### [NEW] `src/renderer/src/App.tsx`
Root component with sidebar navigation, routing between Dashboard/Invoices/Reports.

#### [NEW] `src/renderer/src/index.css`
Global styles, Tailwind imports, Shadcn CSS variables, dark theme with premium color palette.

---

### 5. UI Components — Dashboard

#### [NEW] `src/renderer/src/pages/Dashboard.tsx`
- Revenue overview cards (total, paid, pending, overdue)
- Revenue trend line chart (monthly)
- Invoice status pie/donut chart
- Top clients bar chart
- Recent invoices table

---

### 6. UI Components — Invoices

#### [NEW] `src/renderer/src/pages/Invoices.tsx`
- Invoice list with search, filter, sort
- Status badges (Draft, Sent, Paid, Overdue)
- Bulk actions (export, delete)

#### [NEW] `src/renderer/src/pages/InvoiceForm.tsx`
- Client selection/creation
- Line items (description, qty, rate, amount)
- Tax calculation, discounts
- Notes, payment terms
- Save as draft or send

#### [NEW] `src/renderer/src/pages/InvoiceDetail.tsx`
- Full invoice preview
- Actions: Edit, PDF, Send, Mark as Paid
- Payment history

---

### 7. UI Components — Reports

#### [NEW] `src/renderer/src/pages/Reports.tsx`
- Report type selection (Invoice Report, Revenue Summary, Client Report)
- Date range picker
- Preview and download PDF
- Export to Excel

---

### 8. Shared UI Components

#### [NEW] `src/renderer/src/components/Sidebar.tsx`
Premium sidebar with navigation, logo, user info.

#### [NEW] `src/renderer/src/components/Header.tsx`
Page header with breadcrumbs, search, actions.

#### [NEW] `src/renderer/src/components/ui/*`
Shadcn/UI components installed via CLI: Button, Card, Table, Dialog, Form, Input, Select, Badge, Tabs, Calendar, Popover, Chart, etc.

---

## Data Schema

```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  notes TEXT,
  payment_terms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  amount REAL DEFAULT 0
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## Open Questions

> [!IMPORTANT]
> 1. **Java requirement**: Do you strictly need Java, or is JavaScript/TypeScript (Electron) acceptable? Shadcn/UI is a React library, so JavaScript is the natural choice.
> 2. **Company branding**: Do you have a logo, company name, and colors for the PDF invoices?
> 3. **Currency**: What currency should be used (₹ INR, $ USD, etc.)?
> 4. **Excel as input**: Should users be able to import invoices FROM Excel, or only export TO Excel?

---

## Verification Plan

### Automated Tests
1. `npm run dev` — Verify the app launches without errors
2. Create a test invoice, verify it appears in the list
3. Export to Excel, open the .xlsx file and verify data
4. Generate PDF, open and verify formatting
5. Dashboard charts render with sample data

### Manual Verification
- Full CRUD workflow: Create → Edit → PDF → Excel → Delete
- Dashboard reflects real-time data changes
- Dark mode / theme consistency
- Window resizing / responsive layout
- File save dialogs work on Windows
