import { Icon } from './Icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  isLoading?: boolean
}

const variants = {
  primary: 'shots-btn-primary',
  secondary: 'shots-btn-secondary',
  outline: 'shots-btn-outline',
}

export function Button({
  variant = 'primary',
  className = '',
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading && <Icon name="autorenew" className="animate-spin" />}
      {children}
    </button>
  )
}
