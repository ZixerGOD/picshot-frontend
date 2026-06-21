import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'

interface FooterProps {
  variant?: 'simple' | 'detailed'
}

export function Footer({ variant = 'simple' }: FooterProps) {
  const detailed = variant === 'detailed'
  const year = new Date().getFullYear()
  const copyright = `© ${year} Picshot Professional Sports Photography. All rights reserved.`

  return (
    <footer className="bg-surface-container-lowest border-t border-surface-variant w-full py-16">
      <div className="shots-container flex flex-col md:flex-row justify-between items-start gap-gutter">
        <div className="flex flex-col gap-4">
          <Logo className="h-7" />
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
            {detailed
              ? 'Capturando el rendimiento máximo. Plataforma líder en fotografía deportiva profesional.'
              : copyright}
          </p>
          {detailed && (
            <p className="font-caption text-caption text-tertiary-container mt-4">
              {copyright}
            </p>
          )}
        </div>

        {detailed ? (
          <nav className="flex flex-col md:flex-row gap-8 md:gap-16">
            <div className="flex flex-col gap-4">
              <span className="font-label-bold text-label-bold text-on-surface uppercase">
                Legal
              </span>
              <Link
                to="/privacidad"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Privacidad
              </Link>
              <Link
                to="/terminos"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Términos
              </Link>
              <Link
                to="/cookies"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Cookies
              </Link>
              <Link
                to="/politica-biometrica"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Política biométrica
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-bold text-label-bold text-on-surface uppercase">
                Empresa
              </span>
              <Link
                to="/contacto"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Contacto
              </Link>
              <Link
                to="/trabaja-con-nosotros"
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Trabaja con nosotros
              </Link>
              <p className="font-caption text-caption text-on-surface-variant">
                Picshot S.A.S. · RUC 1799999999001 · Quito, Ecuador
              </p>
            </div>
          </nav>
        ) : (
          <nav className="flex flex-wrap gap-6 sm:gap-12 mt-8 md:mt-0">
            <Link
              to="/privacidad"
              className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              Privacidad
            </Link>
            <Link
              to="/terminos"
              className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              Términos
            </Link>
            <Link
              to="/cookies"
              className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              Cookies
            </Link>
            <Link
              to="/politica-biometrica"
              className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              Política biométrica
            </Link>
          </nav>
        )}
      </div>
    </footer>
  )
}
