import { useState } from 'react'
import { usePhotographer } from '../../hooks/usePhotographer'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'

export function PhotographerPhotosPage() {
  const { photos, events, uploadPhotos } = usePhotographer()
  const [selectedEvent, setSelectedEvent] = useState('')
  const [uploading, setUploading] = useState(false)

  function handleUpload() {
    if (!selectedEvent) {
      alert('Selecciona un evento para subir fotos.')
      return
    }
    setUploading(true)
    setTimeout(() => {
      uploadPhotos(selectedEvent, 4)
      setUploading(false)
    }, 1500)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Mis Fotos</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Solo tú puedes ver y subir fotos. No están habilitadas las opciones de descarga o borrado.
        </p>
      </div>

      <div className="bg-surface border border-surface-variant p-4 flex flex-col md:flex-row gap-4">
        <Select
          icon="event"
          options={[
            { value: '', label: 'Seleccionar evento' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ]}
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          wrapperClassName="flex-1 md:max-w-md"
        />
        <Button onClick={handleUpload} isLoading={uploading}>
          <Icon name="cloud_upload" />
          Subir fotos
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant py-24 text-center bg-surface border border-surface-variant">
          Aún no has subido fotos.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group bg-surface border border-surface-variant">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="p-3">
                <p className="font-caption text-caption text-on-surface-variant truncate">
                  {events.find((e) => e.id === photo.eventId)?.title ?? photo.eventId}
                </p>
                <p className="font-label-bold text-label-bold text-on-surface">
                  €{photo.price.toFixed(2)}
                </p>
                <span
                  className={`shots-badge mt-2 ${
                    photo.status === 'sold'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-surface-highest text-on-surface-variant'
                  }`}
                >
                  {photo.status === 'sold' ? 'Vendida' : 'Publicada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
