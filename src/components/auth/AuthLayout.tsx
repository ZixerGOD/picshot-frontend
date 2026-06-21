import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="shots-container py-6 flex justify-between items-center">
        <Link to="/" aria-label="Volver al inicio">
          <Logo className="h-7" />
        </Link>
        <ThemeToggle />
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {footer && (
            <div className="pt-4 border-t border-surface-variant text-center font-body-md text-body-md text-on-surface-variant">
              {footer}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
