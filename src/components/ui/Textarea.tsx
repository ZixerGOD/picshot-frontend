interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  wrapperClassName?: string
}

export function Textarea({ label, wrapperClassName = '', className = '', ...props }: TextareaProps) {
  return (
    <div className={wrapperClassName}>
      {label && <label className="shots-label">{label}</label>}
      <textarea className={`shots-textarea ${className}`} {...props} />
    </div>
  )
}
