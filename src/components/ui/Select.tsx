import { Icon } from './Icon'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  icon?: string
  options: { value: string; label: string }[]
  wrapperClassName?: string
}

export function Select({
  label,
  icon,
  options,
  wrapperClassName = '',
  className = '',
  ...props
}: SelectProps) {
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
        <select className={`shots-select ${icon ? 'pl-12' : ''} ${className}`} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon
          name="arrow_drop_down"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary-container pointer-events-none"
        />
      </div>
    </div>
  )
}
