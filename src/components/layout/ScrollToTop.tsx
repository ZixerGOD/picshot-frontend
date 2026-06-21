import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Repone el scroll al inicio cuando cambia la ruta. Si la URL incluye un
 * fragmento (`#seccion`), respeta el comportamiento por defecto del browser.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}
