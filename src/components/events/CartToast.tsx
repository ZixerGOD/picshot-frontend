import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { Icon } from '../ui/Icon'
import { formatPrice } from '../../lib/format'

interface CartToastProps {
  visible: boolean
  photoUrl?: string
}

export function CartToast({ visible, photoUrl }: CartToastProps) {
  const { count, totals } = useCart()
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm bg-surface-container-lowest border border-primary shadow-2xl p-4 flex items-center gap-3 animate-fade-in"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="w-12 h-12 object-cover border border-surface-variant shrink-0"
        />
      ) : (
        <span className="w-12 h-12 bg-primary-container/30 flex items-center justify-center shrink-0">
          <Icon name="shopping_cart" className="text-primary" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs">
          Foto añadida
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant truncate">
          {count} {count === 1 ? 'foto' : 'fotos'} · {formatPrice(totals.total)}
        </p>
      </div>
      <Link
        to="/carrito"
        className="shots-btn-primary px-3 py-2 text-xs shrink-0"
      >
        Ir al carrito
      </Link>
    </div>
  )
}
