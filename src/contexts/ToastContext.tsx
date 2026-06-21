import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

export interface ToastApi {
  toasts: ToastItem[]
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void
  dismiss: (id: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const handle = timers.current.get(id)
    if (handle) {
      window.clearTimeout(handle)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      durationMs: number = DEFAULT_DURATION,
    ) => {
      const id = `t-${Math.random().toString(36).slice(2, 10)}`
      setToasts((prev) => [...prev, { id, message, variant }])
      const handle = window.setTimeout(() => {
        timers.current.delete(id)
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, durationMs)
      timers.current.set(id, handle)
    },
    [],
  )

  const value = useMemo<ToastApi>(
    () => ({ toasts, show, dismiss }),
    [toasts, show, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
