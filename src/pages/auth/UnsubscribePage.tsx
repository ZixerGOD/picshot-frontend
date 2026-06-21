import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Icon } from '../../components/ui/Icon'

/**
 * Cumple emails.md:39 — "Every marketing email includes an unsubscribe
 * link that toggles the preference off immediately".
 * Si el usuario está en sesión, apaga su `marketingOptIn` y confirma. Sin
 * sesión, muestra confirmación genérica (el backend resuelve por token).
 */
export function UnsubscribePage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, updateUser } = useAuth()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (user?.marketingOptIn) {
      updateUser({ marketingOptIn: false })
    }
    setDone(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthLayout
      title="Listo, te dimos de baja"
      subtitle="No te enviaremos más correos comerciales."
      footer={
        <Link to="/mi-cuenta" className="text-primary hover:underline">
          Ir a Mi Cuenta
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <Icon name="mark_email_read" className="text-primary text-5xl" />
        <p className="font-body-md text-body-md text-on-surface-variant text-center">
          {done && user
            ? 'Apagamos los correos comerciales en tu cuenta. Puedes activarlos otra vez desde Mi Cuenta cuando quieras.'
            : 'Procesamos tu solicitud. Si quieres volver a recibir avisos, entra a Mi Cuenta.'}
        </p>
        {token && (
          <p className="font-caption text-caption text-on-surface-variant">
            Token: <code>{token}</code>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
