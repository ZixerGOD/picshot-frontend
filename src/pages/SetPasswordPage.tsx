import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { setPasswordWithInvite } from '../lib/api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Icon } from '../components/ui/Icon'

export function SetPasswordPage() {
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
        title="Invitación inválida"
        subtitle="Pide al equipo que te envíe un nuevo enlace de invitación."
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Volver al login
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
      await setPasswordWithInvite(token, password)
      navigate('/login', {
        state: { inviteAccepted: true },
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Activa tu cuenta"
      subtitle="Define tu contraseña para empezar a subir fotos a los eventos asignados."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          ¿Ya tienes tu cuenta activa? Inicia sesión
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shots-input"
          />
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
          <Icon
            name={loading ? 'autorenew' : 'lock'}
            className={loading ? 'animate-spin' : ''}
          />
          {loading ? 'Guardando…' : 'Activar cuenta'}
        </button>
      </form>
    </AuthLayout>
  )
}
