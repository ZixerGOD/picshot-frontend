import { Link } from 'react-router-dom'
import { mockEvents } from '../lib/mocks'
import { img } from '../lib/images'
import { EventCard } from '../components/events/EventCard'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'

const steps = [
  {
    icon: 'event',
    title: 'Elige el evento',
    description:
      'Navega por nuestro catálogo de competiciones o usa el buscador para encontrar tu carrera.',
  },
  {
    icon: 'face',
    title: 'Busca tu foto',
    description:
      'Sube una selfie para usar nuestro motor de reconocimiento facial o introduce tu número de dorsal.',
  },
  {
    icon: 'download',
    title: 'Compra y descarga',
    description:
      'Adquiere tus fotos en alta resolución al instante. Listas para imprimir o compartir en redes.',
  },
]

export function HomePage() {
  return (
    <>
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] md:min-h-[921px] flex items-center bg-black overflow-hidden border-b border-surface-variant">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/50 z-10" />
            <img
              src={img('shots-hero', 1600, 900)}
              alt=""
              className="w-full h-full object-cover object-center opacity-60 mix-blend-luminosity"
            />
          </div>

          <div className="relative z-10 shots-container grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-8 flex flex-col items-start gap-6">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-white uppercase tracking-tighter max-w-4xl">
                Encuentra y compra tus{' '}
                <span className="text-primary">mejores momentos</span>{' '}
                de carrera
              </h1>
              <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-white/80 max-w-2xl mb-4 border-l-2 border-primary pl-4">
                Busca tus fotos por evento, número de dorsal o usando nuestro
                avanzado sistema de reconocimiento facial. Revive la adrenalina
                al instante.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                <Link
                  to="/eventos?tab=face"
                  className="shots-btn-primary py-4 px-8"
                >
                  <Icon name="face" />
                  Encuentra tus fotos con una Selfie
                </Link>
                <Link
                  to="/eventos"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-white font-label-bold text-label-bold uppercase tracking-widest py-4 px-8 border-2 border-white hover:bg-white hover:text-black transition-colors duration-200"
                >
                  Ver eventos recientes
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary-container via-primary to-transparent opacity-50" />
        </section>

        {/* Recent Events */}
        <section className="shots-section bg-surface border-b border-surface-variant">
          <div className="shots-container">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="shots-section-header">
                  Eventos <span className="text-primary-container">Recientes</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Explora las galerías de las últimas competiciones.
                </p>
              </div>
              <Link
                to="/eventos"
                className="text-primary hover:text-on-background transition-colors font-label-bold text-label-bold uppercase flex items-center gap-1 group"
              >
                Ver todo el catálogo
                <Icon
                  name="arrow_forward"
                  className="transform group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {mockEvents.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="shots-section bg-surface-container-lowest relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="shots-container relative z-10 text-center">
            <h2 className="shots-section-header mb-16">
              Encuentra tu foto en{' '}
              <span className="text-primary-container">3 pasos</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-gutter relative">
              <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-[1px] bg-surface-variant z-0" />
              {steps.map((step, idx) => (
                <div key={step.title} className="flex flex-col items-center relative z-10">
                  <div className="w-24 h-24 bg-surface border border-surface-variant flex items-center justify-center mb-6 relative group">
                    <div className="absolute inset-0 bg-primary-container opacity-0 group-hover:opacity-10 transition-opacity" />
                    <Icon name={step.icon} className="text-4xl text-primary" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary-container text-on-primary-container font-label-bold text-label-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-3 text-[24px]">
                    {step.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xs text-center">
                    {step.description}
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
