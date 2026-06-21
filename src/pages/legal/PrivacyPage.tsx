import { LegalLayout } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad" lastUpdated="20 de junio de 2026">
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Qué datos recolectamos
      </h2>
      <p>
        Recolectamos nombre, correo, contraseña cifrada, datos del pago y, si lo
        autorizas, una representación matemática (embedding) de tu rostro para
        buscar tus fotos.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Para qué los usamos
      </h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Permitirte comprar y descargar fotos.</li>
        <li>Buscar coincidencias faciales dentro del evento que elijas.</li>
        <li>Cumplir obligaciones legales y fiscales.</li>
        <li>
          Enviarte avisos transaccionales y, si lo aceptaste, comunicaciones
          comerciales.
        </li>
      </ul>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Tus derechos
      </h2>
      <p>
        Puedes pedir acceder, rectificar o eliminar tus datos en cualquier
        momento desde la sección Mi cuenta. Para datos biométricos consulta la
        política específica.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Contacto
      </h2>
      <p>
        Escríbenos a privacidad@picshot.ec si necesitas ejercer tus derechos o
        tienes preguntas.
      </p>
    </LegalLayout>
  )
}
