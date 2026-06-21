import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const STORAGE_KEY = 'picshot-cookies-consent'

type Choice = 'all' | 'essential'

interface Stored {
  choice: Choice
  decidedAt: string
}

export function getCookieChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    return parsed.choice ?? null
  } catch {
    return null
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookieChoice()) {
      // Pequeño delay para que el banner no compita con la pintura inicial.
      const t = window.setTimeout(() => setVisible(true), 300)
      return () => window.clearTimeout(t)
    }
  }, [])

  function decide(choice: Choice) {
    try {
      const payload: Stored = { choice, decidedAt: new Date().toISOString() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 p-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-surface-container-lowest border border-surface-variant shadow-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center">
        <Icon name="cookie" className="text-primary text-3xl shrink-0" />
        <div className="flex-1 font-body-md text-body-md text-on-surface">
          <p>
            Usamos cookies para mantener tu sesión y mejorar tu experiencia.{' '}
            <Link
              to="/cookies"
              className="text-primary hover:underline"
            >
              Conoce los detalles
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide('essential')}
            className="inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-4 py-2 hover:border-primary hover:text-primary transition-colors"
          >
            Solo las necesarias
          </button>
          <button
            type="button"
            onClick={() => decide('all')}
            className="shots-btn-primary px-4 py-2"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
