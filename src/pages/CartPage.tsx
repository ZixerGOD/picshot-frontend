import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'

export function CartPage() {
  const {
    items,
    totals,
    coupon,
    removeItem,
    applyCoupon,
    removeCoupon,
    clear,
    eventGroups,
  } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{
    ok: boolean
    message: string
  } | null>(null)

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
            {eventGroups.map((group) => (
              <div key={group.eventId}>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                  <h2 className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest">
                    {group.eventTitle}
                  </h2>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>

                {group.activePackLabel && (
                  <div className="flex items-center gap-2 border border-primary bg-primary-container/15 px-3 py-2 mb-3 font-body-md text-body-md text-primary">
                    <Icon name="check_circle" fill />
                    Pack {group.activePackLabel} aplicado · ahorras{' '}
                    {formatPrice(group.packSavings)}
                  </div>
                )}

                {!group.activePackLabel && group.nextPackHint && (
                  <Link
                    to={`/eventos/${group.eventId}`}
                    className="flex items-center gap-2 border border-primary/40 bg-surface-container-lowest px-3 py-2 mb-3 font-body-md text-body-md text-on-surface hover:border-primary transition-colors"
                  >
                    <Icon name="sell" className="text-primary" />
                    Suma {group.nextPackHint.missing}{' '}
                    {group.nextPackHint.missing === 1 ? 'foto' : 'fotos'} más
                    para el {group.nextPackHint.label} y ahorra{' '}
                    {formatPrice(group.nextPackHint.savings)}
                  </Link>
                )}

                <ul className="flex flex-col gap-3">
                  {group.items.map((it) => (
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
                        <span
                          className={`font-headline-md text-headline-md mt-1 ${
                            group.activePackLabel
                              ? 'text-on-surface-variant line-through'
                              : 'text-primary'
                          }`}
                        >
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

                {group.activePackLabel && (
                  <p className="font-caption text-caption text-on-surface-variant mt-2 text-right">
                    Subtotal evento:{' '}
                    <span className="text-primary font-label-bold">
                      {formatPrice(group.chargedTotal)}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </section>

          <aside className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6 flex flex-col gap-5 h-fit lg:sticky lg:top-28">
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

            {eventGroups.some((g) => g.activePackLabel) && (
              <div className="border-t border-surface-variant pt-3 space-y-1">
                {eventGroups
                  .filter((g) => g.activePackLabel)
                  .map((g) => (
                    <p
                      key={g.eventId}
                      className="font-caption text-caption text-primary"
                    >
                      Pack {g.activePackLabel} activo · ahorro{' '}
                      {formatPrice(g.packSavings)}
                    </p>
                  ))}
              </div>
            )}

            <dl className="space-y-2 text-on-surface">
              <div className="flex justify-between gap-4 font-body-md text-body-md">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between gap-4 font-body-md text-body-md text-primary">
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
