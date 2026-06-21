import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { getEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'

export function CartPage() {
  const { items, totals, coupon, removeItem, applyCoupon, removeCoupon, clear } =
    useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState<Record<string, EventItem>>({})
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{
    ok: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    let active = true
    getEvents()
      .then((data) => {
        if (!active) return
        const map: Record<string, EventItem> = {}
        data.forEach((e) => (map[e.id] = e))
        setEvents(map)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function handleApplyCoupon() {
    const res = applyCoupon(couponInput)
    setCouponMsg(res)
    if (res.ok) setCouponInput('')
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/carrito' } })
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <>
        <main className="pt-32 pb-24 shots-container flex flex-col items-center text-center gap-6">
          <Icon name="shopping_cart" className="text-6xl text-on-surface-variant" />
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
            Tu carrito está vacío
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Encuentra tus fotos en un evento y agrégalas aquí para comprarlas.
          </p>
          <Link to="/eventos" className="shots-btn-primary px-8 py-4">
            <Icon name="search" />
            Ver eventos
          </Link>
        </main>
        <Footer variant="simple" />
      </>
    )
  }

  const itemsByEvent = items.reduce<Record<string, typeof items>>((acc, it) => {
    ;(acc[it.eventId] ??= []).push(it)
    return acc
  }, {})

  return (
    <>
      <main className="pt-32 pb-24 shots-container">
        <header className="flex items-end justify-between mb-12 gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
              Tu carrito
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {items.length} {items.length === 1 ? 'foto' : 'fotos'} listas para
              comprar.
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-on-surface-variant hover:text-primary font-label-bold text-label-bold uppercase tracking-widest text-sm"
          >
            Vaciar
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-gutter">
          <section className="flex flex-col gap-8">
            {Object.entries(itemsByEvent).map(([eventId, eventItems]) => (
              <div key={eventId}>
                <h2 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  {events[eventId]?.title ?? 'Evento'}
                </h2>
                <ul className="flex flex-col gap-3">
                  {eventItems.map((it) => (
                    <li
                      key={it.photoId}
                      className="flex gap-4 bg-surface-container-lowest border border-surface-variant p-3"
                    >
                      <img
                        src={it.url}
                        alt={`Foto ${it.photoId}`}
                        className="w-24 h-20 object-cover border border-surface-variant"
                      />
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        {it.bib && (
                          <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
                            Dorsal {it.bib}
                          </span>
                        )}
                        {it.resolution && (
                          <span className="font-body-md text-body-md text-on-surface">
                            {it.resolution}
                          </span>
                        )}
                        <span className="font-headline-md text-headline-md text-primary mt-1">
                          {formatPrice(it.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.photoId)}
                        aria-label="Quitar del carrito"
                        className="self-start p-2 text-on-surface-variant hover:text-primary"
                      >
                        <Icon name="close" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <aside className="bg-surface-container-lowest border border-surface-variant p-6 flex flex-col gap-5 h-fit sticky top-28">
            <h3 className="font-headline-md text-headline-md text-on-surface uppercase">
              Resumen
            </h3>

            <div className="space-y-2">
              <label className="block font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                Código de descuento
              </label>
              {coupon ? (
                <div className="flex items-center justify-between border border-primary bg-primary-container/15 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon name="sell" className="text-primary" />
                    <span className="font-label-bold text-label-bold text-primary uppercase tracking-widest">
                      {coupon.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Quitar cupón"
                    className="text-primary"
                  >
                    <Icon name="close" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Ej. QUITO20"
                      className="flex-1 bg-surface-container-lowest border border-surface-variant text-on-background px-3 py-2 font-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="shots-btn-primary px-4 py-2 text-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponMsg && (
                    <p
                      className={`font-caption text-caption ${
                        couponMsg.ok ? 'text-primary' : 'text-primary-container'
                      }`}
                    >
                      {couponMsg.message}
                    </p>
                  )}
                </>
              )}
            </div>

            <dl className="space-y-2 text-on-surface">
              <div className="flex justify-between font-body-md text-body-md">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between font-body-md text-body-md text-primary">
                  <dt>Descuento</dt>
                  <dd>− {formatPrice(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 font-headline-md text-headline-md pt-2 border-t border-surface-variant">
                <dt>Total</dt>
                <dd className="text-primary">{formatPrice(totals.total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              className="shots-btn-primary py-3 justify-center"
            >
              <Icon name="lock" />
              {isAuthenticated ? 'Ir a pagar' : 'Iniciar sesión para pagar'}
            </button>

            <p className="font-caption text-caption text-on-surface-variant">
              Las descargas estarán disponibles en{' '}
              <Link to="/mis-compras" className="text-primary hover:underline">
                Mis Compras
              </Link>{' '}
              después del pago.
            </p>
          </aside>
        </div>
      </main>

      <Footer variant="simple" />
    </>
  )
}
