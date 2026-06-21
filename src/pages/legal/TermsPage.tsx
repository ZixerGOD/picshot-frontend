import { LegalLayout } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones" lastUpdated="20 de junio de 2026">
      <h2 className="font-headline-md text-headline-md text-on-surface">
        1. Aceptación de los términos
      </h2>
      <p>
        Al usar PicShot aceptas estos términos. Si no estás de acuerdo, no uses
        la plataforma. Estos términos rigen tu acceso a cualquier sitio,
        servicio o aplicación operados por PicShot.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        2. Quiénes somos
      </h2>
      <p>
        PicShot es una plataforma de venta de fotografía deportiva operada en
        Ecuador. Conectamos a fotógrafos con participantes de eventos para que
        compren y descarguen sus fotos oficiales.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        3. Cuentas
      </h2>
      <p>
        Debes registrarte con datos verídicos. Eres responsable de mantener la
        confidencialidad de tu contraseña y de toda actividad realizada con tu
        cuenta. Notifícanos si detectas un acceso no autorizado.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        4. Compras y pagos
      </h2>
      <p>
        Los pagos se procesan a través de Payphone. Las fotos quedan disponibles
        para descargar durante seis meses. Si una transacción no se confirma en
        cinco minutos, se reversa automáticamente.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        5. Propiedad intelectual
      </h2>
      <p>
        Las fotografías son propiedad de su autor y se licencian para uso
        personal del comprador. Está prohibido reproducirlas, modificarlas o
        comercializarlas sin autorización.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        6. Cambios
      </h2>
      <p>
        Podemos actualizar estos términos por motivos legales o de servicio.
        Avisaremos por correo o dentro de la plataforma cuando los cambios sean
        relevantes.
      </p>
    </LegalLayout>
  )
}
