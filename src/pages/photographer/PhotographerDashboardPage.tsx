import { Link } from 'react-router-dom'
import { usePhotographer } from '../../hooks/usePhotographer'
import { StatsCard } from '../../components/admin/StatsCard'
import { SimpleBarChart } from '../../components/admin/SimpleBarChart'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'

export function PhotographerDashboardPage() {
  const { photographerName, totalEarnings, totalPhotos, totalSales, sales, events } = usePhotographer()

  const earningsByEvent = events.map((e) => {
    const eventSales = sales.filter((s) => s.eventId === e.id)
    const earnings = eventSales.reduce((sum, s) => sum + s.photographerEarnings, 0)
    return { label: e.title.slice(0, 18), value: Math.round(earnings) }
  })

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
            Hola, {photographerName.split(' ')[0]}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumen de tu actividad en Picshot.
          </p>
        </div>
        <Link to="/fotografo/fotos">
          <Button>
            <Icon name="cloud_upload" />
            Subir fotos
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Tus ganancias"
          value={`$${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="payments"
        />
        <StatsCard label="Tus fotos" value={totalPhotos.toLocaleString()} icon="photo_library" />
        <StatsCard label="Ventas generadas" value={totalSales.toLocaleString()} icon="shopping_cart" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Ganancias por evento
          </h2>
          <SimpleBarChart data={earningsByEvent} valuePrefix="$" />
        </section>

        <section className="bg-surface border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 uppercase">
            Tus eventos asignados
          </h2>
          {events.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No tienes eventos asignados aún.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => {
                const eventSales = sales.filter((s) => s.eventId === e.id)
                const earnings = eventSales.reduce((sum, s) => sum + s.photographerEarnings, 0)
                return (
                  <li key={e.id} className="flex items-center justify-between p-3 bg-surface-container-low">
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface">{e.title}</p>
                      <p className="font-caption text-caption text-on-surface-variant">
                        {e.displayDate} · {e.location}
                      </p>
                    </div>
                    <span className="font-label-bold text-label-bold text-primary">
                      ${earnings.toFixed(2)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
