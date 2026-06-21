import { useTheme } from '../../hooks/useTheme'

interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  const { theme } = useTheme()
  const src =
    theme === 'dark'
      ? '/logos/picshot-logo-fondo-oscuro-transparente.png'
      : '/logos/picshot-logo-principal-transparente.png'

  return <img src={src} alt="Picshot" className={`object-contain h-8 w-auto ${className}`} />
}
