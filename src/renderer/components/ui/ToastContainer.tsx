import { useToastStore, type ToastType } from '../../stores/toastStore'

const TOAST_STYLES: Record<ToastType, string> = {
  info: 'bg-blue-900/40 border-blue-500/50 text-blue-200',
  success: 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200',
  warning: 'bg-amber-900/40 border-amber-500/50 text-amber-200',
  error: 'bg-red-900/40 border-red-500/50 text-red-200'
}

const TOAST_ICONS: Record<ToastType, string> = {
  info: 'i',
  success: '\u2713',
  warning: '!',
  error: '\u2715'
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-slide-in flex items-start gap-2 px-3 py-2 rounded-md border text-sm ${TOAST_STYLES[toast.type]}`}
        >
          <span className="font-bold shrink-0">{TOAST_ICONS[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 text-xs ml-2"
          >
            {'\u2715'}
          </button>
        </div>
      ))}
    </div>
  )
}
