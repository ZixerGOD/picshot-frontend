import { useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Coupon } from '../../lib/types'

export function AdminCouponsPage() {
  const { events, coupons, addCoupon, updateCoupon, deleteCoupon } = useAdmin()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    code: string
    eventId: string
    discountType: 'percentage' | 'fixed'
    discountValue: string
    maxUses: string
    validFrom: string
    validUntil: string
  }>({
    code: '',
    eventId: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addCoupon({
      code: form.code.toUpperCase(),
      eventId: form.eventId || undefined,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      maxUses: parseInt(form.maxUses, 10) || 0,
      usedCount: 0,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      isActive: true,
    })
    setForm({
      code: '',
      eventId: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Cupones</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Tickets de descuento por evento con límite de uso.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icon name="local_offer" />
          Nuevo cupón
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-surface-variant p-6 space-y-4"
        >
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
            Nuevo cupón
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              required
              placeholder="Código"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Select
              options={[
                { value: '', label: 'Todos los eventos' },
                ...events.map((e) => ({ value: e.id, label: e.title })),
              ]}
              value={form.eventId}
              onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            />
            <Select
              options={[
                { value: 'percentage', label: 'Porcentaje %' },
                { value: 'fixed', label: 'Monto fijo $' },
              ]}
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              required
              type="number"
              min="0"
              step={form.discountType === 'percentage' ? '1' : '0.01'}
              placeholder={form.discountType === 'percentage' ? 'Descuento %' : 'Descuento $'}
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
            <Input
              required
              type="number"
              min="1"
              placeholder="Máximo de usos"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            />
            <Input
              required
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            />
            <Input
              required
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
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
              Crear cupón
            </Button>
          </div>
        </form>
      )}

      <AdminTable<Coupon>
        rows={coupons}
        emptyMessage="No hay cupones registrados"
        columns={[
          { key: 'code', header: 'Código', render: (c) => c.code },
          {
            key: 'event',
            header: 'Evento',
            render: (c) => events.find((e) => e.id === c.eventId)?.title ?? 'Todos',
          },
          {
            key: 'discount',
            header: 'Descuento',
            render: (c) =>
              c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`,
          },
          {
            key: 'uses',
            header: 'Usos',
            render: (c) => `${c.usedCount}/${c.maxUses}`,
          },
          {
            key: 'valid',
            header: 'Vigencia',
            render: (c) => `${c.validFrom} → ${c.validUntil}`,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (c) => (
              <button
                type="button"
                onClick={() => updateCoupon(c.id, { isActive: !c.isActive })}
                className={`shots-badge cursor-pointer ${
                  c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-surface-highest text-on-surface-variant'
                }`}
              >
                {c.isActive ? 'Activo' : 'Inactivo'}
              </button>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (c) => (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar este cupón?')) deleteCoupon(c.id)
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
