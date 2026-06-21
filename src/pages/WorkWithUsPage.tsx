import { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import { img } from '../lib/images'
import { submitStaffApplication } from '../lib/api'
import type { StaffApplication } from '../lib/types'

const benefits = [
  {
    icon: 'payments',
    title: 'Monetización Directa',
    description:
      'Sube tu cobertura inmediatamente después del evento. Vende directamente a atletas, agencias y aficionados con comisiones transparentes y pagos rápidos.',
  },
  {
    icon: 'speed',
    title: 'Plataforma Moderna',
    description:
      'Nuestra tecnología incluye reconocimiento facial para etiquetado automático y entrega instantánea a clientes, ahorrándote horas de edición y catalogación.',
  },
  {
    icon: 'groups',
    title: 'Comunidad Profesional',
    description:
      'Únete a una red exclusiva de fotógrafos élite. Comparte técnicas, obtén acceso preferencial a eventos y eleva tu carrera en la industria deportiva.',
  },
]

export function WorkWithUsPage() {
  const [form, setForm] = useState<StaffApplication>({
    fullName: '',
    email: '',
    city: '',
    portfolioUrl: '',
    social: '',
    gear: '',
    experience: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function updateField<K extends keyof StaffApplication>(
    field: K,
    value: StaffApplication[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await submitStaffApplication(form)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="flex-grow pt-20">
        {/* Hero */}
        <section className="relative w-full h-[614px] md:h-[716px] flex items-center justify-center overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 z-0">
            <img
              src={img('shots-photographer', 1600, 900)}
              alt="Fotógrafo deportivo en acción"
              className="w-full h-full object-cover opacity-40 grayscale mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
          </div>
          <div className="relative z-10 shots-container text-center flex flex-col items-center gap-base">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-on-surface uppercase">
              Únete a nuestra red de fotógrafos deportivos
            </h1>
            <p className="font-body-lg text-body-lg md:text-[24px] text-on-surface-variant max-w-2xl mt-4">
              Cubre eventos, sube tus fotos y genera ingresos. Sé parte de la
              plataforma definitiva para la fotografía deportiva profesional.
            </p>
            <div className="mt-8 h-1 w-24 bg-primary-container" />
          </div>
        </section>

        {/* Form */}
        <section className="shots-section bg-surface">
          <div className="shots-container grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
                Postula tu talento
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Buscamos a los mejores ojos del deporte. Completa tu perfil
                profesional para ser considerado en nuestra red global.
                Requerimos experiencia comprobable y equipo apto para
                condiciones de alta velocidad.
              </p>
              <div className="mt-auto hidden lg:block">
                <Icon
                  name="photo_camera"
                  className="text-[64px] text-surface-container-highest"
                  fill
                />
              </div>
            </div>

            <div className="lg:col-span-8 bg-surface-container-low border border-surface-variant p-6 md:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                  <Icon
                    name="check_circle"
                    className="text-6xl text-primary-container"
                  />
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Postulación enviada
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Revisaremos tu perfil y te contactaremos si encajas en
                    nuestra red.
                  </p>
                  <Button onClick={() => setSent(false)}>
                    Enviar otra postulación
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nombre completo"
                    placeholder="Ej. Juan Pérez"
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    wrapperClassName="md:col-span-2"
                    required
                  />
                  <Input
                    label="Email profesional"
                    type="email"
                    placeholder="contacto@tuweb.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                  <Input
                    label="Ciudad de residencia"
                    placeholder="Ej. Quito"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    required
                  />
                  <Input
                    label="Enlace a Portafolio"
                    type="url"
                    placeholder="https://tuportafolio.com"
                    value={form.portfolioUrl}
                    onChange={(e) => updateField('portfolioUrl', e.target.value)}
                    wrapperClassName="md:col-span-2"
                    required
                  />
                  <Input
                    label="Instagram / Twitter"
                    placeholder="@usuario"
                    value={form.social}
                    onChange={(e) => updateField('social', e.target.value)}
                  />
                  <Input
                    label="Equipo Principal (Cámara/Lentes)"
                    placeholder="Ej. Sony A9 II, 400mm f2.8"
                    value={form.gear}
                    onChange={(e) => updateField('gear', e.target.value)}
                    required
                  />
                  <Textarea
                    label="Breve resumen de experiencia deportiva"
                    placeholder="Ligas cubiertas, años de experiencia, medios..."
                    rows={4}
                    value={form.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    wrapperClassName="md:col-span-2"
                    required
                  />
                  <div className="md:col-span-2 mt-4">
                    <Button
                      type="submit"
                      isLoading={sending}
                      className="w-full md:w-auto"
                    >
                      Enviar postulación
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="shots-section bg-secondary-fixed text-on-secondary-fixed">
          <div className="shots-container">
            <div className="text-center mb-16">
              <h2 className="font-headline-md text-headline-md font-black uppercase text-on-secondary-fixed">
                Por qué unirte a PicShot
              </h2>
              <div className="mt-4 h-1 w-16 bg-primary-container mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter lg:gap-16">
              {benefits.map((b) => (
                <div key={b.title} className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-surface text-on-surface flex items-center justify-center shadow-sm">
                    <Icon
                      name={b.icon}
                      className="text-[32px] text-primary-container"
                      fill
                    />
                  </div>
                  <h3 className="font-headline-md text-[24px] font-bold uppercase text-on-secondary-fixed">
                    {b.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-secondary-fixed-variant">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer variant="simple" />
    </>
  )
}
