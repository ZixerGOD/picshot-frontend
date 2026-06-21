import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

/**
 * Disclaimer obligatorio al entrar a un evento por primera vez con sesión
 * iniciada. Es DISTINTO al consentimiento puntual de cámara/selfie: cubre
 * los términos del uso de IA y reconocimiento facial dentro del evento.
 * Los helpers de storage viven en `event-ai-consent-storage.ts`.
 */

interface EventAIDisclaimerModalProps {
  open: boolean
  eventTitle: string
  onAccept: () => void
  onDecline: () => void
}

export function EventAIDisclaimerModal({
  open,
  eventTitle,
  onAccept,
  onDecline,
}: EventAIDisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    // Reset al cerrar el modal.
    if (!open) setAccepted(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-disclaimer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Icon name="info" className="text-primary text-3xl" />
          <div>
            <h2
              id="ai-disclaimer-title"
              className="font-headline-md text-headline-md text-on-surface uppercase"
            >
              Antes de entrar al evento
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {eventTitle}
            </p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface">
          Para encontrar tus fotos usamos inteligencia artificial y
          reconocimiento facial. Antes de continuar, queremos asegurarnos de
          que estás de acuerdo.
        </p>

        <ul className="font-body-md text-body-md text-on-surface space-y-2 list-disc pl-6">
          <li>
            La galería es pública: cualquier usuario registrado puede ver y
            comprar fotos del evento, incluso si apareces en ellas.
          </li>
          <li>
            Cuando uses la búsqueda por rostro, te pediremos un permiso aparte
            para procesar tu selfie.
          </li>
          <li>
            Puedes revisar las condiciones completas en{' '}
            <Link
              to="/politica-biometrica"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Reconocimiento facial
            </Link>
            .
          </li>
        </ul>

        <label className="flex items-start gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>Entiendo y acepto las condiciones del evento.</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest py-3 hover:border-primary hover:text-primary transition-colors"
          >
            Volver al catálogo
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!accepted}
            className="flex-1 shots-btn-primary py-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="check" />
            Entrar al evento
          </button>
        </div>
      </div>
    </div>
  )
}
