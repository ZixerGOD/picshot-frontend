import { useTheme } from '../../hooks/useTheme'
import { Icon } from './Icon'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={`p-2 rounded-none border border-surface-variant text-on-surface hover:text-primary hover:border-primary transition-colors ${className}`}
    >
      <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-xl" />
    </button>
  )
}
