import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { resendVerification, verifyEmail } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Icon } from '../../components/ui/Icon'

const RESEND_COOLDOWN_S = 5 * 60

type State = 'idle' | 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const { user, updateUser } = useAuth()
  const token = params.get('token') ?? ''
  const fromState = (location.state ?? {}) as {
    fromRegister?: boolean
    email?: string
  }
  const [state, setState] = useState<State>(token ? 'verifying' : 'idle')
  const [message, setMessage] = useState<string | null>(null)
  const [resentToken, setResentToken] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState(
    fromState.email ?? user?.email ?? '',
  )
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    verifyEmail(token)
      .then(({ email }) => {
        if (cancelled) return
        // Si el usuario en sesión coincide con el correo verificado, refrescar
        if (user && user.email.toLowerCase() === email.toLowerCase()) {
          updateUser({ emailVerified: true })
        }
        setState('success')
      })
      .catch((err) => {
        if (cancelled) return
        setState('error')
        setMessage((err as Error).message)
      })
    return () => {
      cancelled = true
    }
  }, [token, user, updateUser])

  useEffect(() => {
    if (cooldown <= 0) return
    cooldownRef.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => {
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current)
    }
  }, [cooldown])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail || cooldown > 0) return
    setResentToken(null)
    const res = await resendVerification(resendEmail)
    setResentToken(res.token)
    setCooldown(RESEND_COOLDOWN_S)
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
          ? `${message ?? 'Solicita un nuevo enlace de verificación.'} El enlace que enviamos por correo dura 24 horas.`
          : fromState.fromRegister
            ? 'Te enviamos un enlace de verificación. Revisa tu bandeja de entrada — el enlace dura 24 horas.'
            : 'Ingresa tu correo y te reenviamos el enlace. Dura 24 horas.'
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
          disabled={cooldown > 0}
          className="shots-btn-primary py-3 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon name="mail" />
          {cooldown > 0
            ? `Espera ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
            : 'Reenviar enlace'}
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
