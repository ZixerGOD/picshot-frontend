import { useMemo } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { StatsCard } from '../../components/admin/StatsCard'
import { SimpleBarChart } from '../../components/admin/SimpleBarChart'

export function AdminMetricsPage() {
  const { analytics, events, sales } = useAdmin()

  const visitData = useMemo(
    () => analytics.slice(-14).map((d) => ({ label: d.date.slice(5), value: d.visits })),
    [analytics],
  )

  const salesData = useMemo(
    () => analytics.slice(-14).map((d) => ({ label: d.date.slice(5), value: d.sales })),
    [analytics],
  )

  const topEvents = useMemo(() => {
    const map = new Map<string, number>()
    sales.forEach((s) => {
      map.set(s.eventId, (map.get(s.eventId) || 0) + 1)
    })
    return [...map.entries()]
      .map(([eventId, count]) => ({
        label: events.find((e) => e.id === eventId)?.title.slice(0, 20) ?? eventId,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [sales, events])

  const totalVisits = useMemo(
    () => analytics.reduce((sum, d) => sum + d.visits, 0),
    [analytics],
  )
  const totalSales = useMemo(
    () => analytics.reduce((sum, d) => sum + d.sales, 0),
    [analytics],
  )

  const conversion = totalVisits > 0 ? (totalSales / totalVisits) * 100 : 0

  function trendBetween(arr: typeof analytics, key: keyof typeof analytics[0]) {
    const last14 = arr.slice(-14)
    const recent = last14.slice(-7).reduce((s, d) => s + (d[key] as number), 0)
    const prev = last14.slice(0, 7).reduce((s, d) => s + (d[key] as number), 0)
    if (prev === 0) return recent > 0 ? '+100%' : undefined
    const pct = ((recent - prev) / prev) * 100
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct.toFixed(0)}%`
  }

  const visitsTrend = trendBetween(analytics, 'visits')
  const conversionTrend = trendBetween(analytics, 'sales')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Métricas</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Datos de tráfico y conversión. Pendiente: integrar Google Analytics o
          una solución equivalente para tráfico real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Visitas totales"
          value={totalVisits.toLocaleString()}
          icon="visibility"
          trend={visitsTrend}
          trendUp={visitsTrend?.startsWith('+')}
        />
        <StatsCard
          label="Páginas vistas"
          value={analytics.reduce((sum, d) => sum + d.pageViews, 0).toLocaleString()}
          icon="article"
        />
        <StatsCard
          label="Visitantes únicos"
          value={analytics.reduce((sum, d) => sum + d.uniqueVisitors, 0).toLocaleString()}
          icon="group"
        />
        <StatsCard
          label="Tasa de conversión"
          value={`${conversion.toFixed(1)}%`}
          icon="trending_up"
          trend={conversionTrend}
          trendUp={conversionTrend?.startsWith('+')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Visitas últimos 14 días
          </h2>
          <SimpleBarChart data={visitData} colorClass="bg-primary-container" />
        </section>

        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Ventas últimos 14 días
          </h2>
          <SimpleBarChart data={salesData} colorClass="bg-green-600" />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Eventos más vendidos
          </h2>
          <SimpleBarChart data={topEvents} colorClass="bg-tertiary-container" />
        </section>

        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Fuentes de tráfico
          </h2>
          <div className="flex flex-col items-center text-center gap-3 py-10">
            <span className="shots-badge bg-primary-container/30 text-primary">
              Pendiente de integración
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Disponible cuando conectemos Google Analytics. Hasta entonces
              evitamos mostrar datos inventados.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
