import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mockEvents } from '../lib/mocks'
import { EventCard } from '../components/events/EventCard'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Footer } from '../components/layout/Footer'
import { Icon } from '../components/ui/Icon'

const cities = [
  { value: '', label: 'Todas las ciudades' },
  { value: 'Madrid', label: 'Madrid' },
  { value: 'Barcelona', label: 'Barcelona' },
  { value: 'Valencia', label: 'Valencia' },
  { value: 'Granada', label: 'Granada' },
  { value: 'Huesca', label: 'Huesca' },
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

  const filtered = useMemo(() => {
    return mockEvents.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase())
      const matchesCity = !city || event.location === city
      const matchesType = !type || event.type === type
      const matchesDate = !date || event.date >= date
      return matchesSearch && matchesCity && matchesType && matchesDate
    })
  }, [search, city, date, type])

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

          <section className="bg-surface-container-lowest border border-surface-variant p-6 flex flex-col md:flex-row gap-4">
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
          </section>

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
        </div>
      </main>

      <Footer variant="detailed" />
    </>
  )
}
