import { dialog, BrowserWindow, type IpcMain } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { extname } from 'path'
import { parseCdlFile, serializeToCdl } from '../file/cdl-parser'
import { parseMlcFile, serializeToMlc } from '../file/mlc-serializer'
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
        { name: 'MetaLogic Files', extensions: ['mlc'] },
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
      const ext = extname(filePath).toLowerCase()

      if (ext === '.cdl') {
        // CDL file — parse as CedarLogic
        const parseResult = await parseCdlFile(content)
        parseResult.warnings.push({
          type: 'import_info',
          message: 'Imported CedarLogic file. Save will use MetaLogic format.'
        })
        return { filePath, circuit: parseResult.circuit, warnings: parseResult.warnings }
      }

      // Default: try MLC (JSON) first, fall back to CDL
      try {
        const parseResult = parseMlcFile(content)
        return { filePath, circuit: parseResult.circuit, warnings: parseResult.warnings }
      } catch {
        // JSON parse failed — try CDL as fallback
        const parseResult = await parseCdlFile(content)
        parseResult.warnings.push({
          type: 'import_info',
          message: 'File parsed as CedarLogic format. Save will use MetaLogic format.'
        })
        return { filePath, circuit: parseResult.circuit, warnings: parseResult.warnings }
      }
    } catch (error) {
      dialog.showErrorBox('Error Opening File', `Failed to open ${filePath}: ${String(error)}`)
      return null
    }
  })

  ipcMain.handle('file:save', async (_, data: { filePath: string; circuit: CircuitData }) => {
    console.warn('[ipc] file:save invoked for', data.filePath)
    try {
      const ext = extname(data.filePath).toLowerCase()
      const content = ext === '.cdl' ? serializeToCdl(data.circuit) : serializeToMlc(data.circuit)
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
        { name: 'MetaLogic Files', extensions: ['mlc'] },
        { name: 'CedarLogic Files', extensions: ['cdl'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'circuit.mlc'
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    try {
      const ext = extname(result.filePath).toLowerCase()
      const content = ext === '.cdl' ? serializeToCdl(circuit) : serializeToMlc(circuit)
      await writeFile(result.filePath, content, 'utf-8')
      return { filePath: result.filePath, success: true }
    } catch (error) {
      dialog.showErrorBox('Error Saving File', `Failed to save: ${String(error)}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file:openMemory', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      title: 'Open Memory File',
      filters: [
        { name: 'CedarLogic Memory Files', extensions: ['cdm'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths.length) return null
    try {
      const content = await readFile(result.filePaths[0]!, 'utf-8')
      return { filePath: result.filePaths[0], content }
    } catch (error) {
      dialog.showErrorBox('Error Opening Memory File', `Failed to open: ${String(error)}`)
      return null
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
