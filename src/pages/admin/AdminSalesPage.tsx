import { useMemo, useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Select } from '../../components/ui/Select'
import { StatsCard } from '../../components/admin/StatsCard'
import type { Sale } from '../../lib/types'

export function AdminSalesPage() {
  const { sales, events, photographers } = useAdmin()
  const [eventFilter, setEventFilter] = useState('')
  const [photographerFilter, setPhotographerFilter] = useState('')

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchesEvent = !eventFilter || s.eventId === eventFilter
      const matchesPhotographer = !photographerFilter || s.photographerId === photographerFilter
      return matchesEvent && matchesPhotographer
    })
  }, [sales, eventFilter, photographerFilter])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.finalAmount, 0)
  const totalPayphone = filtered.reduce(
    (sum, s) => sum + (s.payphoneFee ?? 0),
    0,
  )
  const totalNet = filtered.reduce(
    (sum, s) => sum + (s.netAmount ?? s.finalAmount),
    0,
  )
  const totalPhotographerEarnings = filtered.reduce((sum, s) => sum + s.photographerEarnings, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Ventas</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Detalle de todas las ventas de fotos.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Bruto"
          value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
        />
        <StatsCard
          label="Comisión Payphone"
          value={`$${totalPayphone.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="credit_card"
        />
        <StatsCard
          label="Neto post-Payphone"
          value={`$${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="account_balance"
        />
        <StatsCard
          label="Para fotógrafos"
          value={`$${totalPhotographerEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="people"
        />
      </div>
      <p className="font-caption text-caption text-on-surface-variant">
        Payphone retiene 5.75% de cada cobro. El neto se reparte entre el
        fotógrafo (según su % de comisión) y Picshot.
      </p>

      <div className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
        <Select
          icon="event"
          options={[
            { value: '', label: 'Todos los eventos' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ]}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Select
          icon="people"
          options={[
            { value: '', label: 'Todos los fotógrafos' },
            ...photographers.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={photographerFilter}
          onChange={(e) => setPhotographerFilter(e.target.value)}
          wrapperClassName="flex-1"
        />
      </div>

      <AdminTable<Sale>
        rows={filtered}
        emptyMessage="No hay ventas con esos filtros"
        columns={[
          { key: 'id', header: 'Venta', render: (s) => s.id },
          {
            key: 'event',
            header: 'Evento',
            render: (s) => events.find((e) => e.id === s.eventId)?.title ?? s.eventId,
          },
          {
            key: 'photographer',
            header: 'Fotógrafo',
            render: (s) => photographers.find((p) => p.id === s.photographerId)?.name ?? s.photographerId,
          },
          { key: 'buyer', header: 'Comprador', render: (s) => s.buyerEmail },
          {
            key: 'amount',
            header: 'Bruto',
            render: (s) => `$${s.finalAmount.toFixed(2)}`,
          },
          {
            key: 'payphone',
            header: 'Payphone',
            render: (s) =>
              s.payphoneFee != null ? `−$${s.payphoneFee.toFixed(2)}` : '—',
          },
          {
            key: 'net',
            header: 'Neto',
            render: (s) =>
              `$${(s.netAmount ?? s.finalAmount).toFixed(2)}`,
          },
          {
            key: 'commission',
            header: 'Fotógrafo',
            render: (s) => `$${s.photographerEarnings.toFixed(2)}`,
          },
          {
            key: 'date',
            header: 'Fecha',
            render: (s) =>
              new Date(s.createdAt).toLocaleDateString('es-EC', {
                timeZone: 'America/Guayaquil',
              }),
          },
        ]}
      />
    </div>
  )
}
