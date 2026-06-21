import { Icon } from '../ui/Icon'

interface StatsCardProps {
  label: string
  value: string
  icon: string
  trend?: string
  trendUp?: boolean
}

export function StatsCard({ label, value, icon, trend, trendUp }: StatsCardProps) {
  return (
    <div className="bg-surface border border-surface-variant p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="font-headline-md text-headline-md text-on-surface">{value}</p>
        </div>
        <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center text-primary">
          <Icon name={icon} className="text-xl" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 font-caption text-caption">
          <span className={trendUp ? 'text-green-400' : 'text-red-400'}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-on-surface-variant">vs mes anterior</span>
        </div>
      )}
    </div>
  )
}
