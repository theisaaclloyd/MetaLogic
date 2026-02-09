import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

let toastIdCounter = 0

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = `toast_${++toastIdCounter}`
    const toast: Toast = { id, type, message }

    set((state) => ({ toasts: [...state.toasts, toast] }))

    setTimeout(() => {
      const { toasts } = get()
      if (toasts.some((t) => t.id === id)) {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }
    }, 5000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  }
}))
