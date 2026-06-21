import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../lib/api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Icon } from '../components/ui/Icon'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const result = await register({
        name,
        email,
        password,
        marketingOptIn,
        acceptedTerms,
      })
      navigate(`/verificar-email?token=${result.pendingVerificationToken}`, {
        state: { fromRegister: true, email: result.email },
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Compra, descarga y guarda tus fotos de cada evento."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Nombre completo
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shots-input"
          />
        </label>

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

        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Contraseña
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shots-input"
          />
          <span className="font-caption text-caption text-on-surface-variant normal-case tracking-normal">
            Mínimo 8 caracteres.
          </span>
        </label>

        <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          Confirmar contraseña
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

        <label className="flex items-start gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            Acepto los{' '}
            <Link to="/terminos" className="text-primary hover:underline">
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-primary hover:underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-1"
          />
          <span>
            Quiero recibir avisos de nuevos eventos y descuentos por correo.
          </span>
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
          <Icon name={loading ? 'autorenew' : 'how_to_reg'} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  )
}
