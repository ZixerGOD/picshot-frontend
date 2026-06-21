import { usePhotographer } from '../../hooks/usePhotographer'
import { StatsCard } from '../../components/admin/StatsCard'
import { AdminTable } from '../../components/admin/AdminTable'
import { SimpleBarChart } from '../../components/admin/SimpleBarChart'
import type { Sale } from '../../lib/types'

export function PhotographerEarningsPage() {
  const { sales, events, totalEarnings, totalSales } = usePhotographer()

  const earningsByEvent = events.map((e) => {
    const eventSales = sales.filter((s) => s.eventId === e.id)
    const earnings = eventSales.reduce((sum, s) => sum + s.photographerEarnings, 0)
    return { label: e.title.slice(0, 18), value: Math.round(earnings) }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Ganancias</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Detalle de lo que has generado con tus fotos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Ganancias totales"
          value={`€${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
        />
        <StatsCard label="Ventas" value={totalSales.toLocaleString()} icon="shopping_cart" />
        <StatsCard
          label="Ganancia promedio"
          value={`€${totalSales ? (totalEarnings / totalSales).toFixed(2) : '0.00'}`}
          icon="trending_up"
        />
      </div>

      <section className="bg-surface border border-surface-variant p-6">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
          Ganancias por evento
        </h2>
        <SimpleBarChart data={earningsByEvent} valuePrefix="€" />
      </section>

      <section className="bg-surface border border-surface-variant p-6">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
          Historial de ventas
        </h2>
        <AdminTable<Sale>
          rows={sales}
          emptyMessage="No tienes ventas registradas"
          columns={[
            {
              key: 'event',
              header: 'Evento',
              render: (s) => events.find((e) => e.id === s.eventId)?.title ?? s.eventId,
            },
            {
              key: 'amount',
              header: 'Venta',
              render: (s) => `€${s.finalAmount.toFixed(2)}`,
            },
            {
              key: 'commission',
              header: 'Tu comisión',
              render: (s) => `€${s.photographerEarnings.toFixed(2)}`,
            },
            {
              key: 'date',
              header: 'Fecha',
              render: (s) => new Date(s.createdAt).toLocaleDateString(),
            },
          ]}
        />
      </section>
    </div>
  )
}
