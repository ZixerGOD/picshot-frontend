import { LegalLayout } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones" lastUpdated="20 de junio de 2026">
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        1. Aceptación de los términos
      </h2>
      <p>
        Al usar PicShot aceptas estos términos. Si no estás de acuerdo, no uses
        la plataforma. Estos términos rigen tu acceso a cualquier sitio,
        servicio o aplicación operados por PicShot.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        2. Quiénes somos
      </h2>
      <p>
        PicShot es una plataforma de venta de fotografía deportiva operada en
        Ecuador. Conectamos a fotógrafos con participantes de eventos para que
        compren y descarguen sus fotos oficiales.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        3. Cuentas
      </h2>
      <p>
        Debes registrarte con datos verídicos. Eres responsable de mantener la
        confidencialidad de tu contraseña y de toda actividad realizada con tu
        cuenta. Notifícanos si detectas un acceso no autorizado.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        4. Compras y pagos
      </h2>
      <p>
        Los pagos se procesan a través de Payphone. Las fotos quedan
        disponibles para descargar durante seis meses. Si una transacción no
        se confirma en cinco minutos, se reversa automáticamente.
      </p>
      <p>
        Las compras son finales. No procesamos reembolsos desde la plataforma:
        si tienes un problema con una compra, escríbenos a{' '}
        <strong>soporte@picshotec.com</strong> y revisamos cada caso de forma
        manual.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        5. Propiedad intelectual
      </h2>
      <p>
        Las fotografías son propiedad de su autor y se licencian para uso
        personal del comprador. Está prohibido reproducirlas, modificarlas o
        comercializarlas sin autorización.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        6. Fotos de otros participantes
      </h2>
      <p>
        Las galerías de cada evento son públicas: cualquier usuario registrado
        puede ver, comprar y descargar cualquier foto disponible. Esto incluye
        fotos en las que aparecen otros participantes. Al usar la plataforma
        aceptas esta característica y te comprometes a respetar el derecho a la
        imagen de las demás personas; en particular, no debes usar las fotos
        con fines difamatorios ni comerciales sin permiso de quienes aparecen.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        7. Cambios
      </h2>
      <p>
        Podemos actualizar estos términos por motivos legales o de servicio.
        Avisaremos por correo o dentro de la plataforma cuando los cambios sean
        relevantes.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        8. Responsable
      </h2>
      <p>
        PicShot es desarrollada por <strong>Devmaniacs</strong> y operada por
        el cliente, quien asume la responsabilidad legal por los derechos de
        imagen, el consentimiento de los participantes y el cumplimiento de
        las leyes locales de protección de datos.
      </p>
    </LegalLayout>
  )
}
