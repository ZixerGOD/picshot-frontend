interface DataPoint {
  label: string
  value: number
}

interface SimpleBarChartProps {
  data: DataPoint[]
  colorClass?: string
  valuePrefix?: string
}

export function SimpleBarChart({
  data,
  colorClass = 'bg-primary-container',
  valuePrefix = '',
}: SimpleBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = `${(item.value / max) * 100}%`
        return (
          <div key={item.label} className="flex items-center gap-4">
            <div className="w-24 shrink-0 font-caption text-caption text-on-surface-variant uppercase">
              {item.label}
            </div>
            <div className="flex-1 h-8 bg-surface-container-low relative">
              <div
                className={`absolute top-0 left-0 h-full ${colorClass} transition-all duration-700`}
                style={{ width }}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 font-label-bold text-label-bold text-on-primary-container mix-blend-difference">
                {valuePrefix}
                {item.value.toLocaleString()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
