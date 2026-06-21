import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { EventItem, Order, Purchase } from '../../lib/types'
import { getEvents, getMyPurchases } from '../../lib/api'
import { getOrder } from '../../lib/checkout'
import {
  daysUntil,
  generateSignedDownload,
  retentionDateFrom,
} from '../../lib/downloads'
import { Icon } from '../../components/ui/Icon'
import { Footer } from '../../components/layout/Footer'
import { formatPrice } from '../../lib/format'

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Pendiente', tone: 'text-on-surface-variant' },
  awaiting_payment: { label: 'Esperando pago', tone: 'text-on-surface-variant' },
  confirmed: { label: 'Pagada', tone: 'text-primary' },
  failed: { label: 'Fallida', tone: 'text-primary-container' },
  reversed: { label: 'Reversada', tone: 'text-primary-container' },
  refunded: { label: 'Reembolsada', tone: 'text-primary-container' },
}

export function PurchaseDetailPage() {
  const { orderId = '' } = useParams()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [event, setEvent] = useState<EventItem | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyPurchases(), getEvents()])
      .then(([allPurchases, events]) => {
        const mine = allPurchases.filter((p) => p.orderId === orderId)
        setPurchases(mine)
        const eventId = mine[0]?.eventId
        setEvent(eventId ? events.find((e) => e.id === eventId) ?? null : null)
        setOrder(getOrder(orderId) ?? null)
      })
      .finally(() => setLoading(false))
  }, [orderId])

  const total = useMemo(
    () => purchases.reduce((sum, p) => sum + p.price, 0),
    [purchases],
  )

  if (loading) {
    return (
      <main className="pt-32 pb-24 shots-container flex items-center justify-center text-on-surface-variant gap-3">
        <Icon name="autorenew" className="animate-spin" />
        Cargando orden…
      </main>
    )
  }

  if (purchases.length === 0 && !order) {
    return (
      <>
        <main className="pt-32 pb-24 shots-container flex flex-col items-center text-center gap-4">
          <Icon name="error" className="text-5xl text-primary-container" />
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase">
            No encontramos esta orden
          </h1>
          <Link to="/mis-compras" className="shots-btn-primary px-6 py-3">
            Volver a Mis Compras
          </Link>
        </main>
        <Footer variant="simple" />
      </>
    )
  }

  const statusKey = order?.status ?? 'confirmed'
  const status = STATUS_COPY[statusKey] ?? STATUS_COPY.confirmed

  return (
    <>
      <main className="pt-32 pb-24 shots-container max-w-4xl">
        <Link
          to="/mis-compras"
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-bold text-label-bold uppercase tracking-widest mb-8"
        >
          <Icon name="arrow_back" className="text-lg" />
          Volver
        </Link>

        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest mb-2">
              Orden
            </p>
            <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
              {orderId}
            </h1>
            {event && (
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                {event.title} · {event.displayDate} · {event.location}
              </p>
            )}
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-2 font-label-bold text-label-bold uppercase tracking-widest ${status.tone}`}
            >
              <Icon name="circle" fill className="text-xs" />
              {status.label}
            </span>
            <p className="font-headline-md text-headline-md text-primary mt-2">
              {formatPrice(total)}
            </p>
          </div>
        </header>

        {(order?.status === 'refunded' || order?.status === 'reversed') && (
          <div className="mb-8 flex items-start gap-3 border border-primary-container/60 bg-primary-container/15 p-4">
            <Icon name="undo" className="text-primary-container mt-0.5" />
            <p className="font-body-md text-body-md text-on-surface">
              Esta orden fue reembolsada. Las descargas de estas fotos quedan
              desactivadas. Si tienes dudas, escribe a soporte@picshotec.com.
            </p>
          </div>
        )}

        {order?.payphone && (
          <section className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6 mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
              Transacción Payphone
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body-md text-body-md">
              <div>
                <dt className="text-on-surface-variant">ID transacción</dt>
                <dd className="text-on-surface">{order.payphone.transactionId}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Código de respuesta</dt>
                <dd className="text-on-surface">{order.payphone.responseCode}</dd>
              </div>
              {order.payphone.authorizedAt && (
                <div>
                  <dt className="text-on-surface-variant">Autorizado</dt>
                  <dd className="text-on-surface">
                    {new Date(order.payphone.authorizedAt).toLocaleString('es-EC')}
                  </dd>
                </div>
              )}
              {order.payphone.confirmedAt && (
                <div>
                  <dt className="text-on-surface-variant">Confirmado</dt>
                  <dd className="text-on-surface">
                    {new Date(order.payphone.confirmedAt).toLocaleString('es-EC')}
                  </dd>
                </div>
              )}
              {order.payphone.message && (
                <div className="sm:col-span-2">
                  <dt className="text-on-surface-variant">Mensaje</dt>
                  <dd className="text-on-surface">{order.payphone.message}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Fotos en la orden
          </h2>
          <ul className="space-y-3">
            {purchases.map((p) => {
              const retentionDate = p.retentionUntil ?? retentionDateFrom(p.purchasedAt)
              const daysLeft = daysUntil(retentionDate)
              return (
                <li
                  key={p.id}
                  className="flex flex-col sm:flex-row gap-4 bg-surface-container-lowest border border-surface-variant p-4"
                >
                  <img
                    src={p.url}
                    alt={`Foto ${p.photoId}`}
                    className="w-full sm:w-32 h-32 object-cover border border-surface-variant"
                  />
                  <div className="flex-1 flex flex-col gap-1">
                    {p.bib && (
                      <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                        Dorsal {p.bib}
                      </span>
                    )}
                    {p.resolution && (
                      <span className="font-body-md text-body-md text-on-surface">
                        {p.resolution}
                      </span>
                    )}
                    <span className="font-headline-md text-headline-md text-primary">
                      {formatPrice(p.price)}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Disponible para descargar por {daysLeft} días más
                    </span>
                  </div>
                  <DownloadButton url={p.url} />
                </li>
              )
            })}
          </ul>
        </section>
      </main>

      <Footer variant="simple" />
    </>
  )
}

function DownloadButton({ url }: { url: string }) {
  const [signed, setSigned] = useState<{ url: string; expiresAt: string } | null>(
    null,
  )
  function handleClick() {
    setSigned(generateSignedDownload(url))
  }
  if (signed) {
    return (
      <a
        href={signed.url}
        download
        target="_blank"
        rel="noreferrer"
        className="shots-btn-primary px-4 py-2 justify-center sm:self-start"
      >
        <Icon name="download" />
        Iniciar descarga
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="shots-btn-primary px-4 py-2 justify-center sm:self-start"
    >
      <Icon name="key" />
      Generar enlace
    </button>
  )
}
