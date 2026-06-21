import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Icon } from '../ui/Icon'

interface QrPosterModalProps {
  open: boolean
  onClose: () => void
  eventTitle: string
  eventDate: string
  /** URL pública del evento que se codifica en el QR. */
  publicUrl: string
  /** Imágenes sugeridas (banner, cover, fallback). */
  backgrounds: string[]
}

type Position = 'center' | 'bottom' | 'top'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1350 // ratio 4:5 estilo póster vertical

export function QrPosterModal({
  open,
  onClose,
  eventTitle,
  eventDate,
  publicUrl,
  backgrounds,
}: QrPosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [backgroundUrl, setBackgroundUrl] = useState<string>(backgrounds[0] ?? '')
  const [position, setPosition] = useState<Position>('bottom')
  const [showOverlay, setShowOverlay] = useState(true)
  const [rendering, setRendering] = useState(false)

  // Mantener consistencia: si cambian las opciones disponibles, resetear al primero.
  useEffect(() => {
    if (!open) return
    if (!backgroundUrl && backgrounds[0]) setBackgroundUrl(backgrounds[0])
  }, [open, backgrounds, backgroundUrl])

  useEffect(() => {
    if (!open) return
    void render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, backgroundUrl, position, showOverlay, publicUrl])

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

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
      img.src = url
    })
  }

  async function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    setRendering(true)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Fondo base oscuro por si la imagen no carga.
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Imagen de fondo
    if (backgroundUrl) {
      try {
        const bg = await loadImage(backgroundUrl)
        // cover: escala manteniendo aspect y centrado
        const ratio = Math.max(
          canvas.width / bg.width,
          canvas.height / bg.height,
        )
        const drawW = bg.width * ratio
        const drawH = bg.height * ratio
        ctx.drawImage(
          bg,
          (canvas.width - drawW) / 2,
          (canvas.height - drawH) / 2,
          drawW,
          drawH,
        )
      } catch {
        // queda el fondo oscuro
      }
    }

    // Capa oscura para legibilidad
    if (showOverlay) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      if (position === 'bottom') {
        gradient.addColorStop(0, 'rgba(0,0,0,0)')
        gradient.addColorStop(0.55, 'rgba(0,0,0,0.65)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)')
      } else if (position === 'top') {
        gradient.addColorStop(0, 'rgba(0,0,0,0.9)')
        gradient.addColorStop(0.45, 'rgba(0,0,0,0.65)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
      } else {
        gradient.addColorStop(0, 'rgba(0,0,0,0.3)')
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.65)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Tarjeta blanca con el QR
    const qrSize = 520
    const padding = 60
    const cardW = qrSize + padding * 2
    const cardH = qrSize + padding * 2 + 110
    const cardX = (canvas.width - cardW) / 2
    let cardY: number
    if (position === 'top') cardY = 80
    else if (position === 'bottom') cardY = canvas.height - cardH - 80
    else cardY = (canvas.height - cardH) / 2

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cardX, cardY, cardW, cardH)

    // Generar QR en alta resolución
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
    const qrImg = await loadImage(qrDataUrl)
    ctx.drawImage(qrImg, cardX + padding, cardY + padding, qrSize, qrSize)

    // Texto debajo del QR
    ctx.fillStyle = '#0a0a0a'
    ctx.textAlign = 'center'
    ctx.font = '600 30px Inter, system-ui, sans-serif'
    ctx.fillText('ESCANEA Y BUSCA TUS FOTOS', canvas.width / 2, cardY + padding + qrSize + 60)
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#666666'
    ctx.fillText(eventTitle, canvas.width / 2, cardY + padding + qrSize + 95)

    // Marca PICSHOT arriba (en la zona del overlay si el QR está abajo, y viceversa)
    if (position !== 'top') {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = '900 56px Montserrat, system-ui, sans-serif'
      ctx.fillText('PICSHOT', canvas.width / 2, 100)
      ctx.font = '500 28px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(eventTitle.toUpperCase(), canvas.width / 2, 145)
      ctx.font = '400 22px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(eventDate, canvas.width / 2, 178)
    }

    setRendering(false)
  }

  function handlePickFile() {
    fileRef.current?.click()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    setBackgroundUrl(url)
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `picshot-qr-${eventTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      },
      'image/jpeg',
      0.92,
    )
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl bg-surface-container-lowest border border-surface-variant max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-variant sticky top-0 bg-surface-container-lowest z-10">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
              Generar póster con QR
            </h2>
            <p className="font-caption text-caption text-on-surface-variant mt-1">
              Componemos una imagen lista para imprimir o compartir. Al
              escanear, el participante llega directo al evento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-on-surface-variant hover:text-primary"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
          <div className="p-4 bg-surface-container flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-surface-variant shadow-xl"
              style={{ aspectRatio: '4 / 5', maxHeight: '60vh' }}
            />
          </div>

          <aside className="p-5 border-t md:border-t-0 md:border-l border-surface-variant flex flex-col gap-5">
            <div>
              <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs mb-2">
                Imagen de fondo
              </p>
              <div className="grid grid-cols-3 gap-2">
                {backgrounds.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => setBackgroundUrl(url)}
                    className={`relative aspect-square overflow-hidden border-2 transition-colors ${
                      backgroundUrl === url
                        ? 'border-primary'
                        : 'border-surface-variant hover:border-primary/40'
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePickFile}
                  className="aspect-square border-2 border-dashed border-surface-variant text-on-surface-variant flex flex-col items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Icon name="add_photo_alternate" />
                  <span className="font-caption text-caption mt-1">Subir</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>

            <div>
              <p className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest text-xs mb-2">
                Posición del QR
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'top', icon: 'vertical_align_top' },
                    { value: 'center', icon: 'vertical_align_center' },
                    { value: 'bottom', icon: 'vertical_align_bottom' },
                  ] as { value: Position; icon: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPosition(opt.value)}
                    className={`inline-flex flex-col items-center justify-center gap-1 border py-3 transition-colors ${
                      position === opt.value
                        ? 'border-primary text-primary bg-primary-container/15'
                        : 'border-surface-variant text-on-surface-variant hover:text-on-surface hover:border-primary/40'
                    }`}
                  >
                    <Icon name={opt.icon} />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
              />
              <span>Capa oscura para legibilidad</span>
            </label>

            <div className="border border-surface-variant p-3">
              <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                Enlace del QR
              </p>
              <p className="font-body-md text-body-md text-on-surface break-all mt-1">
                {publicUrl}
              </p>
            </div>

            <button
              type="button"
              onClick={download}
              disabled={rendering}
              className="shots-btn-primary py-3 justify-center disabled:opacity-60"
            >
              <Icon name="download" />
              {rendering ? 'Generando…' : 'Descargar JPG'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
