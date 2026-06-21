import { LegalLayout } from './LegalLayout'

export function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies" lastUpdated="20 de junio de 2026">
      <p>
        Usamos cookies para mantener tu sesión iniciada, recordar tus
        preferencias visuales y medir el uso de la plataforma.
      </p>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        Tipos de cookies
      </h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Esenciales:</strong> mantienen tu sesión y el carrito. No se
          pueden desactivar.
        </li>
        <li>
          <strong>Preferencias:</strong> guardan el tema claro/oscuro y otros
          ajustes visuales.
        </li>
        <li>
          <strong>Analíticas:</strong> nos ayudan a medir tráfico de forma
          agregada. Puedes rechazarlas.
        </li>
      </ul>
      <p>
        Puedes administrar las cookies desde la configuración de tu navegador o
        desde el banner que aparece al ingresar por primera vez.
      </p>
    </LegalLayout>
  )
}
