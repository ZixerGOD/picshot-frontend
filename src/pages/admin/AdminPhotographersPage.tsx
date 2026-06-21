import { useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { issueToken, TOKEN_PURPOSE } from '../../lib/auth-tokens'
import type { Photographer } from '../../lib/types'

interface InviteResult {
  email: string
  inviteUrl: string
  tempPassword: string
}

function generateTempPassword() {
  return Math.random().toString(36).slice(2, 10) + '!'
}

export function AdminPhotographersPage() {
  const {
    photographers,
    events,
    addPhotographer,
    updatePhotographer,
    deletePhotographer,
  } = useAdmin()
  const [showForm, setShowForm] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    identification: '',
    commissionRate: '40',
    bankName: '',
    accountType: 'ahorros' as 'ahorros' | 'corriente',
    accountNumber: '',
  })

  function reset() {
    setForm({
      name: '',
      email: '',
      phone: '',
      city: '',
      identification: '',
      commissionRate: '40',
      bankName: '',
      accountType: 'ahorros',
      accountNumber: '',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const inviteToken = issueToken(TOKEN_PURPOSE.INVITE, form.email).token
    const tempPassword = generateTempPassword()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    addPhotographer({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      city: form.city,
      joinedAt: new Date().toISOString().split('T')[0],
      isActive: true,
      commissionRate: parseInt(form.commissionRate, 10) || 40,
      eventIds: [],
      identification: form.identification || undefined,
      bank:
        form.bankName && form.accountNumber
          ? {
              bankName: form.bankName,
              accountType: form.accountType,
              accountNumber: form.accountNumber,
            }
          : undefined,
    })
    setInviteResult({
      email: form.email,
      inviteUrl: `${origin}/set-password?token=${inviteToken}`,
      tempPassword,
    })
    reset()
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
          className="bg-surface border border-surface-variant p-6 space-y-6"
        >
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Nuevo fotógrafo
          </h2>

          <fieldset className="space-y-4">
            <legend className="shots-label">Datos personales</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                required
                placeholder="Nombre completo"
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
                placeholder="Teléfono (+593 …)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                required
                placeholder="Cédula o RUC"
                value={form.identification}
                onChange={(e) =>
                  setForm({ ...form, identification: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, commissionRate: e.target.value })
                }
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="shots-label">Datos bancarios para liquidación</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Banco (ej. Pichincha)"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
              <Select
                options={[
                  { value: 'ahorros', label: 'Ahorros' },
                  { value: 'corriente', label: 'Corriente' },
                ]}
                value={form.accountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountType: e.target.value as 'ahorros' | 'corriente',
                  })
                }
              />
              <Input
                placeholder="Número de cuenta"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
              />
            </div>
          </fieldset>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                reset()
              }}
              className="shots-btn-secondary"
            >
              Cancelar
            </button>
            <Button type="submit">
              <Icon name="save" />
              Crear y generar invitación
            </Button>
          </div>
        </form>
      )}

      {inviteResult && (
        <div className="border border-primary/40 bg-primary-container/15 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface uppercase">
              Invitación generada
            </h3>
            <button
              type="button"
              onClick={() => setInviteResult(null)}
              aria-label="Cerrar"
              className="text-on-surface-variant hover:text-primary"
            >
              <Icon name="close" />
            </button>
          </div>
          <p className="font-body-md text-body-md text-on-surface">
            Comparte este enlace con <strong>{inviteResult.email}</strong>. Es
            válido por 7 días y le permite definir su contraseña.
          </p>
          <div className="bg-surface-container-lowest border border-surface-variant p-3 font-body-md text-body-md text-on-surface break-all">
            {inviteResult.inviteUrl}
          </div>
          <p className="font-caption text-caption text-on-surface-variant">
            Contraseña temporal sugerida: <code>{inviteResult.tempPassword}</code>
          </p>
        </div>
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
                <p className="font-label-bold text-label-bold text-on-surface">
                  {p.name}
                </p>
                <p className="font-caption text-caption text-on-surface-variant">
                  {p.email}
                </p>
                {p.identification && (
                  <p className="font-caption text-caption text-on-surface-variant">
                    {p.identification}
                  </p>
                )}
              </div>
            ),
          },
          { key: 'city', header: 'Ciudad', render: (p) => p.city },
          {
            key: 'events',
            header: 'Eventos',
            render: (p) =>
              p.eventIds
                ?.map((id) => events.find((e) => e.id === id)?.title ?? id)
                .join(', ') || '-',
          },
          {
            key: 'commission',
            header: 'Comisión',
            render: (p) => `${p.commissionRate}%`,
          },
          {
            key: 'activity',
            header: 'Actividad',
            render: (p) => (
              <div className="text-xs text-on-surface-variant">
                <p>
                  Último login: {p.lastLoginAt ? p.lastLoginAt.slice(0, 10) : '—'}
                </p>
                <p>
                  Última subida:{' '}
                  {p.lastUploadAt ? p.lastUploadAt.slice(0, 10) : '—'}
                </p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (p) => (
              <button
                type="button"
                onClick={() =>
                  updatePhotographer(p.id, { isActive: !p.isActive })
                }
                className={`shots-badge cursor-pointer ${
                  p.isActive
                    ? 'bg-primary-container/30 text-primary'
                    : 'bg-surface-container text-on-surface-variant'
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
                  if (confirm('¿Eliminar este fotógrafo?'))
                    deletePhotographer(p.id)
                }}
                className="p-2 text-on-surface-variant hover:text-primary-container transition-colors ml-auto block"
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
