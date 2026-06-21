/**
 * Persistencia del consentimiento AI/facial por evento.
 * Helpers separados del componente para que React Refresh funcione.
 *
 * Spec: business-rules.md:48 — "Must accept AI/facial recognition terms
 * (mandatory consent)" como paso del flujo de acceso al evento.
 */

const STORAGE_KEY = 'picshot-event-ai-consent'

export interface EventAIConsentRecord {
  [userEventKey: string]: { acceptedAt: string }
}

function loadAll(): EventAIConsentRecord {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EventAIConsentRecord) : {}
  } catch {
    return {}
  }
}

function persistAll(record: EventAIConsentRecord) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // ignore
  }
}

export function hasEventAIConsent(
  userId: string | undefined,
  eventId: string,
): boolean {
  if (!userId) return false
  return Boolean(loadAll()[`${userId}:${eventId}`])
}

export function recordEventAIConsent(userId: string, eventId: string): void {
  const all = loadAll()
  all[`${userId}:${eventId}`] = { acceptedAt: new Date().toISOString() }
  persistAll(all)
}
