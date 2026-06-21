import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../lib/api'
import { PASSWORD_HINT } from '../../lib/types'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Icon } from '../../components/ui/Icon'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <AuthLayout
        title="Enlace incompleto"
        subtitle="No detectamos un token en la URL."
        footer={
          <Link to="/recuperar-contrasena" className="text-primary hover:underline">
            Solicitar uno nuevo
          </Link>
        }
      >
        <div />
      </AuthLayout>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      navigate('/login', {
        state: { resetOk: true },
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Volver al login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Nueva contraseña
          <input
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shots-input"
          />
          <span className="font-caption text-caption text-on-surface-variant normal-case tracking-normal">
            {PASSWORD_HINT}
          </span>
        </label>
        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Confirmar
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="shots-input"
          />
        </label>
        {error && (
          <p className="font-body-md text-body-md text-primary-container" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="shots-btn-primary py-3 justify-center disabled:opacity-60"
        >
          <Icon name={loading ? 'autorenew' : 'lock_reset'} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthLayout>
  )
}
