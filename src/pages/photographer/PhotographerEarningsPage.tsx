import { useMemo, useState } from 'react'
import { usePhotographer } from '../../hooks/usePhotographer'
import { StatsCard } from '../../components/admin/StatsCard'
import { AdminTable } from '../../components/admin/AdminTable'
import { SimpleBarChart } from '../../components/admin/SimpleBarChart'
import { Icon } from '../../components/ui/Icon'
import type { Sale } from '../../lib/types'

const CHART_LIMIT = 5
const PAGE_SIZE = 10

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

export function PhotographerEarningsPage() {
  const { sales, events, totalEarnings, totalSales } = usePhotographer()

  // decisions.md:348-352 — mostramos gross/net de Payphone para que el
  // fotógrafo entienda qué se cobró antes de su comisión.
  const grossTotal = useMemo(
    () => sales.reduce((sum, s) => sum + s.finalAmount, 0),
    [sales],
  )
  const payphoneTotal = useMemo(
    () => sales.reduce((sum, s) => sum + (s.payphoneFee ?? 0), 0),
    [sales],
  )
  const netTotal = useMemo(
    () => sales.reduce((sum, s) => sum + (s.netAmount ?? s.finalAmount), 0),
    [sales],
  )

  const earningsByEvent = useMemo(() => {
    return events
      .map((e) => {
        const eventSales = sales.filter((s) => s.eventId === e.id)
        const earnings = eventSales.reduce(
          (sum, s) => sum + s.photographerEarnings,
          0,
        )
        return { label: truncate(e.title, 18), value: Math.round(earnings) }
      })
      .sort((a, b) => b.value - a.value)
  }, [events, sales])

  const [showAllChart, setShowAllChart] = useState(false)
  const chartData = showAllChart
    ? earningsByEvent
    : earningsByEvent.slice(0, CHART_LIMIT)

  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [sales],
  )

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageRows = sortedSales.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
          Ganancias
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Detalle de lo que has generado con tus fotos.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Bruto del evento"
          value={`$${grossTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
        />
        <StatsCard
          label="Comisión Payphone"
          value={`$${payphoneTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="credit_card"
        />
        <StatsCard
          label="Neto post-Payphone"
          value={`$${netTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="account_balance"
        />
        <StatsCard
          label="Tu ganancia"
          value={`$${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="savings"
        />
      </div>
      <p className="font-caption text-caption text-on-surface-variant -mt-4">
        Payphone retiene 5.75% sobre el bruto. Tu comisión se calcula sobre
        el neto. Ventas: {totalSales.toLocaleString()} · Promedio:{' '}
        ${(totalSales ? totalEarnings / totalSales : 0).toFixed(2)}
      </p>

      <section className="bg-surface border border-surface-variant p-6">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Ganancias por evento
          </h2>
          {earningsByEvent.length > CHART_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllChart((v) => !v)}
              className="font-label-bold text-label-bold text-primary hover:underline uppercase tracking-widest text-xs"
            >
              {showAllChart
                ? 'Ver solo los principales'
                : `Ver todos (${earningsByEvent.length})`}
            </button>
          )}
        </div>
        <SimpleBarChart data={chartData} valuePrefix="$" />
      </section>

      <section className="bg-surface border border-surface-variant p-6">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Historial de ventas
          </h2>
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
            {sortedSales.length}{' '}
            {sortedSales.length === 1 ? 'venta' : 'ventas'} en total
          </p>
        </div>

        <AdminTable<Sale>
          rows={pageRows}
          emptyMessage="No tienes ventas registradas"
          columns={[
            {
              key: 'event',
              header: 'Evento',
              render: (s) =>
                events.find((e) => e.id === s.eventId)?.title ?? s.eventId,
            },
            {
              key: 'amount',
              header: 'Bruto',
              render: (s) => `$${s.finalAmount.toFixed(2)}`,
            },
            {
              key: 'net',
              header: 'Neto',
              render: (s) =>
                `$${(s.netAmount ?? s.finalAmount).toFixed(2)}`,
            },
            {
              key: 'commission',
              header: 'Tu comisión',
              render: (s) => `$${s.photographerEarnings.toFixed(2)}`,
            },
            {
              key: 'date',
              header: 'Fecha',
              render: (s) =>
                new Date(s.createdAt).toLocaleDateString('es-EC'),
            },
          ]}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-surface-variant">
            <p className="font-caption text-caption text-on-surface-variant">
              Página {safePage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 border border-surface-variant text-on-surface-variant font-label-bold text-label-bold uppercase tracking-widest px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:text-on-surface hover:border-primary/40 transition-colors"
              >
                <Icon name="chevron_left" />
                Anterior
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 border border-surface-variant text-on-surface-variant font-label-bold text-label-bold uppercase tracking-widest px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:text-on-surface hover:border-primary/40 transition-colors"
              >
                Siguiente
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
