import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { EventCard } from '../components/events/EventCard'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Footer } from '../components/layout/Footer'
import { Icon } from '../components/ui/Icon'

const cities = [
  { value: '', label: 'Todas las ciudades' },
  { value: 'Quito', label: 'Quito' },
  { value: 'Guayaquil', label: 'Guayaquil' },
  { value: 'Cuenca', label: 'Cuenca' },
  { value: 'Manta', label: 'Manta' },
  { value: 'Cotopaxi', label: 'Cotopaxi' },
]

const types = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Maratón', label: 'Maratón' },
  { value: 'Ciclismo', label: 'Ciclismo' },
  { value: 'Triatlón', label: 'Triatlón' },
  { value: 'MTB', label: 'MTB' },
]

export function EventsPage() {
  const [searchParams] = useSearchParams()
  const faceHintVisible = searchParams.get('tab') === 'face'

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    getEvents()
      .then((data) => {
        if (!active) return
        setEvents(data)
      })
      .catch(() => {
        if (active) setLoadError('No pudimos cargar los eventos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase())
      const matchesCity = !city || event.location === city
      const matchesType = !type || event.type === type
      const matchesDate = !date || event.date >= date
      return matchesSearch && matchesCity && matchesType && matchesDate
    })
  }, [events, search, city, date, type])

  function clearFilters() {
    setSearch('')
    setCity('')
    setDate('')
    setType('')
  }

  const hasActiveFilters = Boolean(search || city || date || type)

  return (
    <>
      <main className="pt-32 pb-24">
        <div className="shots-container flex flex-col gap-12">
          <header className="flex flex-col gap-4 max-w-3xl">
            <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase">
              Catálogo de eventos
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Explora las carreras y encuentra tus fotos oficiales.
            </p>
          </header>

          {faceHintVisible && (
            <aside
              role="status"
              className="flex items-start gap-3 border border-primary-container bg-surface-container-lowest p-4"
            >
              <Icon name="face" className="text-primary mt-0.5" />
              <p className="font-body-md text-body-md text-on-surface">
                Para buscar con selfie, abre uno de los eventos y entra en la
                pestaña <span className="font-label-bold">Reconocimiento facial</span>.
              </p>
            </aside>
          )}

          <section className="bg-surface-container-lowest border border-surface-variant p-6 flex flex-col md:flex-row gap-4 md:items-start">
            <Input
              icon="search"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="flex-1"
            />
            <Select
              icon="location_on"
              options={cities}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              wrapperClassName="flex-1 md:max-w-[200px]"
            />
            <Input
              icon="calendar_month"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              wrapperClassName="flex-1 md:max-w-[200px]"
            />
            <Select
              icon="directions_run"
              options={types}
              value={type}
              onChange={(e) => setType(e.target.value)}
              wrapperClassName="flex-1 md:max-w-[200px]"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface-variant font-label-bold text-label-bold uppercase tracking-widest px-4 py-2 hover:text-on-surface hover:border-primary transition-colors"
              >
                <Icon name="close" className="text-base" />
                Limpiar
              </button>
            )}
          </section>

          {loading && (
            <p className="text-on-surface-variant font-body-md text-body-md text-center py-12">
              Cargando eventos…
            </p>
          )}

          {loadError && !loading && (
            <p className="text-primary-container font-body-md text-body-md text-center py-12">
              {loadError}
            </p>
          )}

          {!loading && !loadError && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-on-surface-variant font-body-md text-body-md">
                  No se encontraron eventos con esos filtros.
                </p>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer variant="detailed" />
    </>
  )
}
