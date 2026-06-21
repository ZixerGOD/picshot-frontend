import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../lib/api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Icon } from '../components/ui/Icon'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [debugToken, setDebugToken] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setSent(true)
      if (res.token && res.token !== 'noop') setDebugToken(res.token)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Si la cuenta existe, te enviamos un enlace para restablecer tu contraseña."
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Volver al login
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="font-body-md text-body-md text-on-surface-variant text-center">
            El enlace expira en una hora.
          </p>
          {debugToken && (
            <div className="border border-primary/40 bg-primary-container/15 p-4 text-center">
              <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                Modo demo
              </p>
              <Link
                to={`/reset-password?token=${debugToken}`}
                className="font-label-bold text-label-bold text-primary hover:underline break-all"
              >
                /reset-password?token={debugToken}
              </Link>
            </div>
          )}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Te enviamos un enlace para restablecerla."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Volver al login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Correo electrónico
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shots-input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="shots-btn-primary py-3 justify-center disabled:opacity-60"
        >
          <Icon name={loading ? 'autorenew' : 'mail'} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
    </AuthLayout>
  )
}
