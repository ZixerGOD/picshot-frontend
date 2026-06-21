import { Icon } from './Icon'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: string
  wrapperClassName?: string
}

export function Input({ label, icon, wrapperClassName = '', className = '', ...props }: InputProps) {
  return (
    <div className={wrapperClassName}>
      {label && <label className="shots-label">{label}</label>}
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary-container pointer-events-none"
          />
        )}
        <input
          className={`shots-input ${icon ? 'pl-12' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}
