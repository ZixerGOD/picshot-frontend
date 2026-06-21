import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Order } from '../lib/types'
import { getOrder } from '../lib/checkout'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'

type Variant = 'success' | 'error' | 'pending'

interface CheckoutResultPageProps {
  variant: Variant
}

const COPY: Record<
  Variant,
  { title: string; subtitle: string; icon: string; tone: string }
> = {
  success: {
    title: 'Pago confirmado',
    subtitle:
      'Tus fotos ya están disponibles en tu cuenta. ¡Buen entrenamiento!',
    icon: 'check_circle',
    tone: 'text-primary',
  },
  error: {
    title: 'No pudimos cobrar tu compra',
    subtitle:
      'Payphone reportó que la transacción no se completó. Puedes reintentar el pago desde el carrito.',
    icon: 'error',
    tone: 'text-primary-container',
  },
  pending: {
    title: 'Tu pago quedó pendiente',
    subtitle:
      'Payphone autorizó la transacción pero todavía no la confirma. Esto puede tardar unos minutos.',
    icon: 'schedule',
    tone: 'text-primary',
  },
}

export function CheckoutResultPage({ variant }: CheckoutResultPageProps) {
  const [params] = useSearchParams()
  const orderId = params.get('order')
  const [order, setOrder] = useState<Order | null>(null)
  const copy = COPY[variant]

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }
    setOrder(getOrder(orderId) ?? null)
  }, [orderId])

  return (
    <>
      <main className="pt-32 pb-24 shots-container max-w-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <Icon name={copy.icon} className={`text-6xl ${copy.tone}`} />
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
            {copy.title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            {copy.subtitle}
          </p>
        </div>

        {order && (
          <section className="mt-12 bg-surface-container-lowest border border-surface-variant p-6">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
              Detalles de la orden
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body-md text-body-md">
              <div>
                <dt className="text-on-surface-variant">Orden</dt>
                <dd className="text-on-surface">{order.id}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Total</dt>
                <dd className="text-primary">{formatPrice(order.totals.total)}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Estado</dt>
                <dd className="text-on-surface uppercase tracking-widest">
                  {order.status.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Comprador</dt>
                <dd className="text-on-surface">{order.buyerEmail}</dd>
              </div>
              {order.payphone?.transactionId && (
                <div className="sm:col-span-2">
                  <dt className="text-on-surface-variant">Transacción Payphone</dt>
                  <dd className="text-on-surface">
                    {order.payphone.transactionId}{' '}
                    <span className="text-on-surface-variant text-caption">
                      (código {order.payphone.responseCode})
                    </span>
                  </dd>
                </div>
              )}
              {order.payphone?.message && (
                <div className="sm:col-span-2">
                  <dt className="text-on-surface-variant">Mensaje</dt>
                  <dd className="text-on-surface">{order.payphone.message}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          {variant === 'success' && (
            <Link
              to="/mis-compras"
              className="shots-btn-primary px-6 py-3 justify-center"
            >
              <Icon name="download" />
              Ver mis compras
            </Link>
          )}
          {variant === 'error' && (
            <Link
              to="/carrito"
              className="shots-btn-primary px-6 py-3 justify-center"
            >
              <Icon name="autorenew" />
              Volver al carrito
            </Link>
          )}
          {variant === 'pending' && (
            <Link
              to="/mis-compras"
              className="shots-btn-primary px-6 py-3 justify-center"
            >
              <Icon name="visibility" />
              Ver estado de la orden
            </Link>
          )}
          <Link
            to="/eventos"
            className="inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-6 py-3 hover:border-primary hover:text-primary transition-colors"
          >
            Ver más eventos
          </Link>
        </div>
      </main>

      <Footer variant="simple" />
    </>
  )
}
