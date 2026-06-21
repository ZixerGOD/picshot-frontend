import { Icon } from '../ui/Icon'
import type { Photo } from '../../lib/types'
import { formatPrice } from '../../lib/format'

interface PhotoCardProps {
  photo: Photo
  size?: 'large' | 'normal'
  onAdd?: (photo: Photo) => void
  inCart?: boolean
}

export function PhotoCard({
  photo,
  size = 'normal',
  onAdd,
  inCart = false,
}: PhotoCardProps) {
  const isLarge = size === 'large'

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (inCart) return
    onAdd?.(photo)
  }

  return (
    <div
      className={`group relative bg-surface-container-lowest border border-surface-variant overflow-hidden ${
        isLarge ? 'lg:col-span-2 lg:row-span-2 aspect-square lg:aspect-auto' : 'aspect-[4/3]'
      }`}
    >
      <img
        src={photo.url}
        alt={`Foto ${photo.id}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {photo.exclusive && (
        <div className="absolute top-4 left-4">
          <span className="bg-primary-container text-on-primary-container px-3 py-1 font-label-bold text-label-bold uppercase tracking-wider text-[10px]">
            Exclusiva
          </span>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <span
          className={`text-on-background rotate-[-15deg] tracking-widest ${
            isLarge ? 'font-display-lg text-display-lg' : 'font-headline-md text-headline-md'
          }`}
        >
          PREVIEW
        </span>
      </div>

      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
        <div className="flex justify-between items-end gap-4">
          <div>
            {photo.bib && (
              <div className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-1">
                Dorsal {photo.bib}
              </div>
            )}
            {photo.resolution && isLarge && (
              <div className="font-headline-md text-headline-md text-on-background mb-1">
                {photo.resolution}
              </div>
            )}
            <div className={`text-primary ${isLarge ? 'font-headline-lg text-headline-lg mt-2' : 'font-headline-md text-headline-md'}`}>
              {formatPrice(photo.price)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={inCart}
            aria-label={
              inCart ? 'Foto ya en el carrito' : `Añadir foto ${photo.id} al carrito`
            }
            className={`flex items-center gap-2 transition-colors font-label-bold text-label-bold ${
              inCart
                ? 'bg-surface-container text-on-surface-variant cursor-default'
                : 'bg-primary-container text-on-primary-container hover:bg-inverse-primary'
            } ${isLarge ? 'px-6 py-3' : 'px-4 py-2 border-2 border-primary-container'}`}
          >
            <Icon name={inCart ? 'check' : 'shopping_cart'} />
            {isLarge && (inCart ? 'AÑADIDA' : 'AÑADIR')}
          </button>
        </div>
      </div>
    </div>
  )
}
