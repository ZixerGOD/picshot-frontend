import { LegalLayout } from './LegalLayout'

export function BiometricPolicyPage() {
  return (
    <LegalLayout
      title="Política de reconocimiento facial"
      lastUpdated="20 de junio de 2026"
    >
      <p>
        Para ayudarte a encontrar tus fotos más rápido, Picshot puede usar tu
        rostro como referencia. Es una herramienta opcional: solo la activamos
        si tú la autorizas.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        Cómo funciona
      </h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Tomas una selfie dentro del evento o subes una foto tuya desde tu
          dispositivo.
        </li>
        <li>
          Comparamos tu rostro con las fotos que los fotógrafos subieron de ese
          evento para mostrarte coincidencias.
        </li>
        <li>
          Conservamos los datos justos para volver a reconocerte en el mismo
          evento si vuelves a entrar. Nunca guardamos la selfie original.
        </li>
      </ul>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        Tu control
      </h2>
      <p>
        Puedes retirar tu permiso en cualquier momento desde Mi cuenta. Al
        hacerlo, eliminamos la información que usamos para reconocerte. Esto no
        afecta a las fotos que ya hayas comprado.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight border-l-2 border-primary pl-3 mt-2">
        Si dejas de usarlo
      </h2>
      <p>
        Si no usas el reconocimiento facial durante doce meses, lo desactivamos
        por ti y borramos los datos asociados a tu rostro.
      </p>
    </LegalLayout>
  )
}
