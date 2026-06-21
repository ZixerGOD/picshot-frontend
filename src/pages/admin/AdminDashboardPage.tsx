import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import { StatsCard } from '../../components/admin/StatsCard'
import { SimpleBarChart } from '../../components/admin/SimpleBarChart'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'

export function AdminDashboardPage() {
  const { stats, analytics, events, coupons, photographers, sales } = useAdmin()

  const last7Days = analytics.slice(-7).map((d) => ({
    label: d.date.slice(5),
    value: Math.round(d.revenue),
  }))

  const topEvents = [...events]
    .map((e) => {
      const eventSales = sales.filter((s) => s.eventId === e.id)
      const revenue = eventSales.reduce((sum, s) => sum + s.finalAmount, 0)
      return { ...e, revenue, salesCount: eventSales.length }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const closingCoupons = coupons
    .filter((c) => c.isActive && c.usedCount >= c.maxUses * 0.8)
    .slice(0, 5)

  function percentDelta(curr: number, prev: number): string | undefined {
    if (prev === 0) return curr > 0 ? '+100%' : undefined
    const pct = ((curr - prev) / prev) * 100
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct.toFixed(0)}%`
  }

  const last14 = analytics.slice(-14)
  const recentWeek = last14.slice(-7)
  const previousWeek = last14.slice(0, 7)
  const sumRevenue = (arr: typeof analytics) =>
    arr.reduce((sum, d) => sum + d.revenue, 0)
  const sumSales = (arr: typeof analytics) =>
    arr.reduce((sum, d) => sum + d.sales, 0)
  const sumVisits = (arr: typeof analytics) =>
    arr.reduce((sum, d) => sum + d.visits, 0)

  const revenueTrend = percentDelta(sumRevenue(recentWeek), sumRevenue(previousWeek))
  const salesTrend = percentDelta(sumSales(recentWeek), sumSales(previousWeek))
  const visitsTrend = percentDelta(sumVisits(recentWeek), sumVisits(previousWeek))

  const activePhotographers = photographers.filter((p) => p.isActive).slice(0, 5)

  // Calculamos "ahora" una sola vez al montar; suficiente para el dashboard.
  const [now] = useState(() => Date.now())
  const retentionWatch = useMemo(
    () =>
      events
        .filter((e) => e.retentionUntil)
        .map((e) => ({
          ...e,
          retentionDays: Math.ceil(
            (new Date(e.retentionUntil as string).getTime() - now) /
              (1000 * 60 * 60 * 24),
          ),
        }))
        .filter((e) => e.retentionDays <= 60)
        .sort((a, b) => a.retentionDays - b.retentionDays)
        .slice(0, 5),
    [events, now],
  )

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
            Dashboard
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Visión general del negocio Picshot.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/eventos/nuevo">
            <Button>
              <Icon name="add" />
              Nuevo evento
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Ingresos totales"
          value={`$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
          trend={revenueTrend}
          trendUp={revenueTrend?.startsWith('+')}
        />
        <StatsCard
          label="Ventas"
          value={stats.totalSales.toLocaleString()}
          icon="shopping_cart"
          trend={salesTrend}
          trendUp={salesTrend?.startsWith('+')}
        />
        <StatsCard
          label="Visitas (30d)"
          value={stats.totalVisits.toLocaleString()}
          icon="visibility"
          trend={visitsTrend}
          trendUp={visitsTrend?.startsWith('+')}
        />
        <StatsCard
          label="Eventos activos"
          value={stats.activeEvents.toString()}
          icon="event"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface border border-surface-variant p-6 h-fit">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Ingresos últimos 7 días
          </h2>
          <SimpleBarChart data={last7Days} valuePrefix="$" />
        </section>

        <section className="bg-surface border border-surface-variant p-6 h-fit">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Retención próxima a vencer
          </h2>
          {retentionWatch.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ningún evento próximo a expirar.
            </p>
          ) : (
            <ul className="space-y-3">
              {retentionWatch.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low"
                >
                  <div>
                    <Link
                      to={`/admin/eventos/${e.id}`}
                      className="font-label-bold text-label-bold text-on-surface hover:text-primary"
                    >
                      {e.title}
                    </Link>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {e.location} · borra el {e.retentionUntil}
                    </p>
                  </div>
                  <span
                    className={`font-caption text-caption uppercase ${
                      e.retentionDays <= 0
                        ? 'text-primary-container'
                        : e.retentionDays <= 14
                          ? 'text-primary-container'
                          : 'text-primary'
                    }`}
                  >
                    {e.retentionDays <= 0 ? 'Vencido' : `${e.retentionDays}d`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface border border-surface-variant p-6 h-fit">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Cupones por cerrarse
          </h2>
          {closingCoupons.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ningún cupón cerca del límite.
            </p>
          ) : (
            <ul className="space-y-3">
              {closingCoupons.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low"
                >
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">{c.code}</p>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {c.usedCount}/{c.maxUses} usos
                    </p>
                  </div>
                  <span className="font-caption text-caption text-primary uppercase">
                    {Math.round((c.usedCount / c.maxUses) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/cupones"
            className="inline-flex items-center gap-2 mt-4 font-label-bold text-label-bold text-primary hover:text-on-background transition-colors"
          >
            Ver todos
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Eventos con más ventas
          </h2>
          <AdminTable
            rows={topEvents}
            emptyMessage="No hay eventos registrados"
            columns={[
              {
                key: 'title',
                header: 'Evento',
                render: (e) => (
                  <Link to={`/admin/eventos/${e.id}`} className="text-primary hover:underline">
                    {e.title}
                  </Link>
                ),
              },
              { key: 'sales', header: 'Ventas', render: (e) => e.salesCount.toLocaleString() },
              {
                key: 'revenue',
                header: 'Ingresos',
                render: (e) => `$${e.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              },
            ]}
          />
        </section>

        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Fotógrafos activos
          </h2>
          <AdminTable
            rows={activePhotographers}
            emptyMessage="No hay fotógrafos activos"
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                render: (p) => (
                  <Link to={`/admin/fotografos`} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                ),
              },
              { key: 'city', header: 'Ciudad', render: (p) => p.city },
              {
                key: 'events',
                header: 'Eventos',
                render: (p) => (p.eventIds?.length ?? 0).toString(),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
