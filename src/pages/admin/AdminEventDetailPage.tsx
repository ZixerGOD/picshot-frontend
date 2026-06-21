import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import { AdminTable } from '../../components/admin/AdminTable'
import { PackEditor } from '../../components/admin/PackEditor'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import {
  buildPackDrafts,
  draftsToPacks,
  unitPriceFromPacks,
  type PackDraft,
} from '../../lib/packs'
import type { Coupon, PhotoPack, Sale } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { QrPosterModal } from '../../components/admin/QrPosterModal'

const tabs = [
  { id: 'info', label: 'Información' },
  { id: 'photos', label: 'Fotos' },
  { id: 'photographers', label: 'Fotógrafos' },
  { id: 'coupons', label: 'Cupones' },
  { id: 'sales', label: 'Ventas' },
] as const

type Tab = (typeof tabs)[number]['id']

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  closed: 'Cerrado',
}

export function AdminEventDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const {
    events,
    photographers,
    coupons,
    photos,
    updateEvent,
    deleteEvent,
    assignPhotographerToEvent,
    removePhotographerFromEvent,
    getEventSales,
  } = useAdmin()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [selectedPhotographer, setSelectedPhotographer] = useState('')
  const [headerPosterOpen, setHeaderPosterOpen] = useState(false)

  const event = useMemo(() => events.find((e) => e.id === eventId), [events, eventId])

  const eventPhotos = useMemo(() => photos.filter((p) => p.eventId === eventId), [photos, eventId])
  const eventCoupons = useMemo(() => coupons.filter((c) => c.eventId === eventId), [coupons, eventId])
  const eventSales = useMemo(() => getEventSales(eventId), [getEventSales, eventId])

  const availablePhotographers = useMemo(
    () => photographers.filter((p) => !event?.photographerIds?.includes(p.id)),
    [photographers, event],
  )

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="font-body-md text-body-md text-on-surface-variant">Evento no encontrado</p>
        <Link to="/admin/eventos" className="shots-btn-primary mt-4 inline-flex">
          Volver
        </Link>
      </div>
    )
  }

  const totalRevenue = eventSales.reduce((sum, s) => sum + s.finalAmount, 0)

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate('/admin/eventos')}
        className="flex items-center gap-2 font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <Icon name="arrow_back" />
        Volver a eventos
      </button>

      <header className="bg-surface border border-surface-variant p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span
                className={`shots-badge ${
                  event.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : event.status === 'closed'
                      ? 'bg-surface-highest text-on-surface-variant'
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {statusLabels[event.status ?? 'draft']}
              </span>
              <span className="font-caption text-caption text-on-surface-variant uppercase">
                {event.type}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
              {event.title}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {event.displayDate} · {event.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const next = event.status === 'active' ? 'closed' : 'active'
                updateEvent(event.id, { status: next })
              }}
              className="shots-btn-outline"
            >
              {event.status === 'active' ? 'Cerrar evento' : 'Activar evento'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Eliminar este evento?')) {
                  deleteEvent(event.id)
                  navigate('/admin/eventos')
                }
              }}
              className="shots-btn-outline border-primary-container/40 text-primary-container hover:bg-primary-container/15 hover:border-primary-container hover:text-primary-container"
            >
              <Icon name="delete" />
              Eliminar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-surface-variant">
          <div>
            <p className="font-caption text-caption text-on-surface-variant uppercase">Fotos</p>
            <p className="font-headline-md text-headline-md text-on-surface">
              {(eventPhotos.length + event.photoCount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-caption text-caption text-on-surface-variant uppercase">Ventas</p>
            <p className="font-headline-md text-headline-md text-on-surface">
              {eventSales.length.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-caption text-caption text-on-surface-variant uppercase">Ingresos</p>
            <p className="font-headline-md text-headline-md text-on-surface">
              ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="font-caption text-caption text-on-surface-variant uppercase">
              Precio base
            </p>
            <p className="font-headline-md text-headline-md text-on-surface">
              ${(event.basePrice ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-surface-variant flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-label-bold text-label-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="bg-surface border border-surface-variant p-6 md:p-8 space-y-6 min-w-0">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
              Información general
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="shots-label">Nombre</label>
                <Input
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="shots-label">Ciudad</label>
                <Input
                  value={event.location}
                  onChange={(e) => updateEvent(event.id, { location: e.target.value })}
                />
              </div>
              <div>
                <label className="shots-label">Precio base</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={event.basePrice ?? ''}
                  onChange={(e) => updateEvent(event.id, { basePrice: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="shots-label">Participantes estimados</label>
                <Input
                  type="number"
                  min="0"
                  value={event.runnerCount ?? ''}
                  onChange={(e) =>
                    updateEvent(event.id, { runnerCount: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            </div>

            <EventPacksSection
              key={event.id}
              packs={event.packs}
              basePrice={event.basePrice}
              onSave={(packs) =>
                updateEvent(event.id, { packs, basePrice: unitPriceFromPacks(packs) })
              }
            />
          </section>

          <aside className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <ShareEventBlock
              eventId={event.id}
              eventTitle={event.title}
              onGenerateQr={() => setHeaderPosterOpen(true)}
            />
          </aside>
        </div>
      )}

      {activeTab === 'photos' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
              Fotos del evento
            </h2>
            <Link to="/admin/fotos">
              <Button variant="outline">
                <Icon name="photo_library" />
                Gestionar fotos
              </Button>
            </Link>
          </div>
          {eventPhotos.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant py-12 text-center bg-surface border border-surface-variant">
              No hay fotos subidas para este evento.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {eventPhotos.slice(0, 12).map((photo) => (
                <div key={photo.id} className="aspect-[4/3] bg-surface border border-surface-variant">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'photographers' && (
        <section className="space-y-6">
          <div className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
            <Select
              icon="people"
              options={[
                { value: '', label: 'Seleccionar fotógrafo' },
                ...availablePhotographers.map((p) => ({ value: p.id, label: `${p.name} (${p.city})` })),
              ]}
              value={selectedPhotographer}
              onChange={(e) => setSelectedPhotographer(e.target.value)}
              wrapperClassName="flex-1"
            />
            <Button
              onClick={() => {
                if (selectedPhotographer) {
                  assignPhotographerToEvent(selectedPhotographer, event.id)
                  setSelectedPhotographer('')
                }
              }}
              disabled={!selectedPhotographer}
            >
              <Icon name="person_add" />
              Asignar
            </Button>
          </div>

          <AdminTable
            rows={photographers.filter((p) => event.photographerIds?.includes(p.id))}
            emptyMessage="No hay fotógrafos asignados"
            columns={[
              {
                key: 'name',
                header: 'Fotógrafo',
                render: (p) => (
                  <Link to="/admin/fotografos" className="text-primary hover:underline">
                    {p.name}
                  </Link>
                ),
              },
              { key: 'city', header: 'Ciudad', render: (p) => p.city },
              {
                key: 'commission',
                header: 'Comisión',
                render: (p) => `${p.commissionRate}%`,
              },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <button
                    type="button"
                    onClick={() => removePhotographerFromEvent(p.id, event.id)}
                    className="p-2 text-on-surface-variant hover:text-red-400 transition-colors ml-auto block"
                  >
                    <Icon name="person_remove" />
                  </button>
                ),
              },
            ]}
          />
        </section>
      )}

      {activeTab === 'coupons' && (
        <section>
          <AdminTable<Coupon>
            rows={eventCoupons}
            emptyMessage="No hay cupones para este evento"
            columns={[
              { key: 'code', header: 'Código', render: (c) => c.code },
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
                key: 'status',
                header: 'Estado',
                render: (c) => (
                  <span
                    className={`shots-badge ${
                      c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-surface-highest text-on-surface-variant'
                    }`}
                  >
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                ),
              },
            ]}
          />
        </section>
      )}

      {activeTab === 'sales' && (
        <section>
          <AdminTable<Sale>
            rows={eventSales.slice(0, 50)}
            emptyMessage="No hay ventas para este evento"
            columns={[
              { key: 'id', header: 'Venta', render: (s) => s.id },
              {
                key: 'buyer',
                header: 'Comprador',
                render: (s) => s.buyerEmail,
              },
              {
                key: 'amount',
                header: 'Monto',
                render: (s) => `$${s.finalAmount.toFixed(2)}`,
              },
              {
                key: 'date',
                header: 'Fecha',
                render: (s) => formatDate(s.createdAt),
              },
            ]}
          />
        </section>
      )}

      <QrPosterModal
        open={headerPosterOpen}
        onClose={() => setHeaderPosterOpen(false)}
        eventTitle={event.title}
        eventDate={event.displayDate}
        publicUrl={
          typeof window !== 'undefined'
            ? `${window.location.origin}/eventos/${event.id}`
            : `/eventos/${event.id}`
        }
        backgrounds={[event.bannerImage, event.coverPhoto, event.image].filter(
          (u): u is string => Boolean(u),
        )}
      />
    </div>
  )
}

interface EventPacksSectionProps {
  packs: PhotoPack[] | undefined
  basePrice: number | undefined
  onSave: (packs: PhotoPack[]) => void
}

/** Editor de packs aislado (se remonta por evento con `key`), evita sincronizar estado por efecto. */
function EventPacksSection({ packs, basePrice, onSave }: EventPacksSectionProps) {
  const [drafts, setDrafts] = useState<PackDraft[]>(() =>
    buildPackDrafts(packs, basePrice ?? 19.99),
  )
  const [saved, setSaved] = useState(false)

  function save() {
    const next = draftsToPacks(drafts)
    if (next.length === 0) return
    onSave(next)
    setSaved(true)
  }

  return (
    <div className="pt-6 border-t border-surface-variant">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-headline-md text-[20px] text-on-surface uppercase">Packs de venta</h3>
        {saved && (
          <span className="flex items-center gap-1 font-caption text-caption text-green-500">
            <Icon name="check_circle" className="text-base" />
            Guardado
          </span>
        )}
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mb-4">
        Configura los packs y su precio. El precio de la «Unidad» define el precio por foto.
      </p>
      <PackEditor
        value={drafts}
        onChange={(next) => {
          setDrafts(next)
          setSaved(false)
        }}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={save}>
          <Icon name="save" />
          Guardar packs
        </Button>
      </div>
    </div>
  )
}

/**
 * Bloque 'Compartir evento' (business-rules.md:41): muestra la URL pública
 * y un QR generado por servicio externo (api.qrserver.com) como mock.
 * En producción se reemplaza por una librería local o un endpoint propio.
 */
function ShareEventBlock({
  eventId,
  eventTitle,
  onGenerateQr,
}: {
  eventId: string
  eventTitle: string
  onGenerateQr: () => void
}) {
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/eventos/${eventId}`
      : `/eventos/${eventId}`
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareNative() {
    if (navigator.share) {
      navigator
        .share({ title: eventTitle, url: publicUrl })
        .catch(() => {})
    } else {
      copy()
    }
  }

  return (
    <div className="bg-surface border border-surface-variant overflow-hidden">
      {/* CTA principal: imprimir/publicar póster */}
      <div className="p-5 bg-gradient-to-br from-primary-container/15 via-surface to-surface border-b border-surface-variant">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
            <Icon name="qr_code_2" className="text-2xl" />
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Comparte el evento
            </h3>
            <p className="font-caption text-caption text-on-surface-variant mt-1">
              Genera un póster con QR para imprimirlo o publicarlo en redes.
              Al escanear, el participante llega directo a la galería.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onGenerateQr}
          className="shots-btn-primary w-full justify-center py-3"
        >
          <Icon name="qr_code_2" />
          Generar póster con QR
        </button>
      </div>

      {/* Acción secundaria: enlace público */}
      <div className="p-5 space-y-3">
        <div>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">
            Enlace público
          </p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="shots-input flex-1 min-w-0 text-xs"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={copy}
              aria-label="Copiar enlace"
              title={copied ? 'Copiado' : 'Copiar enlace'}
              className="p-2 border border-surface-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors shrink-0"
            >
              <Icon name={copied ? 'check' : 'content_copy'} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={shareNative}
          className="w-full inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest px-3 py-2 text-xs hover:border-primary hover:text-primary transition-colors"
        >
          <Icon name="share" />
          Compartir enlace
        </button>
      </div>
    </div>
  )
}
