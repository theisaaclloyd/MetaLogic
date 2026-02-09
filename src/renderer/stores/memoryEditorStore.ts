import { create } from 'zustand'

interface MemoryEditorState {
  editingGateId: string | null
  openEditor: (gateId: string) => void
  closeEditor: () => void
}

export const useMemoryEditorStore = create<MemoryEditorState>()((set) => ({
  editingGateId: null,
  openEditor: (gateId) => set({ editingGateId: gateId }),
  closeEditor: () => set({ editingGateId: null })
}))
