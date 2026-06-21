import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { EventItem, Purchase } from '../../lib/types'
import { getEvents, getMyPurchases } from '../../lib/api'
import {
  daysUntil,
  generateSignedDownload,
  retentionDateFrom,
} from '../../lib/downloads'
import { Icon } from '../../components/ui/Icon'
import { Footer } from '../../components/layout/Footer'
import { formatPrice } from '../../lib/format'
import { getOrder } from '../../lib/checkout'

interface EventGroup {
  eventId: string
  event: EventItem | null
  purchases: Purchase[]
  total: number
}

const PREVIEW_LIMIT = 6

export function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyPurchases(), getEvents()])
      .then(([myPurchases, allEvents]) => {
        setPurchases(myPurchases)
        setEvents(allEvents)
      })
      .finally(() => setLoading(false))
  }, [])

  const groups = useMemo<EventGroup[]>(() => {
    const byEvent = new Map<string, Purchase[]>()
    for (const purchase of purchases) {
      const list = byEvent.get(purchase.eventId) ?? []
      list.push(purchase)
      byEvent.set(purchase.eventId, list)
    }
    return Array.from(byEvent.entries())
      .map(([eventId, items]) => ({
        eventId,
        event: events.find((e) => e.id === eventId) ?? null,
        purchases: items,
        total: items.reduce((sum, p) => sum + p.price, 0),
      }))
      .sort((a, b) => {
        const da = a.purchases[0]?.purchasedAt ?? ''
        const db = b.purchases[0]?.purchasedAt ?? ''
        return db.localeCompare(da)
      })
  }, [purchases, events])

  const totalPhotos = purchases.length
  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0)

  return (
    <>
      <header className="bg-surface-container-low border-b border-surface-container-highest pt-32 pb-12">
        <div className="shots-container">
          <div className="flex items-center gap-2 text-primary font-label-bold text-label-bold mb-4 uppercase tracking-widest">
            <Icon name="receipt_long" fill />
            <span>Mi cuenta</span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg uppercase text-on-surface">
            Mis Compras
          </h1>
          {!loading && totalPhotos > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <div className="font-headline-md text-headline-md text-primary">
                  {totalPhotos}
                </div>
                <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-1">
                  Fotos compradas
                </div>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-primary">
                  {groups.length}
                </div>
                <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-1">
                  Eventos
                </div>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-primary">
                  {formatPrice(totalSpent)}
                </div>
                <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-1">
                  Total invertido
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="py-16 shots-container min-h-[40vh]">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-on-surface-variant">
            <Icon name="autorenew" className="animate-spin" />
            <span className="font-body-md">Cargando tus compras...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-24">
            <Icon
              name="shopping_bag"
              className="text-6xl text-surface-container-highest mb-4"
            />
            <p className="font-headline-md text-headline-md text-on-surface mb-2">
              Aún no tienes compras
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              Explora los eventos y encuentra tus fotos.
            </p>
            <Link to="/eventos" className="shots-btn-primary px-8">
              <Icon name="search" />
              Buscar fotos
            </Link>
          </div>
        ) : (
          <>
            <aside
              role="status"
              className="flex items-start gap-3 border border-surface-variant bg-surface-container-lowest p-4 mb-12"
            >
              <Icon name="schedule" className="text-primary mt-0.5" />
              <p className="font-body-md text-body-md text-on-surface">
                Tus fotos quedan disponibles para descargar durante 6 meses
                desde la fecha de compra. Te avisaremos por correo un mes y
                una semana antes de que se borren. El badge sobre cada foto
                indica los días que faltan.
              </p>
            </aside>
            <div className="space-y-16">
              {groups.map((group) => (
                <PurchaseGroup key={group.eventId} group={group} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer variant="simple" />
    </>
  )
}

function PurchaseGroup({ group }: { group: EventGroup }) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const visible = expanded ? group.purchases : group.purchases.slice(0, PREVIEW_LIMIT)
  const hidden = Math.max(0, group.purchases.length - PREVIEW_LIMIT)
  const visibleIds = visible.map((p) => p.id)
  const allVisibleSelected =
    visible.length > 0 && visibleIds.every((id) => selected.has(id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function clear() {
    setSelected(new Set())
  }

  async function downloadSelected() {
    const targets = group.purchases.filter((p) => {
      if (!selected.has(p.id)) return false
      const status = p.orderStatus ?? getOrder(p.orderId)?.status
      return status !== 'refunded' && status !== 'reversed'
    })
    if (targets.length === 0) return
    if (
      targets.length >= 4 &&
      !window.confirm(
        `Vamos a descargar ${targets.length} fotos. Es posible que tu navegador te pida permitir varias descargas. ¿Continuamos?`,
      )
    ) {
      return
    }
    setDownloading(true)
    for (const purchase of targets) {
      // Una descarga por foto. El backend devuelve la versión original vía
      // signed URL; aquí en mock reutilizamos la preview.
      const signed = generateSignedDownload(purchase.url)
      const a = document.createElement('a')
      a.href = signed.url
      a.download = `${purchase.photoId}.jpg`
      a.rel = 'noreferrer'
      // No usamos target=_blank para que el browser no abra pestañas y
      // dispare el pop-up blocker en lotes grandes.
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      await new Promise((r) => setTimeout(r, 600))
    }
    setDownloading(false)
    setSelected(new Set())
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-surface-container-highest pb-4">
        <div>
          {group.event && (
            <div className="flex items-center gap-2 text-on-surface-variant font-label-bold text-label-bold mb-2 uppercase tracking-widest">
              <Icon name="calendar_month" fill className="text-base" />
              <span>{group.event.displayDate}</span>
              <span className="mx-1 text-surface-container-highest">|</span>
              <Icon name="location_on" fill className="text-base" />
              <span>{group.event.location}</span>
            </div>
          )}
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {group.event?.title ?? 'Evento'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-left md:text-right">
            <div className="font-headline-md text-headline-md text-primary">
              {formatPrice(group.total)}
            </div>
            <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">
              {group.purchases.length}{' '}
              {group.purchases.length === 1 ? 'foto' : 'fotos'}
            </div>
          </div>
          <Link
            to={`/eventos/${group.eventId}`}
            className="shots-btn-outline px-4 py-2 text-xs sm:text-sm"
          >
            Buscar más fotos
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-3 py-2 text-xs hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name={allVisibleSelected ? 'deselect' : 'select_all'} />
            {allVisibleSelected ? 'Quitar selección' : 'Seleccionar todas'}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={clear}
              className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary uppercase tracking-widest text-xs"
            >
              Limpiar ({selected.size})
            </button>
          )}
        </div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={downloadSelected}
            disabled={downloading}
            className="shots-btn-primary px-3 py-2 text-xs disabled:opacity-60 w-full sm:w-auto sm:ml-auto justify-center"
          >
            <Icon
              name={downloading ? 'autorenew' : 'download'}
              className={downloading ? 'animate-spin' : ''}
            />
            {downloading
              ? 'Descargando…'
              : `Descargar ${selected.size} ${selected.size === 1 ? 'foto' : 'fotos'}`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-base">
        {visible.map((purchase) => {
          const retention =
            purchase.retentionUntil ?? retentionDateFrom(purchase.purchasedAt)
          const daysLeft = daysUntil(retention)
          const isSelected = selected.has(purchase.id)
          const orderStatus =
            purchase.orderStatus ?? getOrder(purchase.orderId)?.status
          const isRefunded =
            orderStatus === 'refunded' || orderStatus === 'reversed'
          return (
            <article
              key={purchase.id}
              className={`group bg-surface-container-lowest border overflow-hidden transition-colors flex flex-col ${
                isSelected ? 'border-primary' : 'border-surface-variant'
              } ${isRefunded ? 'opacity-60' : ''}`}
            >
              <div
                className={`relative aspect-[4/3] ${
                  isRefunded ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !isRefunded && toggle(purchase.id)}
              >
                <img
                  src={purchase.url}
                  alt={`Foto comprada ${purchase.photoId}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {!isRefunded && (
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`flex items-center justify-center w-7 h-7 border-2 backdrop-blur-sm ${
                        isSelected
                          ? 'bg-primary border-primary text-on-primary'
                          : 'bg-background/70 border-surface-variant text-transparent'
                      }`}
                    >
                      <Icon name="check" className="text-base" />
                    </span>
                  </div>
                )}
                {isRefunded ? (
                  <div className="absolute top-3 right-3 shots-badge bg-primary-container text-on-primary-container">
                    <Icon name="undo" className="text-base mr-1" />
                    Reembolsada
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 shots-badge bg-primary-container/90 text-on-primary-container">
                    <Icon name="schedule" className="text-base mr-1" />
                    {daysLeft}d
                  </div>
                )}
              </div>

              <div className="p-3 flex items-center justify-between gap-3 border-t border-surface-variant">
                <div className="min-w-0 flex-1">
                  {purchase.bib ? (
                    <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs truncate">
                      Dorsal {purchase.bib}
                    </p>
                  ) : (
                    <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs truncate">
                      Foto {purchase.photoId}
                    </p>
                  )}
                  <Link
                    to={`/mis-compras/${purchase.orderId}`}
                    className="font-caption text-caption text-on-surface-variant hover:text-primary truncate block"
                  >
                    Orden {purchase.orderId}
                  </Link>
                </div>
                {isRefunded ? (
                  <span
                    aria-label="Esta orden fue reembolsada"
                    title="Esta orden fue reembolsada"
                    className="inline-flex items-center gap-1 bg-surface-container text-on-surface-variant font-label-bold text-label-bold px-3 py-2 shrink-0 cursor-not-allowed"
                  >
                    <Icon name="block" />
                    <span className="hidden sm:inline text-xs">Reembolsada</span>
                  </span>
                ) : (
                <a
                  href={generateSignedDownload(purchase.url).url}
                  download={`${purchase.photoId}.jpg`}
                  rel="noreferrer"
                  aria-label="Descargar foto"
                  className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container hover:bg-inverse-primary transition-colors font-label-bold text-label-bold px-3 py-2 shrink-0"
                >
                  <Icon name="download" />
                  <span className="hidden sm:inline text-xs">Descargar</span>
                </a>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {hidden > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-5 py-3 hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name={expanded ? 'expand_less' : 'expand_more'} />
            {expanded ? 'Mostrar menos' : `Ver las ${hidden} restantes`}
          </button>
        </div>
      )}
    </section>
  )
}
