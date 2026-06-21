import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { EventItem } from '../../lib/types'

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  closed: 'Cerrado',
}

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
]

export function AdminEventsPage() {
  const { events, deleteEvent } = useAdmin()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !status || e.status === status
      return matchesSearch && matchesStatus
    })
  }, [events, search, status])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Eventos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Gestiona los eventos deportivos y sus galerías.
          </p>
        </div>
        <Link to="/admin/eventos/nuevo">
          <Button>
            <Icon name="add" />
            Crear evento
          </Button>
        </Link>
      </div>

      <div className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
        <Input
          icon="search"
          placeholder="Buscar evento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Select
          icon="filter_list"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          wrapperClassName="flex-1 md:max-w-[240px]"
        />
      </div>

      <AdminTable<EventItem>
        rows={filtered}
        emptyMessage="No se encontraron eventos"
        columns={[
          {
            key: 'title',
            header: 'Evento',
            render: (e) => (
              <div>
                <Link
                  to={`/admin/eventos/${e.id}`}
                  className="font-label-bold text-label-bold text-primary hover:underline"
                >
                  {e.title}
                </Link>
                <p className="font-caption text-caption text-on-surface-variant">
                  {e.displayDate} · {e.location}
                </p>
              </div>
            ),
          },
          { key: 'type', header: 'Tipo', render: (e) => e.type },
          {
            key: 'status',
            header: 'Estado',
            render: (e) => (
              <span
                className={`shots-badge ${
                  e.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : e.status === 'closed'
                      ? 'bg-surface-highest text-on-surface-variant'
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {statusLabels[e.status ?? 'draft']}
              </span>
            ),
          },
          {
            key: 'photos',
            header: 'Fotos',
            render: (e) => e.photoCount.toLocaleString(),
          },
          {
            key: 'photographers',
            header: 'Fotógrafos',
            render: (e) => (e.photographerIds?.length ?? 0).toString(),
          },
          {
            key: 'price',
            header: 'Precio base',
            render: (e) => `$${(e.basePrice ?? 0).toFixed(2)}`,
          },
          {
            key: 'actions',
            header: '',
            render: (e) => (
              <div className="flex items-center gap-2 justify-end">
                <Link
                  to={`/admin/eventos/${e.id}`}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                  title="Ver detalle"
                >
                  <Icon name="visibility" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar este evento? Se borrarán también sus fotos y ventas.')) {
                      deleteEvent(e.id)
                    }
                  }}
                  className="p-2 text-on-surface-variant hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Icon name="delete" />
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
