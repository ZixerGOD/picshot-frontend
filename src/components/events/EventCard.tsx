import { Link } from 'react-router-dom'
import type { EventItem } from '../../lib/types'
import { Icon } from '../ui/Icon'
import { Badge } from '../ui/Badge'

interface EventCardProps {
  event: EventItem
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="shots-card-event group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {event.isNew && <Badge variant="primary">Nuevo</Badge>}
          <Badge variant="secondary">{event.type}</Badge>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline-md text-headline-md text-on-surface uppercase leading-tight line-clamp-2">
            {event.title}
          </h3>
          <div className="flex items-center gap-4 text-tertiary-container font-body-md text-body-md">
            <span className="flex items-center gap-1">
              <Icon name="calendar_today" className="text-sm" />
              {event.displayDate}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="location_on" className="text-sm" />
              {event.location}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-surface-variant pt-4">
          <span className="font-label-bold text-label-bold text-on-surface-variant flex items-center gap-2">
            <Icon name="photo_library" />
            {event.photoCount.toLocaleString()} Fotos
          </span>
          <Link
            to={`/eventos/${event.id}`}
            className="shots-btn-primary text-center w-full max-w-[160px]"
          >
            Ver galería
          </Link>
        </div>
      </div>
    </article>
  )
}
