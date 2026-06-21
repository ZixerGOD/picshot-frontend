import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { Icon } from '../../components/ui/Icon'
import { Footer } from '../../components/layout/Footer'
import { formatPrice } from '../../lib/format'

export function CartPage() {
  const {
    items,
    packs,
    count,
    totals,
    coupon,
    removeItem,
    removePack,
    convertSinglesToPack,
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

  if (items.length === 0 && packs.length === 0) {
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
              {count} {count === 1 ? 'foto' : 'fotos'} listas para comprar.
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
                  <Link
                    to={`/eventos/${group.eventId}`}
                    className="font-caption text-caption text-primary hover:underline"
                  >
                    Ver evento
                  </Link>
                </div>

                {/* Bloques de pack */}
                {group.packs.map((pack) => (
                  <div
                    key={pack.id}
                    className="border border-primary bg-primary-container/10 mb-4"
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-primary/30">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon name="sell" className="text-primary" fill />
                          <p className="font-label-bold text-label-bold text-primary uppercase tracking-widest">
                            {pack.label}
                          </p>
                        </div>
                        <p className="font-caption text-caption text-on-surface-variant mt-0.5">
                          {pack.quantity == null
                            ? 'Acceso a todas las fotos del evento'
                            : `${pack.photos.length} fotos incluidas`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-headline-md text-headline-md text-primary">
                          {formatPrice(pack.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePack(pack.id)}
                          aria-label="Quitar pack"
                          className="p-1 text-on-surface-variant hover:text-primary-container"
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    </div>
                    {pack.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto px-4 py-3">
                        {pack.photos.map((ph) => (
                          <img
                            key={ph.photoId}
                            src={ph.url}
                            alt=""
                            className="w-16 h-16 object-cover border border-surface-variant shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Upsell: convertir o sumar fotos */}
                {group.upsell &&
                  (group.upsell.canConvert ? (
                    <button
                      type="button"
                      onClick={() =>
                        convertSinglesToPack(group.eventId, group.upsell!.pack.key)
                      }
                      className="w-full flex items-center justify-between gap-3 border border-primary px-3 py-3 mb-4 bg-primary-container/15 hover:bg-primary-container/25 transition-colors text-left"
                    >
                      <div>
                        <p className="font-label-bold text-label-bold text-primary uppercase tracking-widest text-xs">
                          Mejor opción: {group.upsell.label}
                        </p>
                        <p className="font-body-md text-body-md text-on-surface">
                          Cambia tus {group.upsell.currentSingles} fotos sueltas
                          al pack por {formatPrice(group.upsell.pack.price)} y
                          ahorra {formatPrice(group.upsell.savings)}.
                        </p>
                      </div>
                      <span className="shrink-0 shots-btn-primary px-3 py-2 text-xs">
                        Cambiar a pack
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={`/eventos/${group.eventId}`}
                      className="w-full flex items-center justify-between gap-3 border border-primary/40 px-3 py-3 mb-4 bg-surface-container-lowest hover:border-primary transition-colors"
                    >
                      <div>
                        <p className="font-label-bold text-label-bold text-primary uppercase tracking-widest text-xs">
                          ¿Llevas más?
                        </p>
                        <p className="font-body-md text-body-md text-on-surface">
                          Suma {group.upsell.missing}{' '}
                          {group.upsell.missing === 1 ? 'foto' : 'fotos'} más
                          para el {group.upsell.label} y ahorra{' '}
                          {formatPrice(group.upsell.savings)}.
                        </p>
                      </div>
                      <Icon
                        name="arrow_forward"
                        className="text-primary shrink-0"
                      />
                    </Link>
                  ))}

                {/* Fotos sueltas */}
                {group.singles.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {group.singles.map((it) => (
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
                )}

                <p className="font-caption text-caption text-on-surface-variant mt-3 text-right">
                  Subtotal evento:{' '}
                  <span className="text-primary font-label-bold">
                    {formatPrice(group.total)}
                  </span>
                </p>
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

            {eventGroups.some((g) => g.packs.length > 0) && (
              <div className="border-t border-surface-variant pt-3 space-y-1">
                {eventGroups
                  .flatMap((g) =>
                    g.packs.map((p) => ({
                      key: p.id,
                      label: p.label,
                      price: p.price,
                    })),
                  )
                  .map((row) => (
                    <p
                      key={row.key}
                      className="font-caption text-caption text-primary"
                    >
                      {row.label} · {formatPrice(row.price)}
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
