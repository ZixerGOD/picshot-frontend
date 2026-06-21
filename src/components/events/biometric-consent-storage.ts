/**
 * Helpers de almacenamiento del consentimiento biométrico per-usuario.
 * Se separan del componente para que Vite/React-Refresh no rompa HMR.
 */

const STORAGE_KEY = 'picshot-biometric-consent'

export interface BiometricConsentRecord {
  acceptedAt: string
}

export function hasBiometricConsent(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

export function recordBiometricConsent(): void {
  try {
    const payload: BiometricConsentRecord = {
      acceptedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function revokeBiometricConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
