import { useMemo, useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Icon } from '../../components/ui/Icon'
import { Select } from '../../components/ui/Select'
import type { Photo } from '../../lib/types'

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'processing', label: 'Procesando' },
  { value: 'published', label: 'Publicada' },
  { value: 'sold', label: 'Vendida' },
]

export function AdminPhotosPage() {
  const { photos, events, photographers, deletePhoto } = useAdmin()
  const [eventFilter, setEventFilter] = useState('')
  const [photographerFilter, setPhotographerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      const matchesEvent = !eventFilter || p.eventId === eventFilter
      const matchesPhotographer = !photographerFilter || p.photographerId === photographerFilter
      const matchesStatus = !statusFilter || p.status === statusFilter
      return matchesEvent && matchesPhotographer && matchesStatus
    })
  }, [photos, eventFilter, photographerFilter, statusFilter])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Fotos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Gestiona y modera todas las fotos subidas por evento y fotógrafo.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
        <Select
          icon="event"
          options={[
            { value: '', label: 'Todos los eventos' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ]}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Select
          icon="people"
          options={[
            { value: '', label: 'Todos los fotógrafos' },
            ...photographers.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={photographerFilter}
          onChange={(e) => setPhotographerFilter(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Select
          icon="filter_list"
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          wrapperClassName="flex-1 md:max-w-[220px]"
        />
      </div>

      <AdminTable<Photo>
        rows={filtered}
        emptyMessage="No hay fotos con esos filtros"
        columns={[
          {
            key: 'preview',
            header: 'Vista',
            render: (p) => (
              <div className="w-16 h-12 bg-surface-container-low">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </div>
            ),
          },
          {
            key: 'event',
            header: 'Evento',
            render: (p) => events.find((e) => e.id === p.eventId)?.title ?? p.eventId,
          },
          {
            key: 'photographer',
            header: 'Fotógrafo',
            render: (p) => photographers.find((ph) => ph.id === p.photographerId)?.name ?? '-',
          },
          {
            key: 'price',
            header: 'Precio',
            render: (p) => `$${p.price.toFixed(2)}`,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (p) => (
              <span
                className={`shots-badge ${
                  p.status === 'sold'
                    ? 'bg-green-500/20 text-green-400'
                    : p.status === 'processing'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-surface-highest text-on-surface-variant'
                }`}
              >
                {p.status === 'sold' ? 'Vendida' : p.status === 'processing' ? 'Procesando' : 'Publicada'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar esta foto?')) deletePhoto(p.id)
                }}
                className="p-2 text-on-surface-variant hover:text-red-400 transition-colors ml-auto block"
              >
                <Icon name="delete" />
              </button>
            ),
          },
        ]}
      />
    </div>
  )
}
