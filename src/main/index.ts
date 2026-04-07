import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { join } from 'path'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { Store } from './store'
import { exportToExcel } from './excel'
import type { Invoice } from '../shared/types'

function getIconPath(): string | undefined {
  const candidates = [
    join(process.cwd(), 'build', 'icon.png'),
    join(__dirname, '..', '..', 'build', 'icon.png'),
    join(process.resourcesPath || '', 'icon.png'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return undefined
}

let mainWindow: BrowserWindow
const store = new Store()

function createWindow(): void {
  const iconPath = getIconPath()
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0b14',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Dev or production loading
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  // Invoice CRUD
  ipcMain.handle('invoices:getAll', () => store.getInvoices())
  ipcMain.handle('invoices:get', (_, id: string) => store.getInvoice(id))
  ipcMain.handle('invoices:create', (_, data) => store.createInvoice(data))
  ipcMain.handle('invoices:update', (_, id: string, data) => store.updateInvoice(id, data))
  ipcMain.handle('invoices:delete', (_, id: string) => store.deleteInvoice(id))

  // Client CRUD
  ipcMain.handle('clients:getAll', () => store.getClients())
  ipcMain.handle('clients:create', (_, data) => store.createClient(data))
  ipcMain.handle('clients:update', (_, id: string, data) => store.updateClient(id, data))
  ipcMain.handle('clients:delete', (_, id: string) => store.deleteClient(id))

  // Settings
  ipcMain.handle('settings:get', () => store.getSettings())
  ipcMain.handle('settings:update', (_, data) => store.updateSettings(data))

  // Dashboard
  ipcMain.handle('dashboard:getData', () => store.getDashboardData())

  // Excel export
  ipcMain.handle('excel:export', async (_, invoiceIds?: string[]) => {
    const invoices = invoiceIds
      ? invoiceIds.map(id => store.getInvoice(id)).filter(Boolean) as Invoice[]
      : store.getInvoices()
    const settings = store.getSettings()

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `invoices_${new Date().toISOString().split('T')[0]}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) return false
    await exportToExcel(invoices, settings, result.filePath)
    return true
  })

  // PDF save
  ipcMain.handle('pdf:save', async (_, data: number[], filename: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) return false
    await writeFile(result.filePath, Buffer.from(data))
    return true
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  // Auto Updater Configuration
  log.transports.file.level = 'info'
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version of Invoice Manager has been downloaded. It will be installed the next time you restart the application.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
