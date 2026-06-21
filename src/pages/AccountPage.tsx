import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import {
  hasBiometricConsent,
  revokeBiometricConsent,
} from '../components/events/BiometricConsentModal'

export function AccountPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [marketingOptIn, setMarketingOptIn] = useState(
    user?.marketingOptIn ?? false,
  )
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [consent, setConsent] = useState(hasBiometricConsent())

  // Cambio de contraseña local mock
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  useEffect(() => {
    setName(user?.name ?? '')
    setMarketingOptIn(user?.marketingOptIn ?? false)
  }, [user])

  if (!user) return null

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateUser({ name, marketingOptIn })
    setSavedAt(new Date().toLocaleString('es-EC'))
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg(null)
    if (newPassword.length < 8) {
      setPwdMsg({ ok: false, text: 'La nueva contraseña debe tener 8 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    // Mock: en modo demo solo confirmamos. Conectar a /me/password cuando exista.
    setPwdMsg({ ok: true, text: 'Contraseña actualizada (demo).' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  function handleLogoutAllDevices() {
    if (
      !window.confirm(
        'Vamos a cerrar tu sesión en todos los dispositivos. ¿Continuamos?',
      )
    )
      return
    // En backend real esto invalida todos los refresh tokens; en mock
    // limpiamos la sesión actual y mostramos confirmación al usuario.
    logout()
    navigate('/login', {
      state: { logoutAll: true, email: user?.email },
    })
  }

  function handleRevokeBiometric() {
    if (!window.confirm('¿Retirar tu permiso y eliminar los datos de tu rostro?')) return
    revokeBiometricConsent()
    setConsent(false)
  }

  return (
    <>
      <main className="pt-32 pb-24 shots-container max-w-4xl space-y-12">
        <header>
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
            Mi cuenta
          </p>
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface uppercase mt-2">
            {user.name}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {user.email} · Cuenta {user.role}
          </p>
        </header>

        <section className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Datos personales
          </h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Nombre
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shots-input"
              />
            </label>
            <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Correo electrónico
              <input
                type="email"
                disabled
                value={user.email}
                className="shots-input opacity-60 cursor-not-allowed"
              />
              <span className="font-caption text-caption text-on-surface-variant normal-case tracking-normal">
                Para cambiar tu correo, contáctanos.
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
            <button type="submit" className="shots-btn-primary py-3 justify-center">
              <Icon name="save" />
              Guardar cambios
            </button>
            {savedAt && (
              <p className="font-caption text-caption text-primary">
                Guardado a las {savedAt}.
              </p>
            )}
          </form>
        </section>

        <section className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Cambiar contraseña
          </h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Contraseña actual
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="shots-input"
              />
            </label>
            <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Nueva contraseña
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="shots-input"
              />
            </label>
            <label className="flex flex-col gap-1 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
              Confirmar nueva contraseña
              <input
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="shots-input"
              />
            </label>
            {pwdMsg && (
              <p
                className={`font-body-md text-body-md ${
                  pwdMsg.ok ? 'text-primary' : 'text-primary-container'
                }`}
              >
                {pwdMsg.text}
              </p>
            )}
            <button type="submit" className="shots-btn-primary py-3 justify-center">
              <Icon name="lock_reset" />
              Actualizar contraseña
            </button>
          </form>
        </section>

        <section className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Reconocimiento facial
          </h2>
          {consent ? (
            <>
              <p className="font-body-md text-body-md text-on-surface">
                Diste permiso para que usemos tu rostro al buscar tus fotos.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Puedes retirar ese permiso cuando quieras. No afecta las fotos
                que ya hayas comprado.
              </p>
              <button
                type="button"
                onClick={handleRevokeBiometric}
                className="mt-4 inline-flex items-center gap-2 border border-primary-container/60 text-primary-container font-label-bold text-label-bold uppercase tracking-widest px-4 py-3 hover:text-primary hover:border-primary transition-colors"
              >
                <Icon name="delete" />
                Retirar mi permiso
              </button>
            </>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Aún no diste permiso para usar tu rostro al buscar fotos. Puedes
              activarlo cuando entres a un evento.
            </p>
          )}
        </section>

        <section className="bg-surface-container-lowest border border-surface-variant p-4 sm:p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Seguridad
          </h2>
          <p className="font-body-md text-body-md text-on-surface">
            Si crees que alguien más tiene acceso a tu cuenta, cierra sesión en
            todos los dispositivos donde la hayas usado.
          </p>
          <button
            type="button"
            onClick={handleLogoutAllDevices}
            className="mt-4 inline-flex items-center gap-2 border border-primary-container/60 text-primary-container font-label-bold text-label-bold uppercase tracking-widest px-4 py-3 hover:text-primary hover:border-primary transition-colors"
          >
            <Icon name="logout" />
            Cerrar sesión en todos los dispositivos
          </button>
        </section>
      </main>

      <Footer variant="simple" />
    </>
  )
}
