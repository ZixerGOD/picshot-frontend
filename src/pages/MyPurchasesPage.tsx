import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { EventItem, Purchase } from '../lib/types'
import { getEvents, getMyPurchases } from '../lib/api'
import {
  daysUntil,
  generateSignedDownload,
  retentionDateFrom,
} from '../lib/downloads'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'

interface EventGroup {
  eventId: string
  event: EventItem | null
  purchases: Purchase[]
  total: number
}

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
          <h1 className="font-display-lg text-display-lg uppercase text-on-surface">
            Mis Compras
          </h1>
          {!loading && totalPhotos > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <div className="font-headline-md text-headline-md text-primary">{totalPhotos}</div>
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
              Tus fotos quedan disponibles para descargar durante 6 meses desde
              la fecha de compra. El badge sobre cada foto te indica los días
              que faltan para que se eliminen.
            </p>
          </aside>
          <div className="space-y-16">
            {groups.map((group) => (
              <section key={group.eventId}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-surface-container-highest pb-4">
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
                  <div className="flex items-center gap-4">
                    <div className="text-right">
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
                      className="shots-btn-outline px-4 py-2"
                    >
                      Ver evento
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
                  {group.purchases.map((purchase) => {
                    const retention =
                      purchase.retentionUntil ??
                      retentionDateFrom(purchase.purchasedAt)
                    const daysLeft = daysUntil(retention)
                    return (
                      <article
                        key={purchase.id}
                        className="group relative bg-surface-container-lowest border border-surface-variant overflow-hidden aspect-[4/3]"
                      >
                        <img
                          src={purchase.url}
                          alt={`Foto comprada ${purchase.photoId}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 shots-badge bg-primary-container/90 text-on-primary-container">
                          <Icon name="schedule" className="text-base mr-1" />
                          {daysLeft}d
                        </div>
                        <div className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                          <div className="flex justify-between items-start">
                            {purchase.bib && (
                              <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest">
                                Dorsal {purchase.bib}
                              </span>
                            )}
                            <span className="shots-badge bg-primary-container text-on-primary-container">
                              <Icon name="check" className="text-base mr-1" />
                              Comprada
                            </span>
                          </div>
                          <div className="flex justify-between items-end gap-4">
                            <div>
                              {purchase.resolution && (
                                <div className="font-body-md text-body-md text-on-background">
                                  {purchase.resolution}
                                </div>
                              )}
                              <Link
                                to={`/mis-compras/${purchase.orderId}`}
                                className="font-caption text-caption text-primary hover:underline"
                              >
                                Orden {purchase.orderId}
                              </Link>
                            </div>
                            <a
                              href={generateSignedDownload(purchase.url).url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 bg-primary-container text-on-primary-container hover:bg-inverse-primary transition-colors font-label-bold text-label-bold px-4 py-2"
                            >
                              <Icon name="download" />
                              Descargar
                            </a>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
          </>
        )}
      </main>

      <Footer variant="simple" />
    </>
  )
}
