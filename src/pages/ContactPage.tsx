import { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { submitContactRequest } from '../lib/api'
import type { ContactRequest } from '../lib/types'

const eventTypes = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'running', label: 'Running / Maratón' },
  { value: 'cycling', label: 'Ciclismo' },
  { value: 'triathlon', label: 'Triatlón' },
  { value: 'team_sports', label: 'Deportes de equipo' },
  { value: 'other', label: 'Otro' },
]

const benefits = [
  {
    icon: 'photo_camera',
    title: 'Cobertura profesional',
    description:
      'Fotógrafos experimentados en acción deportiva extrema, asegurando tomas perfectas en cualquier condición de luz y velocidad.',
  },
  {
    icon: 'collections',
    title: 'Galerías públicas/privadas',
    description:
      'Flexibilidad total para mostrar el evento. Organiza las fotos en álbumes de acceso abierto o restringido por contraseña.',
  },
  {
    icon: 'storefront',
    title: 'Venta directa',
    description:
      'Monetiza la cobertura ofreciendo descargas digitales de alta resolución directamente a los participantes.',
  },
]

export function ContactPage() {
  const [form, setForm] = useState<ContactRequest>({
    fullName: '',
    eventName: '',
    email: '',
    phone: '',
    eventType: '',
    date: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function updateField<K extends keyof ContactRequest>(
    field: K,
    value: ContactRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await submitContactRequest(form)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="flex-grow w-full shots-container py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-12 mb-12">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-4">
            Contrata cobertura fotográfica para tu evento
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Asegura la mejor calidad de imagen para tus competiciones deportivas.
            Nuestro equipo de fotógrafos profesionales capturará cada momento
            clave con precisión y estilo.
          </p>
        </div>

        <div className="lg:col-span-7 bg-surface-container-low border border-surface-variant p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary-container opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

          {sent ? (
            <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
              <Icon name="check_circle" className="text-6xl text-primary-container" />
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Solicitud enviada
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Gracias por contactarnos. Nuestro equipo revisará tu solicitud y
                te responderá en menos de 24 horas.
              </p>
              <Button onClick={() => setSent(false)}>Enviar otra solicitud</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre completo"
                  placeholder="Ej. Juan Pérez"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  required
                />
                <Input
                  label="Nombre del Evento"
                  placeholder="Ej. Maratón Quito 2026"
                  value={form.eventName}
                  onChange={(e) => updateField('eventName', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="+593 99 000 0000"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Tipo de evento"
                  options={eventTypes}
                  value={form.eventType}
                  onChange={(e) => updateField('eventType', e.target.value)}
                  required
                />
                <Input
                  label="Fecha prevista"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <Textarea
                label="Mensaje / Detalles adicionales"
                placeholder="Cuéntanos más sobre las necesidades fotográficas de tu evento..."
                rows={4}
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
              />
              <Button type="submit" isLoading={sending} className="w-full py-5">
                Enviar solicitud
                <Icon name="send" className="text-[20px]" />
              </Button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-surface-container-highest border border-surface-variant p-8 flex items-start gap-4 hover:border-surface-variant/80 transition-colors"
            >
              <div className="bg-surface-container-low p-3 shrink-0">
                <Icon name={b.icon} className="text-primary-container text-3xl" fill />
              </div>
              <div>
                <h3 className="font-headline-md text-[20px] text-on-surface mb-2">
                  {b.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {b.description}
                </p>
              </div>
            </div>
          ))}

          <div className="bg-surface-container-lowest border border-primary-container/30 p-8 flex items-start gap-4 relative overflow-hidden group mt-auto">
            <div className="shots-laser-line animate-scan" />
            <div className="bg-surface p-3 shrink-0 z-10">
              <Icon name="face" className="text-primary-container text-3xl" fill />
            </div>
            <div className="z-10">
              <h3 className="font-headline-md text-[20px] text-primary-container mb-2 flex items-center gap-2">
                Reconocimiento facial
                <span className="bg-primary-container text-on-primary-container text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider">
                  Pro
                </span>
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Nuestra IA exclusiva permite a los atletas encontrar todas sus
                fotos en segundos subiendo un selfie. Aumenta las ventas y la
                satisfacción.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="simple" />
    </>
  )
}
