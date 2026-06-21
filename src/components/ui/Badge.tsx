interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Badge({ children, variant = 'secondary' }: BadgeProps) {
  const styles =
    variant === 'primary' ? 'shots-badge-primary' : 'shots-badge-secondary'
  return <span className={styles}>{children}</span>
}
