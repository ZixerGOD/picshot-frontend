import { useCallback, useEffect, useRef, useState } from 'react'
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

  const render = useCallback(async () => {
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
        // QR abajo → oscurecer arriba donde va la marca
        gradient.addColorStop(0, 'rgba(0,0,0,0.85)')
        gradient.addColorStop(0.35, 'rgba(0,0,0,0.45)')
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.25)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
      } else if (position === 'top') {
        // QR arriba → oscurecer abajo
        gradient.addColorStop(0, 'rgba(0,0,0,0.5)')
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.25)')
        gradient.addColorStop(0.65, 'rgba(0,0,0,0.45)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)')
      } else {
        // QR centrado → oscurecer arriba y abajo simétrico
        gradient.addColorStop(0, 'rgba(0,0,0,0.85)')
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.35)')
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.35)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Tarjeta blanca con el QR
    const qrSize = 540
    const padding = 56
    const captionGap = 130
    const cardW = qrSize + padding * 2
    const cardH = qrSize + padding * 2 + captionGap
    const cardX = (canvas.width - cardW) / 2
    let cardY: number
    if (position === 'top') cardY = 96
    else if (position === 'bottom') cardY = canvas.height - cardH - 96
    else cardY = (canvas.height - cardH) / 2

    // Sombra suave bajo la card
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 12
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.restore()

    // Acento brand: barra primary arriba de la card
    const BRAND = '#DC2626'
    ctx.fillStyle = BRAND
    ctx.fillRect(cardX, cardY, cardW, 8)

    // Generar QR en alta resolución
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
    const qrImg = await loadImage(qrDataUrl)
    ctx.drawImage(qrImg, cardX + padding, cardY + padding + 8, qrSize, qrSize)

    // Eyebrow + título debajo del QR
    const captionBaseY = cardY + padding + 8 + qrSize + 50
    ctx.textAlign = 'center'

    // Eyebrow
    ctx.fillStyle = BRAND
    ctx.font = '700 18px Inter, system-ui, sans-serif'
    ctx.fillText(
      'F O T O S   D E L   E V E N T O',
      canvas.width / 2,
      captionBaseY,
    )

    // Línea divisoria corta
    const lineW = 60
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(canvas.width / 2 - lineW / 2, captionBaseY + 18, lineW, 2)

    // CTA principal
    ctx.fillStyle = '#0a0a0a'
    ctx.font = '800 34px Montserrat, system-ui, sans-serif'
    ctx.fillText('ESCANÉAME', canvas.width / 2, captionBaseY + 62)

    // Subtítulo amigable
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#555555'
    ctx.fillText(
      'Encuentra y descarga tus fotos',
      canvas.width / 2,
      captionBaseY + 92,
    )

    // Bloque de marca arriba (cuando el QR no está arriba)
    if (position !== 'top') {
      ctx.textAlign = 'center'

      // PICSHOT con barra brand al lado
      const brandTextY = 110
      ctx.font = '900 60px Montserrat, system-ui, sans-serif'
      const brandText = 'PICSHOT'
      const brandTextWidth = ctx.measureText(brandText).width
      ctx.fillStyle = '#ffffff'
      ctx.fillText(brandText, canvas.width / 2, brandTextY)

      // Barra brand debajo del texto PICSHOT
      const accentY = brandTextY + 14
      ctx.fillStyle = BRAND
      ctx.fillRect(
        canvas.width / 2 - brandTextWidth / 2,
        accentY,
        brandTextWidth,
        4,
      )

      // Título del evento + fecha
      ctx.font = '700 26px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.fillText(eventTitle.toUpperCase(), canvas.width / 2, brandTextY + 64)
      ctx.font = '500 20px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(eventDate, canvas.width / 2, brandTextY + 94)
    } else {
      // Si el QR está arriba, dejamos PICSHOT + fecha abajo del póster
      ctx.textAlign = 'center'
      ctx.font = '800 36px Montserrat, system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('PICSHOT', canvas.width / 2, canvas.height - 120)
      ctx.font = '500 22px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(eventTitle.toUpperCase(), canvas.width / 2, canvas.height - 82)
      ctx.font = '400 20px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(eventDate, canvas.width / 2, canvas.height - 50)
    }

    setRendering(false)
  }, [backgroundUrl, eventDate, eventTitle, position, publicUrl, showOverlay])

  useEffect(() => {
    if (!open) return
    void render()
  }, [open, render])

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
          <div
            className="p-4 flex items-center justify-center"
            style={{
              backgroundImage:
                'repeating-conic-gradient(rgba(127,127,127,0.06) 0% 25%, transparent 0% 50%)',
              backgroundSize: '24px 24px',
            }}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-surface-variant shadow-2xl bg-surface-container-lowest"
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
