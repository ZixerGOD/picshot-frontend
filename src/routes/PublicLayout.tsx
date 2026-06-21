import type { ReactNode } from 'react'
import { Navbar } from '../components/layout/Navbar'

/**
 * Shell para páginas públicas: monta el Navbar arriba y deja el contenido
 * de la ruta debajo. Las rutas que viven dentro de paneles propios
 * (admin, fotógrafo) no usan este wrapper.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
