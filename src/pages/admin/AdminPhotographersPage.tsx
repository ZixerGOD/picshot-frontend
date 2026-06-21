import { useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import type { Photographer } from '../../lib/types'

export function AdminPhotographersPage() {
  const { photographers, events, addPhotographer, updatePhotographer, deletePhotographer } = useAdmin()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    city: '',
    commissionRate: '40',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addPhotographer({
      name: form.name,
      email: form.email,
      phone: '',
      city: form.city,
      joinedAt: new Date().toISOString().split('T')[0],
      isActive: true,
      commissionRate: parseInt(form.commissionRate, 10) || 40,
      eventIds: [],
    })
    setForm({ name: '', email: '', city: '', commissionRate: '40' })
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
            Fotógrafos
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Crea y gestiona el equipo de fotógrafos.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icon name="person_add" />
          Nuevo fotógrafo
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-surface-variant p-6 space-y-4"
        >
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Nuevo fotógrafo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              required
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              required
              placeholder="Ciudad"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              required
              type="number"
              min="0"
              max="100"
              placeholder="Comisión %"
              value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="shots-btn-secondary"
            >
              Cancelar
            </button>
            <Button type="submit">
              <Icon name="save" />
              Guardar
            </Button>
          </div>
        </form>
      )}

      <AdminTable<Photographer>
        rows={photographers}
        emptyMessage="No hay fotógrafos registrados"
        columns={[
          {
            key: 'name',
            header: 'Fotógrafo',
            render: (p) => (
              <div>
                <p className="font-label-bold text-label-bold text-on-surface">{p.name}</p>
                <p className="font-caption text-caption text-on-surface-variant">{p.email}</p>
              </div>
            ),
          },
          { key: 'city', header: 'Ciudad', render: (p) => p.city },
          {
            key: 'events',
            header: 'Eventos',
            render: (p) =>
              p.eventIds?.map((id) => events.find((e) => e.id === id)?.title ?? id).join(', ') ||
              '-',
          },
          {
            key: 'commission',
            header: 'Comisión',
            render: (p) => `${p.commissionRate}%`,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (p) => (
              <button
                type="button"
                onClick={() => updatePhotographer(p.id, { isActive: !p.isActive })}
                className={`shots-badge cursor-pointer ${
                  p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-surface-highest text-on-surface-variant'
                }`}
              >
                {p.isActive ? 'Activo' : 'Inactivo'}
              </button>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar este fotógrafo?')) deletePhotographer(p.id)
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
