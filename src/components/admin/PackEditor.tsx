import { PACK_CATALOG, type PackDraft } from '../../lib/packs'
import { Icon } from '../ui/Icon'

interface PackEditorProps {
  value: PackDraft[]
  onChange: (next: PackDraft[]) => void
}

/** Editor de packs de venta: el admin habilita cada pack y fija su precio. */
export function PackEditor({ value, onChange }: PackEditorProps) {
  function update(key: string, patch: Partial<PackDraft>) {
    onChange(value.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  return (
    <div className="space-y-3">
      {value.map((draft) => {
        const meta = PACK_CATALOG.find((p) => p.key === draft.key)!
        return (
          <div
            key={draft.key}
            className={`flex items-center gap-4 border p-4 transition-colors ${
              draft.enabled
                ? 'border-primary-container bg-surface-container-low'
                : 'border-surface-variant'
            }`}
          >
            <button
              type="button"
              onClick={() => update(draft.key, { enabled: !draft.enabled })}
              className="shrink-0"
              aria-label={draft.enabled ? `Desactivar ${meta.label}` : `Activar ${meta.label}`}
            >
              <Icon
                name={draft.enabled ? 'check_box' : 'check_box_outline_blank'}
                className={`text-2xl ${draft.enabled ? 'text-primary' : 'text-on-surface-variant'}`}
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider">
                {meta.label}
              </p>
              <p className="font-caption text-caption text-on-surface-variant">
                {meta.quantity === null
                  ? 'Acceso a todas las fotos del evento'
                  : `${meta.quantity} foto${meta.quantity > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="relative w-32 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!draft.enabled}
                value={draft.price}
                onChange={(e) => update(draft.key, { price: e.target.value })}
                placeholder="0.00"
                className="shots-input pl-7 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
