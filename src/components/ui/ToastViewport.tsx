import { Icon } from './Icon'
import { useToast } from '../../hooks/useToast'
import type { ToastVariant } from '../../contexts/ToastContext'

const ICON_BY_VARIANT: Record<ToastVariant, string> = {
  info: 'info',
  success: 'check_circle',
  error: 'error',
}

const ACCENT_BY_VARIANT: Record<ToastVariant, string> = {
  info: 'border-primary text-primary',
  success: 'border-tertiary text-tertiary',
  error: 'border-error text-error',
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`bg-surface-container-lowest border shadow-2xl p-4 flex items-start gap-3 animate-fade-in ${ACCENT_BY_VARIANT[t.variant]}`}
        >
          <Icon name={ICON_BY_VARIANT[t.variant]} className="text-2xl shrink-0" />
          <p className="flex-1 font-body-md text-body-md text-on-surface whitespace-pre-line">
            {t.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar notificación"
            className="text-on-surface-variant hover:text-on-surface shrink-0"
          >
            <Icon name="close" />
          </button>
        </div>
      ))}
    </div>
  )
}
