import { useEffect, useRef, useState } from 'react'
import { usePhotographer } from '../../hooks/usePhotographer'
import { useAdmin } from '../../hooks/useAdmin'
import { Select } from '../../components/ui/Select'
import { Icon } from '../../components/ui/Icon'
import { formatPrice } from '../../lib/format'

const MAX_BATCH = 10
const MAX_FILE_MB = 25

type JobState = 'queued' | 'uploading' | 'processing' | 'done' | 'error'

interface UploadJob {
  id: string
  file: File
  previewUrl: string
  state: JobState
  progress: number
  error?: string
}

function shortName(name: string, max = 28) {
  return name.length <= max ? name : `${name.slice(0, max - 3)}…`
}

export function PhotographerPhotosPage() {
  const { photos, events, photographerId } = usePhotographer()
  const admin = useAdmin()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    return () => {
      jobs.forEach((j) => URL.revokeObjectURL(j.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function patchJob(id: string, patch: Partial<UploadJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }

  function selectedEventObj() {
    return events.find((e) => e.id === selectedEvent)
  }

  function buildJobsFromFiles(files: FileList | File[]): UploadJob[] {
    const arr = Array.from(files)
    const accepted: UploadJob[] = []
    let dropped = 0
    for (const file of arr) {
      if (accepted.length >= MAX_BATCH) {
        dropped++
        continue
      }
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        continue
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        state: 'queued',
        progress: 0,
      })
    }
    if (dropped > 0) {
      console.warn(`Se descartaron ${dropped} fotos: el batch máximo es ${MAX_BATCH}.`)
    }
    return accepted
  }

  function handleFiles(files: FileList | File[]) {
    if (!selectedEvent) {
      setJobs([])
      alert('Selecciona un evento antes de subir fotos.')
      return
    }
    const newJobs = buildJobsFromFiles(files)
    setJobs(newJobs)
    void runQueue(newJobs)
  }

  async function runQueue(initialJobs: UploadJob[]) {
    const event = selectedEventObj()
    if (!event) return

    for (const job of initialJobs) {
      patchJob(job.id, { state: 'uploading', progress: 0 })

      // Simular upload con incrementos de progreso (~3s totales).
      for (let pct = 10; pct <= 100; pct += 10) {
        await new Promise((r) => setTimeout(r, 200))
        patchJob(job.id, { progress: pct })
      }

      patchJob(job.id, { state: 'processing', progress: 100 })
      // Simular procesamiento (watermark + preview + embedding).
      await new Promise((r) => setTimeout(r, 1500))

      // 8% de probabilidad de error simulado para mostrar el estado.
      if (Math.random() < 0.08) {
        patchJob(job.id, {
          state: 'error',
          error: 'No pudimos procesar la foto. Reintenta más tarde.',
        })
        continue
      }

      admin.addPhotos([
        {
          eventId: event.id,
          photographerId,
          url: job.previewUrl,
          price: event.basePrice ?? 19.99,
          status: 'published',
          createdAt: new Date().toISOString(),
        },
      ])

      patchJob(job.id, { state: 'done' })
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function clearFinished() {
    setJobs((prev) => {
      const remaining = prev.filter((j) => j.state !== 'done' && j.state !== 'error')
      prev
        .filter((j) => j.state === 'done' || j.state === 'error')
        .forEach((j) => URL.revokeObjectURL(j.previewUrl))
      return remaining
    })
  }

  const queueSummary = jobs.reduce(
    (acc, j) => {
      acc[j.state]++
      return acc
    },
    { queued: 0, uploading: 0, processing: 0, done: 0, error: 0 } as Record<
      JobState,
      number
    >,
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">
          Mis Fotos
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Solo tú puedes ver y subir fotos. No están habilitadas las opciones de
          descarga o borrado.
        </p>
      </div>

      <section className="bg-surface border border-surface-variant p-4 flex flex-col gap-4">
        <Select
          icon="event"
          options={[
            { value: '', label: 'Seleccionar evento' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ]}
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          wrapperClassName="md:max-w-md"
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-primary bg-primary-container/15'
              : 'border-surface-variant hover:border-primary/60'
          }`}
        >
          <Icon name="cloud_upload" className="text-4xl text-primary mb-2" />
          <p className="font-body-md text-body-md text-on-surface">
            Arrastra hasta {MAX_BATCH} fotos aquí o haz click para seleccionar.
          </p>
          <p className="font-caption text-caption text-on-surface-variant mt-1">
            Formatos: JPG/PNG. Máximo {MAX_FILE_MB} MB por foto.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {jobs.length > 0 && (
          <div className="border border-surface-variant p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-3 font-caption text-caption uppercase tracking-widest text-on-surface-variant">
                <span>En cola: {queueSummary.queued}</span>
                <span>Subiendo: {queueSummary.uploading}</span>
                <span>Procesando: {queueSummary.processing}</span>
                <span className="text-primary">OK: {queueSummary.done}</span>
                {queueSummary.error > 0 && (
                  <span className="text-primary-container">
                    Errores: {queueSummary.error}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearFinished}
                className="font-label-bold text-label-bold uppercase tracking-widest text-sm text-on-surface-variant hover:text-primary"
              >
                Limpiar terminadas
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center gap-3 border border-surface-variant px-3 py-2"
                >
                  <img
                    src={job.previewUrl}
                    alt=""
                    className="w-12 h-12 object-cover border border-surface-variant"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface truncate">
                      {shortName(job.file.name)}
                    </p>
                    <div className="h-2 bg-surface-container mt-1">
                      <div
                        className={`h-full transition-all duration-300 ${
                          job.state === 'error'
                            ? 'bg-primary-container'
                            : job.state === 'done'
                              ? 'bg-primary'
                              : 'bg-primary/70'
                        }`}
                        style={{
                          width: `${
                            job.state === 'done' || job.state === 'error'
                              ? 100
                              : job.progress
                          }%`,
                        }}
                      />
                    </div>
                    {job.error && (
                      <p className="font-caption text-caption text-primary-container mt-1">
                        {job.error}
                      </p>
                    )}
                  </div>
                  <span className="font-label-bold text-label-bold uppercase tracking-widest text-xs text-on-surface-variant min-w-[88px] text-right">
                    {job.state === 'queued' && 'En cola'}
                    {job.state === 'uploading' && `Subiendo ${job.progress}%`}
                    {job.state === 'processing' && 'Procesando…'}
                    {job.state === 'done' && (
                      <span className="text-primary">Listo</span>
                    )}
                    {job.state === 'error' && (
                      <span className="text-primary-container">Error</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {(() => {
        const visiblePhotos = selectedEvent
          ? photos.filter((p) => p.eventId === selectedEvent)
          : photos
        if (visiblePhotos.length === 0) {
          return (
            <p className="font-body-md text-body-md text-on-surface-variant py-24 text-center bg-surface border border-surface-variant">
              {selectedEvent
                ? 'No has subido fotos para este evento todavía.'
                : 'Aún no has subido fotos.'}
            </p>
          )
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                {selectedEvent
                  ? `${visiblePhotos.length} ${visiblePhotos.length === 1 ? 'foto' : 'fotos'} del evento`
                  : `${visiblePhotos.length} ${visiblePhotos.length === 1 ? 'foto' : 'fotos'} en total`}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visiblePhotos.map((photo) => (
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
                  {formatPrice(photo.price)}
                </p>
                <span
                  className={`shots-badge mt-2 ${
                    photo.status === 'sold'
                      ? 'bg-primary-container/30 text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {photo.status === 'sold' ? 'Vendida' : 'Publicada'}
                </span>
              </div>
            </div>
          ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
