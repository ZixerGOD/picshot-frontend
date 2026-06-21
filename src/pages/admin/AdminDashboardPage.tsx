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

  const activePhotographers = photographers.filter((p) => p.isActive).slice(0, 5)

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
          value={`€${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
          trend="12%"
          trendUp
        />
        <StatsCard
          label="Ventas"
          value={stats.totalSales.toLocaleString()}
          icon="shopping_cart"
          trend="8%"
          trendUp
        />
        <StatsCard
          label="Visitas (30d)"
          value={stats.totalVisits.toLocaleString()}
          icon="visibility"
          trend="5%"
          trendUp
        />
        <StatsCard
          label="Eventos activos"
          value={stats.activeEvents.toString()}
          icon="event"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Ingresos últimos 7 días
          </h2>
          <SimpleBarChart data={last7Days} valuePrefix="€" />
        </section>

        <section className="bg-surface border border-surface-variant p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-surface-variant p-6">
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
                render: (e) => `€${e.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
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
