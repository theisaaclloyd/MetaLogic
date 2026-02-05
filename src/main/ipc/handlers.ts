import { dialog, BrowserWindow, type IpcMain } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { parseCdlFile, serializeToCdl } from '../file/cdl-parser'
import type { CircuitData } from '@shared/types/circuit'

export function setupFileHandlers(ipcMain: IpcMain): void {
  console.warn('[ipc] Setting up file handlers')

  ipcMain.handle('file:open', async () => {
    console.warn('[ipc] file:open invoked')
    const window = BrowserWindow.getFocusedWindow()
    if (!window) {
      console.warn('[ipc] file:open — no focused window')
      return null
    }

    const result = await dialog.showOpenDialog(window, {
      title: 'Open Circuit',
      filters: [
        { name: 'CedarLogic Files', extensions: ['cdl'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]!
    try {
      const content = await readFile(filePath, 'utf-8')
      const circuit = await parseCdlFile(content)
      return { filePath, circuit }
    } catch (error) {
      dialog.showErrorBox('Error Opening File', `Failed to open ${filePath}: ${String(error)}`)
      return null
    }
  })

  ipcMain.handle('file:save', async (_, data: { filePath: string; circuit: CircuitData }) => {
    console.warn('[ipc] file:save invoked for', data.filePath)
    try {
      const content = serializeToCdl(data.circuit)
      await writeFile(data.filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      dialog.showErrorBox('Error Saving File', `Failed to save: ${String(error)}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file:save-as', async (_, circuit: CircuitData) => {
    console.warn('[ipc] file:save-as invoked')
    const window = BrowserWindow.getFocusedWindow()
    if (!window) {
      console.warn('[ipc] file:save-as — no focused window')
      return null
    }

    const result = await dialog.showSaveDialog(window, {
      title: 'Save Circuit As',
      filters: [
        { name: 'CedarLogic Files', extensions: ['cdl'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'circuit.cdl'
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    try {
      const content = serializeToCdl(circuit)
      await writeFile(result.filePath, content, 'utf-8')
      return { filePath: result.filePath, success: true }
    } catch (error) {
      dialog.showErrorBox('Error Saving File', `Failed to save: ${String(error)}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file:read', async (_, filePath: string) => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return { content }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('file:write', async (_, data: { filePath: string; content: string }) => {
    try {
      await writeFile(data.filePath, data.content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
