import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { Footer } from '../../components/layout/Footer'

interface LegalLayoutProps {
  title: string
  eyebrow?: string
  lastUpdated: string
  children: ReactNode
}

const sections = [
  { to: '/terminos', label: 'Términos', icon: 'gavel' },
  { to: '/privacidad', label: 'Privacidad', icon: 'shield' },
  { to: '/cookies', label: 'Cookies', icon: 'cookie' },
  {
    to: '/politica-biometrica',
    label: 'Reconocimiento facial',
    icon: 'face',
  },
]

export function LegalLayout({
  title,
  eyebrow = 'Documentos legales',
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-surface-container-low border-b border-surface-container-highest pt-32 pb-12">
        <div className="shots-container">
          <div className="flex items-center gap-2 text-primary font-label-bold text-label-bold mb-4 uppercase tracking-widest">
            <Icon name="description" fill />
            <span>{eyebrow}</span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
            {title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            Actualizado el {lastUpdated}.
          </p>
        </div>
      </header>

      <main className="py-16 shots-container">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-gutter">
          <nav className="h-fit lg:sticky lg:top-28 flex flex-col gap-1">
            {sections.map((s) => {
              const active = pathname === s.to
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`flex items-center gap-3 px-4 py-3 border transition-colors ${
                    active
                      ? 'border-primary bg-primary-container/15 text-primary'
                      : 'border-surface-variant text-on-surface-variant hover:text-on-surface hover:border-primary/40'
                  }`}
                >
                  <Icon name={s.icon} fill={active} />
                  <span className="font-label-bold text-label-bold uppercase tracking-widest text-xs">
                    {s.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <article className="bg-surface-container-lowest border border-surface-variant p-6 md:p-10 space-y-6 font-body-md text-body-md text-on-surface leading-relaxed">
            {children}
          </article>
        </div>
      </main>

      <Footer variant="detailed" />
    </>
  )
}
