import { useEffect, useRef, useState } from 'react'
import { usePhotographer } from '../../hooks/usePhotographer'
import { useAdmin } from '../../hooks/useAdmin'
import { Select } from '../../components/ui/Select'
import { Icon } from '../../components/ui/Icon'
import { formatPrice } from '../../lib/format'

const MAX_BATCH = 10
const MAX_FILE_MB = 30
const MIN_LONG_SIDE_PX = 1920

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

function fingerprintFor(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`
}

export function PhotographerPhotosPage() {
  const { photos, events, photographerId } = usePhotographer()
  const admin = useAdmin()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [dragging, setDragging] = useState(false)
  const [pendingJobs, setPendingJobs] = useState<UploadJob[] | null>(null)
  const [summary, setSummary] = useState<{
    total: number
    ok: number
    failed: string[]
  } | null>(null)
  const uploadedFingerprintsRef = useRef<Map<string, Set<string>>>(new Map())

  useEffect(() => {
    return () => {
      jobs.forEach((j) => URL.revokeObjectURL(j.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aviso "no salgas de la página durante la subida" mientras hay trabajos
  // pendientes en cola/proceso (business-rules.md:93-95).
  const hasActiveUploads = jobs.some(
    (j) => j.state === 'queued' || j.state === 'uploading' || j.state === 'processing',
  )
  useEffect(() => {
    if (!hasActiveUploads) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasActiveUploads])

  function patchJob(id: string, patch: Partial<UploadJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }

  function selectedEventObj() {
    return events.find((e) => e.id === selectedEvent)
  }

  function measureImage(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('No pudimos leer la imagen.'))
      }
      img.src = url
    })
  }

  async function buildJobsFromFiles(files: FileList | File[]): Promise<UploadJob[]> {
    const arr = Array.from(files)
    const accepted: UploadJob[] = []
    const warnings: string[] = []
    const seenInBatch = new Set<string>()
    const eventFingerprints =
      uploadedFingerprintsRef.current.get(selectedEvent) ?? new Set<string>()

    for (const file of arr) {
      if (accepted.length >= MAX_BATCH) {
        warnings.push(`Solo procesamos las primeras ${MAX_BATCH} fotos.`)
        break
      }
      // HEIC suele venir como image/heic o sin tipo desde iPhone
      if (file.type === 'image/heic' || /\.heic$/i.test(file.name)) {
        warnings.push(`${file.name} es HEIC. Exporta como JPEG antes de subir.`)
        continue
      }
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        warnings.push(`${file.name} supera ${MAX_FILE_MB} MB.`)
        continue
      }
      const fp = fingerprintFor(file)
      if (eventFingerprints.has(fp)) {
        warnings.push(`${file.name} ya fue subida a este evento.`)
        continue
      }
      if (seenInBatch.has(fp)) {
        warnings.push(`${file.name} aparece dos veces en esta selección.`)
        continue
      }
      try {
        const { width, height } = await measureImage(file)
        if (Math.max(width, height) < MIN_LONG_SIDE_PX) {
          warnings.push(
            `${file.name} tiene ${Math.max(width, height)} px. Necesitamos al menos ${MIN_LONG_SIDE_PX} px en el lado más largo (Full HD).`,
          )
          continue
        }
      } catch {
        warnings.push(`${file.name} no pudo abrirse.`)
        continue
      }
      seenInBatch.add(fp)
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        state: 'queued',
        progress: 0,
      })
    }
    if (warnings.length > 0) {
      window.alert(warnings.join('\n'))
    }
    return accepted
  }

  async function handleFiles(files: FileList | File[]) {
    if (!selectedEvent) {
      setJobs([])
      alert('Selecciona un evento antes de subir fotos.')
      return
    }
    const newJobs = await buildJobsFromFiles(files)
    if (newJobs.length === 0) return
    setSummary(null)
    setPendingJobs(newJobs)
  }

  function confirmPendingJobs() {
    if (!pendingJobs) return
    const jobsToRun = pendingJobs
    setPendingJobs(null)
    setJobs(jobsToRun)
    void runQueue(jobsToRun)
  }

  function cancelPendingJobs() {
    pendingJobs?.forEach((j) => URL.revokeObjectURL(j.previewUrl))
    setPendingJobs(null)
  }

  async function runQueue(initialJobs: UploadJob[]) {
    const event = selectedEventObj()
    if (!event) return

    const failed: string[] = []
    let ok = 0

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
        failed.push(job.file.name)
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

      const fpSet =
        uploadedFingerprintsRef.current.get(event.id) ?? new Set<string>()
      fpSet.add(fingerprintFor(job.file))
      uploadedFingerprintsRef.current.set(event.id, fpSet)

      patchJob(job.id, { state: 'done' })
      ok++
    }

    setSummary({ total: initialJobs.length, ok, failed })
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

      {hasActiveUploads && (
        <div className="sticky top-16 lg:top-0 z-30 -mx-4 lg:mx-0 px-4 py-3 bg-primary-container text-on-primary-container flex items-center gap-3 border-y border-primary">
          <Icon name="warning" />
          <p className="font-label-bold text-label-bold uppercase tracking-widest text-xs">
            No cierres esta pestaña mientras subimos tus fotos.
          </p>
        </div>
      )}

      {summary && (
        <div className="border border-surface-variant bg-surface-container-lowest p-4">
          <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest">
            Subida terminada · {summary.ok} de {summary.total} listas
          </p>
          {summary.failed.length > 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Fallaron {summary.failed.length}:{' '}
              {summary.failed.slice(0, 3).join(', ')}
              {summary.failed.length > 3 && '…'}
            </p>
          ) : (
            <p className="font-body-md text-body-md text-primary mt-1">
              Todas se procesaron correctamente.
            </p>
          )}
        </div>
      )}

      {pendingJobs && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
        >
          <div className="w-full max-w-lg bg-surface-container-lowest border border-surface-variant p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
                Revisa antes de subir
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {pendingJobs.length}{' '}
                {pendingJobs.length === 1 ? 'foto' : 'fotos'} para el evento.
                Una vez subidas no podrás modificarlas ni borrarlas; contacta
                con Admin si necesitas corregir algo.
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {pendingJobs.map((j) => (
                <img
                  key={j.id}
                  src={j.previewUrl}
                  alt=""
                  className="w-full h-20 object-cover border border-surface-variant"
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={cancelPendingJobs}
                className="flex-1 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest py-3 hover:border-primary hover:text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPendingJobs}
                className="flex-1 shots-btn-primary py-3 justify-center"
              >
                <Icon name="cloud_upload" />
                Subir {pendingJobs.length}{' '}
                {pendingJobs.length === 1 ? 'foto' : 'fotos'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            Formatos: JPG/PNG. Máximo {MAX_FILE_MB} MB por foto. Mínimo{' '}
            {MIN_LONG_SIDE_PX} px en el lado más largo (Full HD).
          </p>
          <p className="font-caption text-caption text-on-surface-variant mt-1">
            Si disparas con iPhone, exporta tus fotos como JPEG antes de
            subirlas (no aceptamos HEIC).
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
