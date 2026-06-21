import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Icon } from '../../components/ui/Icon'
import { PackEditor } from '../../components/admin/PackEditor'
import { img } from '../../lib/images'
import { buildPackDrafts, draftsToPacks, unitPriceFromPacks } from '../../lib/packs'

const typeOptions = [
  { value: 'Maratón', label: 'Maratón' },
  { value: 'Ciclismo', label: 'Ciclismo' },
  { value: 'Triatlón', label: 'Triatlón' },
  { value: 'MTB', label: 'MTB' },
  { value: 'Otro', label: 'Otro' },
]

function formatDisplayDate(dateString: string): string {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ]
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`
}

export function AdminEventCreatePage() {
  const { addEvent } = useAdmin()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    type: 'Maratón',
    runnerCount: '',
  })
  const [packDrafts, setPackDrafts] = useState(() => buildPackDrafts(undefined, 19.99))
  const [packError, setPackError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const packs = draftsToPacks(packDrafts)
    if (packs.length === 0) {
      setPackError('Activa al menos un pack de venta.')
      return
    }
    setPackError('')
    setSaving(true)
    setTimeout(() => {
      addEvent({
        title: form.title,
        date: form.date,
        displayDate: formatDisplayDate(form.date),
        location: form.location,
        type: form.type,
        image: img('shots-ciudad', 1600, 900),
        photoCount: 0,
        runnerCount: parseInt(form.runnerCount, 10) || 0,
        status: 'draft',
        basePrice: unitPriceFromPacks(packs),
        packs,
        photographerIds: [],
      })
      setSaving(false)
      navigate('/admin/eventos')
    }, 600)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button
        type="button"
        onClick={() => navigate('/admin/eventos')}
        className="flex items-center gap-2 font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <Icon name="arrow_back" />
        Volver a eventos
      </button>

      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
          Crear evento
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Completa la información básica del nuevo evento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-surface-variant p-6 md:p-8 space-y-6">
        <div>
          <label className="shots-label">Nombre del evento</label>
          <Input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej. Maratón de Sevilla 2025"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="shots-label">Fecha</label>
            <Input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="shots-label">Ciudad / Ubicación</label>
            <Input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ej. Sevilla"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="shots-label">Tipo de evento</label>
            <Select
              options={typeOptions}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>
          <div>
            <label className="shots-label">Número aproximado de participantes</label>
            <Input
              type="number"
              min="0"
              value={form.runnerCount}
              onChange={(e) => setForm({ ...form, runnerCount: e.target.value })}
              placeholder="Ej. 5000"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-surface-variant">
          <label className="shots-label mt-6">Packs de venta</label>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Activa los packs que ofrecerás y fija el precio de cada uno. El precio de la
            «Unidad» se usa como precio por foto del evento.
          </p>
          <PackEditor value={packDrafts} onChange={setPackDrafts} />
          {packError && (
            <p className="flex items-center gap-2 font-caption text-caption text-error mt-3">
              <Icon name="error" className="text-base" />
              {packError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-surface-variant">
          <button
            type="button"
            onClick={() => navigate('/admin/eventos')}
            className="shots-btn-secondary"
          >
            Cancelar
          </button>
          <Button type="submit" isLoading={saving}>
            <Icon name="save" />
            Guardar evento
          </Button>
        </div>
      </form>
    </div>
  )
}
