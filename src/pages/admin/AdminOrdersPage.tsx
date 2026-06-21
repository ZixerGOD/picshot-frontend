import { useMemo, useState } from 'react'
import type { Order, OrderStatus } from '../../lib/types'
import { listOrders, refundOrder } from '../../lib/checkout'
import { Select } from '../../components/ui/Select'
import { Icon } from '../../components/ui/Icon'
import { formatPrice } from '../../lib/format'
import { useToast } from '../../hooks/useToast'

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'awaiting_payment', label: 'Esperando pago' },
  { value: 'expired', label: 'Expirada' },
  { value: 'confirmed', label: 'Pagada' },
  { value: 'failed', label: 'Fallida' },
  { value: 'reversed', label: 'Reversada' },
  { value: 'refunded', label: 'Reembolsada' },
  { value: 'pending', label: 'Pendiente' },
]

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-surface-container text-on-surface-variant',
  awaiting_payment: 'bg-surface-container text-on-surface-variant',
  expired: 'bg-primary-container/20 text-primary-container',
  confirmed: 'bg-primary-container/30 text-primary',
  failed: 'bg-primary-container/20 text-primary-container',
  reversed: 'bg-primary-container/20 text-primary-container',
  refunded: 'bg-primary-container/20 text-primary-container',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  awaiting_payment: 'Esperando pago',
  expired: 'Expirada',
  confirmed: 'Pagada',
  failed: 'Fallida',
  reversed: 'Reversada',
  refunded: 'Reembolsada',
}

function toCSV(orders: Order[]): string {
  const header = [
    'orden',
    'estado',
    'comprador',
    'subtotal',
    'descuento',
    'total',
    'cupon',
    'pp_transaction',
    'pp_codigo',
    'creada',
    'autorizada',
    'confirmada',
  ].join(',')
  const rows = orders.map((o) =>
    [
      o.id,
      o.status,
      o.buyerEmail,
      o.totals.subtotal,
      o.totals.discount,
      o.totals.total,
      o.couponCode ?? '',
      o.payphone?.transactionId ?? '',
      o.payphone?.responseCode ?? '',
      o.createdAt,
      o.payphone?.authorizedAt ?? '',
      o.payphone?.confirmedAt ?? '',
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function AdminOrdersPage() {
  const toast = useToast()
  const [orders, setOrders] = useState<Order[]>(() => listOrders())
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (statusFilter ? o.status === statusFilter : true))
      .filter((o) => {
        if (!search) return true
        const needle = search.toLowerCase()
        return (
          o.id.toLowerCase().includes(needle) ||
          o.buyerEmail.toLowerCase().includes(needle) ||
          (o.payphone?.transactionId ?? '').toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, statusFilter, search])

  function handleRefund(orderId: string) {
    if (!window.confirm('¿Reembolsar esta orden?')) return
    const refunded = refundOrder(orderId)
    setOrders(listOrders())
    if (refunded?.buyerEmail) {
      toast.show(
        `Reembolso aplicado. Notificamos al comprador a ${refunded.buyerEmail}.`,
        'success',
      )
    }
  }

  function handleExport() {
    downloadFile(`ordenes-${Date.now()}.csv`, toCSV(filtered), 'text/csv')
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
            Órdenes
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Cada orden incluye la transacción Payphone, código de respuesta y
            ventana de confirmación.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="shots-btn-primary px-4 py-2"
        >
          <Icon name="download" />
          Exportar CSV
        </button>
      </header>

      <section className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar por ID, email o transacción"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="shots-input flex-1"
        />
        <Select
          icon="filter_alt"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | OrderStatus)}
          wrapperClassName="md:max-w-[240px]"
        />
      </section>

      <section className="bg-surface border border-surface-variant overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container">
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Orden
              </th>
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Comprador
              </th>
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Estado
              </th>
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Payphone
              </th>
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Total
              </th>
              <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                Fecha
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="border-t border-surface-variant hover:bg-surface-container-lowest"
              >
                <td className="px-4 py-3 font-label-bold text-label-bold text-on-surface">
                  {o.id}
                </td>
                <td className="px-4 py-3 text-on-surface">{o.buyerEmail}</td>
                <td className="px-4 py-3">
                  <span
                    className={`shots-badge ${STATUS_TONE[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-on-surface-variant text-xs">
                  {o.payphone?.transactionId ?? '—'}
                  {o.payphone && (
                    <span className="ml-2 text-on-surface">
                      ({o.payphone.responseCode})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-on-surface">
                  {formatPrice(o.totals.total)}
                </td>
                <td className="px-4 py-3 text-on-surface-variant text-xs">
                  {new Date(o.createdAt).toLocaleString('es-EC')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail(o)}
                      className="text-on-surface-variant hover:text-primary"
                      aria-label="Ver detalle"
                    >
                      <Icon name="visibility" />
                    </button>
                    {o.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleRefund(o.id)}
                        className="text-on-surface-variant hover:text-primary-container"
                        aria-label="Reembolsar"
                      >
                        <Icon name="undo" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-on-surface-variant"
                >
                  No hay órdenes con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest border border-surface-variant max-w-lg w-full p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Orden {order.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-on-surface-variant hover:text-primary"
          >
            <Icon name="close" />
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body-md text-body-md text-on-surface">
          <div>
            <dt className="text-on-surface-variant">Estado</dt>
            <dd>{STATUS_LABEL[order.status]}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Comprador</dt>
            <dd>{order.buyerEmail}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Total</dt>
            <dd className="text-primary">{formatPrice(order.totals.total)}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Cupón</dt>
            <dd>{order.couponCode ?? '—'}</dd>
          </div>
          {order.payphone && (
            <>
              <div>
                <dt className="text-on-surface-variant">Transacción Payphone</dt>
                <dd>{order.payphone.transactionId}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Código respuesta</dt>
                <dd>{order.payphone.responseCode}</dd>
              </div>
              {order.payphone.authorizedAt && (
                <div>
                  <dt className="text-on-surface-variant">Autorizada</dt>
                  <dd>
                    {new Date(order.payphone.authorizedAt).toLocaleString('es-EC')}
                  </dd>
                </div>
              )}
              {order.payphone.confirmedAt && (
                <div>
                  <dt className="text-on-surface-variant">Confirmada</dt>
                  <dd>
                    {new Date(order.payphone.confirmedAt).toLocaleString('es-EC')}
                  </dd>
                </div>
              )}
              {order.payphone.message && (
                <div className="sm:col-span-2">
                  <dt className="text-on-surface-variant">Mensaje</dt>
                  <dd>{order.payphone.message}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
