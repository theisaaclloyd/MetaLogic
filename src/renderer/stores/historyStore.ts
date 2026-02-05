import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GateNode, WireEdge } from './circuitStore'

interface HistoryEntry {
  nodes: GateNode[]
  edges: WireEdge[]
  timestamp: number
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  maxHistory: number

  // Actions
  pushState: (nodes: GateNode[], edges: WireEdge[]) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  clear: () => void

  canUndo: () => boolean
  canRedo: () => boolean
}

export const useHistoryStore = create<HistoryState>()(
  subscribeWithSelector((set, get) => ({
    past: [],
    future: [],
    maxHistory: 100,

    pushState: (nodes, edges) => {
      const entry: HistoryEntry = {
        nodes: structuredClone(nodes),
        edges: structuredClone(edges),
        timestamp: Date.now()
      }

      set((state) => {
        const newPast = [...state.past, entry]
        // Limit history size
        if (newPast.length > state.maxHistory) {
          newPast.shift()
        }
        return {
          past: newPast,
          future: [] // Clear future on new action
        }
      })
    },

    undo: () => {
      const { past, future } = get()
      if (past.length === 0) return null

      const newPast = [...past]
      const entry = newPast.pop()!

      set({
        past: newPast,
        future: [entry, ...future]
      })

      // Return the state to restore (the one before this entry)
      return newPast[newPast.length - 1] ?? null
    },

    redo: () => {
      const { past, future } = get()
      if (future.length === 0) return null

      const newFuture = [...future]
      const entry = newFuture.shift()!

      set({
        past: [...past, entry],
        future: newFuture
      })

      return entry
    },

    clear: () => {
      set({ past: [], future: [] })
    },

    canUndo: () => get().past.length > 1,
    canRedo: () => get().future.length > 0
  }))
)
