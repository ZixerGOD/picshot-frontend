import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { EventItem, Photo, PhotoFilter } from '../lib/types'
import { getEventById, getEventPhotos, searchPhotosByFace } from '../lib/api'
import { PhotoCard } from '../components/events/PhotoCard'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { formatPrice } from '../lib/format'
import { packLabel, pricePerPhoto } from '../lib/packs'

const filters: { value: PhotoFilter; label: string; count?: number }[] = [
  { value: 'all', label: 'Todas las fotos' },
  { value: 'face', label: 'Coincidencias faciales', count: 0 },
  { value: 'bib', label: 'Por dorsal', count: 0 },
  { value: 'favorites', label: 'Favoritas' },
]

export function EventGalleryPage() {
  const { eventId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [event, setEvent] = useState<EventItem | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'dorsal' | 'face'>(
    searchParams.get('tab') === 'face' ? 'face' : 'dorsal'
  )
  const [bib, setBib] = useState('')
  const [scanning, setScanning] = useState(false)
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('all')

  const fileRef = useRef<HTMLInputElement>(null)

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

  async function handleFaceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !eventId) return
    setScanning(true)
    try {
      const data = await searchPhotosByFace(eventId, file)
      setPhotos(data)
      setActiveFilter('face')
    } finally {
      setScanning(false)
    }
  }

  function triggerFile() {
    fileRef.current?.click()
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
              <h1 className="font-display-lg text-display-lg uppercase text-on-surface">
                {event.title.split(' ').slice(0, 2).join(' ')}
                <br />
                {event.title.split(' ').slice(2).join(' ')}
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
          <div className="bg-surface-container-lowest border border-surface-variant p-6 md:p-8 flex flex-col md:flex-row gap-gutter">
            <div className="flex-1 md:border-r md:border-surface-variant pr-0 md:pr-8">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-6">
                Encuentra tus fotos
              </h2>
              <div className="flex gap-4 mb-6 border-b border-surface-variant">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dorsal')
                    setSearchParams({ tab: 'dorsal' })
                  }}
                  className={`pb-2 font-label-bold text-label-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'dorsal'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Número de Dorsal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('face')
                    setSearchParams({ tab: 'face' })
                  }}
                  className={`pb-2 font-label-bold text-label-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'face'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Reconocimiento Facial
                </button>
              </div>

              {activeTab === 'dorsal' ? (
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
              ) : (
                <div>
                  <label className="block font-caption text-caption text-on-surface-variant mb-2">
                    Tecnología de escaneo de alta precisión
                  </label>
                  <div
                    onClick={triggerFile}
                    className={`relative bg-surface-container-lowest border border-surface-variant h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary-container transition-colors group overflow-hidden ${
                      scanning ? 'scanning' : ''
                    }`}
                  >
                    <Icon
                      name="photo_camera"
                      className="text-4xl text-surface-container-highest group-hover:text-primary transition-colors mb-2"
                    />
                    <span className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">
                      Subir Selfie
                    </span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFaceUpload}
                    />
                    {scanning && (
                      <>
                        <div className="shots-laser-line animate-scan" />
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-[4px] flex flex-col items-center justify-center">
                          <Icon
                            name="autorenew"
                            className="text-primary text-4xl animate-spin-slow mb-2"
                          />
                          <span className="font-label-bold text-label-bold text-primary uppercase tracking-widest">
                            Analizando rostro...
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-64 pt-6 md:pt-0">
              <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">
                Filtros Activos
              </h3>
              <div className="space-y-2">
                {filters.map((f) => (
                  <label key={f.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="filter"
                      value={f.value}
                      checked={activeFilter === f.value}
                      onChange={() => setActiveFilter(f.value)}
                      className="text-primary bg-surface-container-lowest border-surface-variant focus:ring-primary"
                    />
                    <span className="text-on-surface group-hover:text-primary transition-colors">
                      {f.label}
                    </span>
                    {typeof f.count === 'number' && (
                      <span className="bg-surface-container-highest text-on-surface font-caption text-caption px-2 py-0.5 ml-auto">
                        {f.count}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packs */}
      {event.packs && event.packs.length > 0 && (
        <section className="shots-container mt-16">
          <div className="flex items-center gap-2 text-primary font-label-bold text-label-bold mb-6 uppercase tracking-widest">
            <Icon name="sell" fill />
            <span>Packs disponibles</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-base">
            {event.packs.map((pack) => {
              const perPhoto = pricePerPhoto(pack)
              return (
                <div
                  key={pack.key}
                  className="bg-surface-container-lowest border border-surface-variant p-5 flex flex-col gap-2 hover:border-primary-container transition-colors"
                >
                  <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    {packLabel(pack.key)}
                  </span>
                  <span className="font-headline-md text-headline-md text-primary">
                    {formatPrice(pack.price)}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {pack.quantity === null
                      ? 'Todas tus fotos'
                      : perPhoto != null
                        ? `${formatPrice(perPhoto)} / foto`
                        : `${pack.quantity} fotos`}
                  </span>
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
          <div className="flex gap-2">
            <button className="p-2 border border-surface-variant text-on-surface hover:border-primary hover:text-primary transition-colors">
              <Icon name="grid_view" />
            </button>
            <button className="p-2 border border-surface-variant text-surface-container-highest hover:text-on-surface transition-colors">
              <Icon name="view_list" />
            </button>
          </div>
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
                  className="shots-btn-outline px-8 py-4"
                  onClick={() => alert('Cargar más: conectar con paginación del backend')}
                >
                  Cargar Más Resultados
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer variant="simple" />
    </>
  )
}
