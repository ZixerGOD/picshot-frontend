import { LegalLayout } from './LegalLayout'

export function BiometricPolicyPage() {
  return (
    <LegalLayout title="Política biométrica" lastUpdated="20 de junio de 2026">
      <p>
        Para encontrar tus fotos podemos procesar tu rostro mediante una
        representación matemática (embedding). Esa representación no es una
        imagen tuya y no permite reconstruir tu cara, pero es un dato sensible.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Qué hacemos
      </h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Solo procesamos tu rostro si autorizas el consentimiento biométrico
          dentro del flujo de búsqueda.
        </li>
        <li>
          La selfie original no se almacena: solo guardamos el embedding y lo
          asociamos a tu cuenta para acelerar futuras búsquedas.
        </li>
        <li>
          El embedding se usa exclusivamente para emparejar tu cara con las
          fotos del evento en el que estás buscando.
        </li>
      </ul>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Derecho al olvido
      </h2>
      <p>
        Puedes solicitar la eliminación de tu embedding en cualquier momento
        desde Mi cuenta. La eliminación es inmediata y no afecta las fotos que
        ya compraste.
      </p>

      <h2 className="font-headline-md text-headline-md text-on-surface">
        Retención
      </h2>
      <p>
        Si no usas el reconocimiento facial durante doce meses, eliminamos
        automáticamente tu embedding.
      </p>
    </LegalLayout>
  )
}
