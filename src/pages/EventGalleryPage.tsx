import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { EventItem, Photo, PhotoFilter } from '../lib/types'
import { getEventById, getEventPhotos, searchPhotosByFace } from '../lib/api'
import { PhotoCard } from '../components/events/PhotoCard'
import { SelfieSearchModal } from '../components/events/SelfieSearchModal'
import {
  BiometricConsentModal,
  hasBiometricConsent,
} from '../components/events/BiometricConsentModal'
import { CartToast } from '../components/events/CartToast'
import { useCart } from '../hooks/useCart'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'
import {
  packLabel,
  pricePerPhoto,
  resolvePack,
  unitPriceFromPacks,
} from '../lib/packs'

const filters: { value: PhotoFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'Todas', icon: 'photo_library' },
  { value: 'face', label: 'Mis coincidencias', icon: 'face' },
  { value: 'bib', label: 'Por dorsal', icon: 'pin' },
  { value: 'favorites', label: 'Favoritas', icon: 'favorite' },
]

export function EventGalleryPage() {
  const { eventId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [event, setEvent] = useState<EventItem | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'face' | 'dorsal'>(
    searchParams.get('tab') === 'dorsal' ? 'dorsal' : 'face'
  )
  const [bib, setBib] = useState('')
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('all')

  const { addItem, isInCart, items: cartItems } = useCart()

  const cartCountForEvent = cartItems.filter((it) => it.eventId === eventId).length
  const cartUnitTotalForEvent = cartItems
    .filter((it) => it.eventId === eventId)
    .reduce((sum, it) => sum + it.price, 0)
  const packResolution = event?.packs
    ? resolvePack(event.packs, cartCountForEvent, cartUnitTotalForEvent)
    : null
  const [toast, setToast] = useState<{ url: string } | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  function handleAddToCart(photo: Photo) {
    addItem(photo, eventId)
    setToast({ url: photo.url })
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  const [selfieModalOpen, setSelfieModalOpen] = useState(false)
  const [pendingSelfie, setPendingSelfie] = useState<File | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<'camera' | 'upload' | null>(null)
  const selfieFileRef = useRef<HTMLInputElement>(null)

  function ensureConsent(mode: 'camera' | 'upload') {
    if (hasBiometricConsent()) {
      if (mode === 'camera') {
        setPendingSelfie(null)
        setSelfieModalOpen(true)
      } else {
        selfieFileRef.current?.click()
      }
      return
    }
    setPendingMode(mode)
    setConsentOpen(true)
  }

  function handleConsentAccepted() {
    setConsentOpen(false)
    const mode = pendingMode
    setPendingMode(null)
    if (mode === 'camera') {
      setPendingSelfie(null)
      setSelfieModalOpen(true)
    } else if (mode === 'upload') {
      selfieFileRef.current?.click()
    }
  }

  function handleConsentCancel() {
    setConsentOpen(false)
    setPendingMode(null)
  }

  function openSelfieCamera() {
    ensureConsent('camera')
  }

  function openSelfieUpload() {
    ensureConsent('upload')
  }

  function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPendingSelfie(file)
    setSelfieModalOpen(true)
  }

  function closeSelfieModal() {
    setSelfieModalOpen(false)
    setPendingSelfie(null)
  }

  useEffect(() => {
    getEventById(eventId).then(setEvent)
    loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    loadPhotos({ filter: activeFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  async function loadPhotos(opts?: { bib?: string; filter?: PhotoFilter }) {
    if (!eventId) return
    setLoading(true)
    try {
      const data = await getEventPhotos(eventId, {
        bib: opts?.bib,
        filter: opts?.filter,
      })
      setPhotos(data)
    } finally {
      setLoading(false)
    }
  }

  function handleBibSearch() {
    loadPhotos({ bib, filter: activeFilter })
  }

  async function handleSelfieSearch(selfie: Blob) {
    if (!eventId) return
    const data = await searchPhotosByFace(eventId, selfie)
    setPhotos(data)
    setActiveFilter('face')
  }

  if (!event) {
    return (
      <main className="pt-32 pb-24 shots-container">
        <p className="text-on-surface-variant font-body-md">Cargando evento...</p>
      </main>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="relative bg-surface-container-low border-b border-surface-container-highest pt-32 pb-16">
        <div className="shots-container">
          <div className="flex flex-col md:flex-row justify-between items-end gap-gutter">
            <div>
              <div className="flex items-center gap-2 text-primary font-label-bold text-label-bold mb-4 uppercase tracking-widest">
                <Icon name="calendar_month" fill />
                <span>{event.displayDate}</span>
                <span className="mx-2 text-surface-container-highest">|</span>
                <Icon name="location_on" fill />
                <span>{event.location}</span>
              </div>
              <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg uppercase text-on-surface text-balance max-w-2xl">
                {event.title}
              </h1>
            </div>
            <div className="flex gap-4">
              <div className="bg-surface-container border border-surface-variant p-4 text-center min-w-[120px]">
                <div className="font-headline-md text-headline-md text-primary">
                  {(event.photoCount / 1000).toFixed(0)}k
                </div>
                <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-1">
                  Fotos
                </div>
              </div>
              <div className="bg-surface-container border border-surface-variant p-4 text-center min-w-[120px]">
                <div className="font-headline-md text-headline-md text-primary">
                  {((event.runnerCount ?? 0) / 1000).toFixed(0)}k
                </div>
                <div className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-1">
                  Corredores
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Panel */}
      <section className="px-margin-mobile md:px-margin-desktop -mt-8 relative z-10">
        <div className="max-w-container-max mx-auto">
          <div className="bg-surface-container-lowest border border-surface-variant p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-gutter">
            <div className="flex-1 md:border-r md:border-surface-variant pr-0 md:pr-8">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-6">
                Encuentra tus fotos
              </h2>
              <div className="flex gap-4 mb-6 border-b border-surface-variant">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('face')
                    setSearchParams({ tab: 'face' })
                  }}
                  className={`pb-2 inline-flex items-center gap-2 font-label-bold text-label-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'face'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name="face" fill={activeTab === 'face'} />
                  Reconocimiento Facial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dorsal')
                    setSearchParams({ tab: 'dorsal' })
                  }}
                  className={`pb-2 inline-flex items-center gap-2 font-label-bold text-label-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'dorsal'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name="pin" fill={activeTab === 'dorsal'} />
                  Número de Dorsal
                </button>
              </div>

              {activeTab === 'face' ? (
                <div>
                  <label className="block font-caption text-caption text-on-surface-variant mb-2">
                    Capturamos tu selfie y buscamos tus fotos del evento.
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={openSelfieCamera}
                      className="shots-btn-primary px-6 py-4 sm:flex-1 justify-center"
                    >
                      <Icon name="photo_camera" />
                      Tomar selfie
                    </button>
                    <button
                      type="button"
                      onClick={openSelfieUpload}
                      className="inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-6 py-4 sm:flex-1 hover:border-primary hover:text-primary transition-colors"
                    >
                      <Icon name="upload" />
                      Subir selfie
                    </button>
                  </div>
                  <input
                    ref={selfieFileRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleSelfieFile}
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-caption text-caption text-on-surface-variant mb-2">
                    Ingresa tu número de competidor
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={bib}
                      onChange={(e) => setBib(e.target.value)}
                      placeholder="Ej. 4509"
                      className="w-full bg-surface-container-lowest border border-surface-variant text-on-background p-4 font-headline-md text-headline-md focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all placeholder:text-on-surface-variant"
                    />
                    <button
                      type="button"
                      onClick={handleBibSearch}
                      className="shots-btn-primary px-8"
                    >
                      <Icon name="search" />
                      BUSCAR
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-64 pt-6 md:pt-0">
              <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">
                Filtros
              </h3>
              <div className="flex flex-col gap-2">
                {filters.map((f) => {
                  const active = activeFilter === f.value
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setActiveFilter(f.value)}
                      className={`flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                        active
                          ? 'border-primary bg-primary-container/15 text-primary'
                          : 'border-surface-variant text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
                      }`}
                    >
                      <Icon name={f.icon} fill={active} className="text-xl" />
                      <span className="font-label-bold text-label-bold uppercase tracking-widest text-[12px]">
                        {f.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packs */}
      {event.packs && event.packs.length > 0 && (
        <section className="shots-container mt-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-label-bold text-label-bold mb-2 uppercase tracking-widest">
                <Icon name="sell" fill />
                <span>Paga menos comprando en pack</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Elige más de una foto y obtén precios mejores. Al llegar al
                número exacto del pack se aplica solo, sin códigos.
              </p>
            </div>
            {packResolution && (
              <div className="bg-surface-container-lowest border border-surface-variant px-4 py-3 min-w-[220px]">
                {packResolution.activePack ? (
                  <p className="font-body-md text-body-md text-primary">
                    Pack <strong>{packLabel(packResolution.activePack.key)}</strong>{' '}
                    activo · ahorras {formatPrice(packResolution.savings)}
                  </p>
                ) : packResolution.nextPack ? (
                  <p className="font-body-md text-body-md text-on-surface">
                    Llevas {packResolution.count}{' '}
                    {packResolution.count === 1 ? 'foto' : 'fotos'}. Suma{' '}
                    <strong>
                      {packResolution.nextPack.missing} más
                    </strong>{' '}
                    y ahorra{' '}
                    {formatPrice(packResolution.nextPack.savingsIfReached)} con el{' '}
                    {packLabel(packResolution.nextPack.pack.key)}.
                  </p>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Añade fotos al carrito para ver tu progreso por pack.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-base">
            {event.packs.map((pack) => {
              const perPhoto = pricePerPhoto(pack)
              const unitPrice = unitPriceFromPacks(event.packs ?? [])
              const savingsLabel =
                pack.quantity != null && perPhoto != null && perPhoto < unitPrice
                  ? `Ahorras ${Math.round((1 - perPhoto / unitPrice) * 100)}%`
                  : null
              const isActive =
                packResolution?.activePack?.key === pack.key
              const isNext =
                packResolution?.nextPack?.pack.key === pack.key
              const highlight = isActive || isNext
              return (
                <div
                  key={pack.key}
                  className={`relative bg-surface-container-lowest border p-5 flex flex-col gap-2 transition-colors ${
                    isActive
                      ? 'border-primary'
                      : isNext
                        ? 'border-primary/50'
                        : 'border-surface-variant hover:border-primary/30'
                  }`}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-3 bg-primary text-on-primary font-label-bold text-label-bold uppercase tracking-widest text-[10px] px-2 py-0.5">
                      {isActive ? 'Activo' : 'Siguiente meta'}
                    </span>
                  )}
                  <span className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">
                    {packLabel(pack.key)}
                  </span>
                  <span className="font-headline-md text-headline-md text-primary">
                    {formatPrice(pack.price)}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {pack.quantity === null
                      ? 'Todas las fotos del evento'
                      : perPhoto != null
                        ? `${formatPrice(perPhoto)} por foto`
                        : `${pack.quantity} fotos`}
                  </span>
                  {savingsLabel && (
                    <span className="font-caption text-caption text-primary uppercase tracking-widest">
                      {savingsLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      <main className="py-16 shots-container">
        <div className="flex justify-between items-center mb-8 border-b border-surface-container-highest pb-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Resultados{' '}
            <span className="text-surface-container-highest">
              / {photos.length.toLocaleString()}
            </span>
          </h2>
          {/* TODO(frontend): vista lista pendiente — se reactivará junto a la paginación real. */}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-on-surface-variant">
            <Icon name="autorenew" className="animate-spin" />
            <span className="font-body-md">Cargando fotos...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base auto-rows-fr">
              {photos.map((photo, idx) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  size={idx === 0 ? 'large' : 'normal'}
                  onAdd={handleAddToCart}
                  inCart={isInCart(photo.id)}
                />
              ))}
            </div>
            {photos.length === 0 && (
              <p className="text-on-surface-variant font-body-md text-body-md text-center py-24">
                No hay fotos para los filtros seleccionados.
              </p>
            )}
            {photos.length > 0 && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  className="shots-btn-outline px-8 py-4 opacity-60 cursor-not-allowed"
                  disabled
                  title="Disponible cuando se conecte la paginación del backend"
                >
                  Cargar Más Resultados
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer variant="simple" />

      <SelfieSearchModal
        open={selfieModalOpen}
        onClose={closeSelfieModal}
        onSearch={handleSelfieSearch}
        initialFile={pendingSelfie}
      />

      <BiometricConsentModal
        open={consentOpen}
        onAccept={handleConsentAccepted}
        onCancel={handleConsentCancel}
      />

      <CartToast visible={!!toast} photoUrl={toast?.url} />
    </>
  )
}
