import { contextBridge, ipcRenderer } from 'electron'
import type { CircuitData, ParseWarning } from '@shared/types/circuit'

export interface ElectronAPI {
  file: {
    open: () => Promise<{ filePath: string; circuit: CircuitData; warnings: ParseWarning[] } | null>
    save: (data: {
      filePath: string
      circuit: CircuitData
    }) => Promise<{ success: boolean; error?: string }>
    saveAs: (circuit: CircuitData) => Promise<{ filePath: string; success: boolean } | null>
    read: (filePath: string) => Promise<{ content?: string; error?: string }>
    write: (data: {
      filePath: string
      content: string
    }) => Promise<{ success: boolean; error?: string }>
    openMemory: () => Promise<{ filePath: string; content: string } | null>
  }
  onMenuCommand: (callback: (command: string) => void) => () => void
}

const electronAPI: ElectronAPI = {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (data) => ipcRenderer.invoke('file:save', data),
    saveAs: (circuit) => ipcRenderer.invoke('file:save-as', circuit),
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),
    write: (data) => ipcRenderer.invoke('file:write', data),
    openMemory: () => ipcRenderer.invoke('file:openMemory')
  },
  onMenuCommand: (callback) => {
    const handlers: { channel: string; handler: () => void }[] = [
      { channel: 'menu:new', handler: () => callback('new') },
      { channel: 'menu:open', handler: () => callback('open') },
      { channel: 'menu:save', handler: () => callback('save') },
      { channel: 'menu:save-as', handler: () => callback('save-as') },
      { channel: 'menu:undo', handler: () => callback('undo') },
      { channel: 'menu:redo', handler: () => callback('redo') },
      { channel: 'menu:delete', handler: () => callback('delete') },
      { channel: 'menu:select-all', handler: () => callback('select-all') },
      { channel: 'menu:sim-run', handler: () => callback('sim-run') },
      { channel: 'menu:sim-pause', handler: () => callback('sim-pause') },
      { channel: 'menu:sim-step', handler: () => callback('sim-step') },
      { channel: 'menu:sim-reset', handler: () => callback('sim-reset') }
    ]

    for (const { channel, handler } of handlers) {
      ipcRenderer.on(channel, handler)
    }

    return () => {
      for (const { channel, handler } of handlers) {
        ipcRenderer.removeListener(channel, handler)
      }
    }
  }
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  console.warn('[preload] window.electron exposed successfully')
} catch (error) {
  console.error('[preload] Failed to expose window.electron:', error)
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
