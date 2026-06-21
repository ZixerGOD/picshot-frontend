import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Icon } from '../components/ui/Icon'
import { Footer } from '../components/layout/Footer'
import {
  hasBiometricConsent,
  revokeBiometricConsent,
} from '../components/events/BiometricConsentModal'

export function AccountPage() {
  const { user, updateUser } = useAuth()
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

  function handleRevokeBiometric() {
    if (!window.confirm('¿Eliminar el consentimiento y tu embedding facial?')) return
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

        <section className="bg-surface-container-lowest border border-surface-variant p-6">
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

        <section className="bg-surface-container-lowest border border-surface-variant p-6">
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

        <section className="bg-surface-container-lowest border border-surface-variant p-6">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-4">
            Datos biométricos
          </h2>
          {consent ? (
            <>
              <p className="font-body-md text-body-md text-on-surface">
                Tu consentimiento biométrico está activo. Guardamos una
                representación matemática de tu rostro para buscar tus fotos.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Puedes eliminar tu embedding en cualquier momento. La eliminación
                es inmediata y no afecta las fotos ya compradas.
              </p>
              <button
                type="button"
                onClick={handleRevokeBiometric}
                className="mt-4 inline-flex items-center gap-2 border border-primary-container/60 text-primary-container font-label-bold text-label-bold uppercase tracking-widest px-4 py-3 hover:text-primary hover:border-primary transition-colors"
              >
                <Icon name="delete" />
                Eliminar mi embedding
              </button>
            </>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No has autorizado el procesamiento biométrico. Lo puedes activar
              al usar el reconocimiento facial dentro de un evento.
            </p>
          )}
        </section>
      </main>

      <Footer variant="simple" />
    </>
  )
}
