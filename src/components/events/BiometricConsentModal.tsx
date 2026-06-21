import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const STORAGE_KEY = 'picshot-biometric-consent'

interface ConsentRecord {
  acceptedAt: string
}

export function hasBiometricConsent(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

export function revokeBiometricConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

interface BiometricConsentModalProps {
  open: boolean
  onAccept: () => void
  onCancel: () => void
}

export function BiometricConsentModal({
  open,
  onAccept,
  onCancel,
}: BiometricConsentModalProps) {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!open) setAccepted(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  function handleConfirm() {
    if (!accepted) return
    const record: ConsentRecord = { acceptedAt: new Date().toISOString() }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch {
      // ignore
    }
    onAccept()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Icon name="face" className="text-primary text-3xl" />
          <div>
            <h2
              id="biometric-consent-title"
              className="font-headline-md text-headline-md text-on-surface uppercase"
            >
              Permítenos reconocerte
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Antes de buscar tus fotos por tu rostro, necesitamos tu permiso.
            </p>
          </div>
        </div>

        <ul className="font-body-md text-body-md text-on-surface space-y-2 list-disc pl-6">
          <li>Usaremos tu selfie solo para encontrar tus fotos del evento.</li>
          <li>No guardamos la imagen original que tomes.</li>
          <li>Puedes retirar tu permiso cuando quieras desde Mi cuenta.</li>
        </ul>

        <label className="flex items-start gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>
            He leído la{' '}
            <Link
              to="/politica-biometrica"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              política de reconocimiento facial
            </Link>{' '}
            y autorizo a Picshot a usar mi rostro para encontrar mis fotos.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest py-3 hover:border-primary hover:text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!accepted}
            className="flex-1 shots-btn-primary py-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="check" />
            Autorizar y continuar
          </button>
        </div>
      </div>
    </div>
  )
}
