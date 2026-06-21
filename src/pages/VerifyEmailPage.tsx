import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { resendVerification, verifyEmail } from '../lib/api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Icon } from '../components/ui/Icon'

type State = 'idle' | 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const token = params.get('token') ?? ''
  const fromState = (location.state ?? {}) as {
    fromRegister?: boolean
    email?: string
  }
  const [state, setState] = useState<State>(token ? 'verifying' : 'idle')
  const [message, setMessage] = useState<string | null>(null)
  const [resentToken, setResentToken] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState(fromState.email ?? '')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setState('success')
      })
      .catch((err) => {
        if (cancelled) return
        setState('error')
        setMessage((err as Error).message)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail) return
    setResentToken(null)
    const res = await resendVerification(resendEmail)
    setResentToken(res.token)
  }

  if (state === 'success') {
    return (
      <AuthLayout
        title="Correo verificado"
        subtitle="Ya puedes iniciar sesión y comprar tus fotos."
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Ir al login
          </Link>
        }
      >
        <div className="flex justify-center">
          <Icon name="check_circle" className="text-primary text-6xl" />
        </div>
      </AuthLayout>
    )
  }

  if (state === 'verifying') {
    return (
      <AuthLayout
        title="Verificando tu correo"
        subtitle="Solo tomará un instante."
      >
        <div className="flex justify-center text-on-surface-variant gap-3">
          <Icon name="autorenew" className="animate-spin text-2xl text-primary" />
          <span className="font-body-md">Espera…</span>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={state === 'error' ? 'Enlace inválido o expirado' : 'Verifica tu correo'}
      subtitle={
        state === 'error'
          ? message ?? 'Solicita un nuevo enlace de verificación.'
          : fromState.fromRegister
            ? 'Te enviamos un enlace de verificación. Revisa tu bandeja de entrada.'
            : 'Ingresa tu correo y te reenviamos el enlace.'
      }
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Volver al login
        </Link>
      }
    >
      <form onSubmit={handleResend} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Correo electrónico
          <input
            type="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="shots-input"
          />
        </label>
        <button
          type="submit"
          className="shots-btn-primary py-3 justify-center"
        >
          <Icon name="mail" />
          Reenviar enlace
        </button>
        {resentToken && (
          <div className="border border-primary/40 bg-primary-container/15 p-4 text-center">
            <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Modo demo
            </p>
            <Link
              to={`/verificar-email?token=${resentToken}`}
              className="font-label-bold text-label-bold text-primary hover:underline break-all"
            >
              /verificar-email?token={resentToken}
            </Link>
          </div>
        )}
      </form>
    </AuthLayout>
  )
}
