import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../../components/layout/Footer'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

const sections = [
  { to: '/terminos', label: 'Términos y condiciones' },
  { to: '/privacidad', label: 'Política de privacidad' },
  { to: '/cookies', label: 'Política de cookies' },
  { to: '/politica-biometrica', label: 'Política biométrica' },
]

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <>
      <main className="pt-32 pb-24 shots-container max-w-5xl">
        <header className="mb-12">
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
            PicShot · Documentos legales
          </p>
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase mt-2">
            {title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Última actualización: {lastUpdated}.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-gutter">
          <nav className="flex flex-col gap-2 h-fit sticky top-28">
            {sections.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary uppercase tracking-widest text-sm"
              >
                {s.label}
              </Link>
            ))}
          </nav>

          <article className="prose-like flex flex-col gap-4 font-body-md text-body-md text-on-surface">
            {children}
          </article>
        </div>
      </main>
      <Footer variant="detailed" />
    </>
  )
}
