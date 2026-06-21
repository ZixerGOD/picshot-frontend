import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../lib/api'
import { PASSWORD_HINT } from '../../lib/types'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Icon } from '../../components/ui/Icon'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
        firstName,
        lastName,
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
      subtitle="Tu correo, tu contraseña y listo."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombres">
              <input
                type="text"
                required
                autoComplete="given-name"
                placeholder="Ej. María Fernanda"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="shots-input"
              />
            </Field>
            <Field label="Apellidos">
              <input
                type="text"
                required
                autoComplete="family-name"
                placeholder="Ej. Pérez Cordero"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="shots-input"
              />
            </Field>
          </div>

          <Field label="Tu correo electrónico">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shots-input"
            />
          </Field>
        </div>

        <div className="border-t border-surface-variant pt-5 flex flex-col gap-4">
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
            Crea una contraseña
          </p>
          <Field hint={PASSWORD_HINT}>
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shots-input"
            />
          </Field>
          <Field>
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Confirma tu contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="shots-input"
            />
          </Field>
        </div>

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

interface FieldProps {
  label?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
          {label}
        </span>
      )}
      {children}
      {hint && (
        <span className="font-caption text-caption text-on-surface-variant">
          {hint}
        </span>
      )}
    </label>
  )
}
