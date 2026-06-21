import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'

type CaptureState =
  | 'requesting'
  | 'camera'
  | 'scanning'
  | 'searching'
  | 'error'

interface SelfieError {
  code?: string
  message?: string
}

interface SelfieSearchModalProps {
  open: boolean
  onClose: () => void
  onSearch: (selfie: Blob) => Promise<void>
  initialFile?: File | null
}

const SCAN_THEATER_MS = 2400

function describeError(err: SelfieError | null): string {
  if (!err) return 'Hubo un problema procesando la selfie.'
  if (err.code === 'NO_FACE_DETECTED') {
    return 'No detectamos tu rostro. Inténtalo de frente y con buena iluminación.'
  }
  if (err.code === 'MULTIPLE_FACES_DETECTED') {
    return 'Detectamos más de un rostro. Asegúrate de estar solo en el encuadre.'
  }
  if (err.code === 'CAMERA_DENIED') {
    return 'No pudimos acceder a la cámara. Revisa los permisos del navegador o sube una selfie.'
  }
  return err.message || 'Hubo un problema procesando la selfie.'
}

export function SelfieSearchModal({
  open,
  onClose,
  onSearch,
  initialFile,
}: SelfieSearchModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CaptureState>('requesting')
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [error, setError] = useState<SelfieError | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const runSearch = useCallback(
    async (selfie: Blob) => {
      setState('searching')
      try {
        await onSearch(selfie)
        onClose()
      } catch (err) {
        setError(err as SelfieError)
        setState('error')
      }
    },
    [onSearch, onClose],
  )

  const startCamera = useCallback(async () => {
    setError(null)
    setCapturedUrl(null)
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 540 },
        },
        audio: false,
      })
      streamRef.current = stream
      setState('camera')
      requestAnimationFrame(() => {
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.play().catch(() => {})
      })
    } catch {
      setError({ code: 'CAMERA_DENIED' })
      setState('error')
    }
  }, [])

  const consumeInitialFile = useCallback(
    async (file: File) => {
      setError(null)
      setCapturedUrl(URL.createObjectURL(file))
      setState('scanning')
      await new Promise((r) => setTimeout(r, SCAN_THEATER_MS))
      await runSearch(file)
    },
    [runSearch],
  )

  useEffect(() => {
    if (!open) return
    if (initialFile) {
      consumeInitialFile(initialFile)
    } else {
      startCamera()
    }
    return () => {
      stopStream()
    }
  }, [open, initialFile, startCamera, consumeInitialFile, stopStream])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 540
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    stopStream()
    setCapturedUrl(canvas.toDataURL('image/jpeg', 0.92))
    setState('scanning')

    await new Promise((r) => setTimeout(r, SCAN_THEATER_MS))

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError({ message: 'No pudimos generar la imagen.' })
          setState('error')
          return
        }
        await runSearch(blob)
      },
      'image/jpeg',
      0.92,
    )
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="selfie-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-surface-container-lowest border border-surface-variant shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="close" />
        </button>

        <div className="px-6 pt-6 pb-2 text-center">
          <h2
            id="selfie-modal-title"
            className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight"
          >
            Encuéntrate en el evento
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Mira a la cámara, centra tu rostro y captura.
          </p>
        </div>

        <div className="px-6 pt-4">
          <div className="relative aspect-[4/3] overflow-hidden border border-surface-variant bg-surface-container">
            {state === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                <Icon name="autorenew" className="text-2xl text-primary animate-spin" />
                <p className="font-caption text-caption uppercase tracking-widest">
                  Solicitando cámara…
                </p>
              </div>
            )}

            {state === 'camera' && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="border-2 border-dashed border-primary/70 w-[46%] h-[86%]"
                    style={{ borderRadius: '50% 50% 48% 48% / 60% 60% 40% 40%' }}
                  />
                </div>
              </>
            )}

            {(state === 'scanning' || state === 'searching') && capturedUrl && (
              <>
                <img
                  src={capturedUrl}
                  alt="Selfie capturada"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {state === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="shots-laser-line animate-scan" />
                    <div className="absolute inset-0 border-2 border-primary/30" />
                  </div>
                )}
                {state === 'searching' && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                    <Icon
                      name="autorenew"
                      className="text-2xl text-primary animate-spin-slow"
                    />
                    <p className="font-caption text-caption text-primary uppercase tracking-widest">
                      Buscando coincidencias…
                    </p>
                  </div>
                )}
              </>
            )}

            {state === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center">
                <Icon name="error" className="text-3xl text-primary-container" />
                <p className="font-body-md text-body-md text-on-surface">
                  {describeError(error)}
                </p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="px-6 pt-4 pb-6">
          {state === 'camera' && (
            <button
              type="button"
              onClick={handleCapture}
              className="shots-btn-primary w-full justify-center py-3"
            >
              <Icon name="camera" />
              Capturar selfie
            </button>
          )}

          {state === 'scanning' && (
            <p className="text-center font-caption text-caption text-on-surface-variant uppercase tracking-widest animate-pulse">
              Analizando rasgos faciales…
            </p>
          )}

          {state === 'searching' && (
            <p className="text-center font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Espera un momento…
            </p>
          )}

          {state === 'error' && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full inline-flex items-center justify-center gap-2 border border-surface-variant text-on-surface font-label-bold text-label-bold uppercase tracking-widest py-3 hover:border-primary hover:text-primary transition-colors"
            >
              <Icon name="autorenew" />
              Reintentar
            </button>
          )}

          {state === 'requesting' && (
            <p className="text-center font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Acepta el permiso del navegador.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
