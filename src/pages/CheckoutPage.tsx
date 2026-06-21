import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { createOrder, simulatePayphone, CHECKOUT_TIMINGS } from '../lib/checkout'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'

type CheckoutStep = 'review' | 'redirecting'
type Outcome = 'success' | 'cancel' | 'pending'

export function CheckoutPage() {
  const { items, coupon, totals, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<CheckoutStep>('review')
  const [outcome, setOutcome] = useState<Outcome>('success')

  const itemsByEvent = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, it) => {
      ;(acc[it.eventId] ??= []).push(it)
      return acc
    }, {})
  }, [items])

  if (items.length === 0 && step === 'review') {
    return (
      <>
        <main className="pt-32 pb-24 shots-container flex flex-col items-center text-center gap-6">
          <Icon
            name="shopping_cart"
            className="text-6xl text-on-surface-variant"
          />
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase">
            No hay nada por cobrar
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Tu carrito está vacío. Agrega fotos para poder pagar.
          </p>
          <Link to="/eventos" className="shots-btn-primary px-8 py-4">
            Ver eventos
          </Link>
        </main>
        <Footer variant="simple" />
      </>
    )
  }

  async function handlePay() {
    if (!user) return
    setStep('redirecting')
    const order = createOrder({
      buyerEmail: user.email,
      items,
      coupon,
      totals,
    })
    const settled = await simulatePayphone(order.id, { outcome })
    if (settled.status === 'confirmed') {
      clear()
      navigate(`/checkout/success?order=${settled.id}`)
    } else if (settled.status === 'failed') {
      navigate(`/checkout/error?order=${settled.id}`)
    } else {
      navigate(`/checkout/pending?order=${settled.id}`)
    }
  }

  if (step === 'redirecting') {
    return (
      <main className="pt-32 pb-24 shots-container flex flex-col items-center text-center gap-6">
        <div className="border-2 border-primary/40 border-t-primary rounded-full w-12 h-12 animate-spin" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase">
          Redirigiendo a Payphone…
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          Estamos creando tu orden y abriendo la pasarela de pago. No cierres
          esta ventana.
        </p>
      </main>
    )
  }

  return (
    <>
      <main className="pt-32 pb-24 shots-container">
        <header className="mb-12">
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
            Confirmar y pagar
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Tienes {CHECKOUT_TIMINGS.paymentWindowMinutes} minutos para
            completar el pago una vez se abra Payphone.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-gutter">
          <section className="flex flex-col gap-8">
            <div className="bg-surface-container-lowest border border-surface-variant p-6">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-4">
                Detalles del comprador
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body-md text-body-md">
                <div>
                  <dt className="text-on-surface-variant">Nombre</dt>
                  <dd className="text-on-surface">{user?.name}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Email</dt>
                  <dd className="text-on-surface">{user?.email}</dd>
                </div>
              </dl>
              <p className="font-caption text-caption text-on-surface-variant mt-4">
                Las descargas quedarán asociadas a esta cuenta.
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant p-6">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-4">
                Fotos a pagar
              </h2>
              <div className="space-y-6">
                {Object.entries(itemsByEvent).map(([eventId, eventItems]) => (
                  <div key={eventId}>
                    <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      Evento {eventId}
                    </p>
                    <ul className="flex flex-wrap gap-3">
                      {eventItems.map((it) => (
                        <li
                          key={it.photoId}
                          className="flex items-center gap-3 border border-surface-variant px-3 py-2"
                        >
                          <img
                            src={it.url}
                            alt=""
                            className="w-12 h-12 object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                              {it.bib ? `Dorsal ${it.bib}` : it.photoId}
                            </span>
                            <span className="font-body-md text-body-md text-primary">
                              {formatPrice(it.price)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant p-6">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                Modo demo: simular respuesta de Payphone
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Mientras el backend no esté conectado, elige cómo debe responder
                la pasarela para probar los distintos flujos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {(
                  [
                    { value: 'success', label: 'Pago aprobado', icon: 'check' },
                    { value: 'cancel', label: 'Pago cancelado', icon: 'block' },
                    { value: 'pending', label: 'Quedó pendiente', icon: 'schedule' },
                  ] as { value: Outcome; label: string; icon: string }[]
                ).map((opt) => {
                  const active = outcome === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOutcome(opt.value)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 border px-4 py-3 transition-colors ${
                        active
                          ? 'border-primary text-primary bg-primary-container/15'
                          : 'border-surface-variant text-on-surface-variant hover:text-on-surface hover:border-primary/40'
                      }`}
                    >
                      <Icon name={opt.icon} fill={active} />
                      <span className="font-label-bold text-label-bold uppercase tracking-widest text-xs">
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <aside className="bg-surface-container-lowest border border-surface-variant p-6 flex flex-col gap-5 h-fit sticky top-28">
            <h3 className="font-headline-md text-headline-md text-on-surface uppercase">
              Resumen
            </h3>

            <dl className="space-y-2 text-on-surface">
              <div className="flex justify-between font-body-md text-body-md">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between font-body-md text-body-md text-primary">
                  <dt>Descuento {coupon && `(${coupon.code})`}</dt>
                  <dd>− {formatPrice(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between font-headline-md text-headline-md pt-2 border-t border-surface-variant">
                <dt>Total a pagar</dt>
                <dd className="text-primary">{formatPrice(totals.total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handlePay}
              className="shots-btn-primary py-3 justify-center"
            >
              <Icon name="payments" />
              Pagar con Payphone
            </button>

            <Link
              to="/carrito"
              className="text-center font-label-bold text-label-bold text-on-surface-variant hover:text-primary uppercase tracking-widest text-sm"
            >
              Volver al carrito
            </Link>

            <p className="font-caption text-caption text-on-surface-variant">
              La transacción debe confirmarse en los{' '}
              {CHECKOUT_TIMINGS.confirmationWindowMinutes} minutos posteriores a
              la autorización. De lo contrario, se reversa automáticamente.
            </p>
          </aside>
        </div>
      </main>

      <Footer variant="simple" />
    </>
  )
}
