import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { USE_MOCKS } from '../lib/api'
import type { UserRole } from '../lib/types'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

interface LoginState {
  from?: Location
  role?: UserRole
  denied?: boolean
}

function homeForRole(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'photographer') return '/fotografo'
  return '/mis-compras'
}

// A qué área pertenece una ruta, para no devolver a un rol a una sección ajena.
function areaForPath(path: string): UserRole {
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/fotografo')) return 'photographer'
  return 'customer'
}

// Atajos de demo (modo mock). En backend real se eliminan.
const demoAccounts: { label: string; email: string; password: string; icon: string }[] = [
  { label: 'Administrador', email: 'admin@picshot.com', password: 'admin123', icon: 'shield_person' },
  { label: 'Fotógrafo', email: 'fotografo@picshot.com', password: 'foto123', icon: 'photo_camera' },
  { label: 'Comprador', email: 'comprador@email.com', password: 'demo123', icon: 'shopping_bag' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginState

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ email, password })
      const from = state.from?.pathname
      // Volver a la página de origen solo si es del área del propio rol; si no, a su home.
      const target =
        from && !state.denied && areaForPath(from) === user.role
          ? from
          : homeForRole(user.role)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(account: { email: string; password: string }) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <header className="shots-container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center">
          <Logo className="h-7" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-margin-mobile py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
              Iniciar sesión
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Accede a tu cuenta de PicShot.
            </p>
          </div>

          {state.denied && (
            <div className="mb-6 flex items-start gap-3 border border-error/40 bg-error/10 p-4">
              <Icon name="lock" className="text-error shrink-0" />
              <p className="font-body-md text-body-md text-on-surface">
                No tienes permisos para esa sección con tu cuenta actual.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest border border-surface-variant p-6 md:p-8 space-y-6"
          >
            <Input
              label="Correo electrónico"
              type="email"
              icon="mail"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Contraseña"
              type="password"
              icon="lock"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="flex items-center gap-2 font-caption text-caption text-error">
                <Icon name="error" className="text-base" />
                {error}
              </p>
            )}

            <Button type="submit" isLoading={loading} className="w-full py-4">
              <Icon name="login" />
              Entrar
            </Button>
          </form>

          {USE_MOCKS && (
            <div className="mt-8">
              <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest mb-3">
                Cuentas de demostración
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="flex items-center gap-2 border border-surface-variant p-3 text-on-surface hover:border-primary hover:text-primary transition-colors"
                  >
                    <Icon name={account.icon} className="text-lg" />
                    <span className="font-label-bold text-label-bold uppercase tracking-wider">
                      {account.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 text-center font-body-md text-body-md text-on-surface-variant">
            <Link to="/recuperar-contrasena" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-primary hover:underline">
                Regístrate
              </Link>
            </p>
            <p>
              ¿Eres fotógrafo y aún no estás en la red?{' '}
              <Link to="/trabaja-con-nosotros" className="text-primary hover:underline">
                Postúlate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
