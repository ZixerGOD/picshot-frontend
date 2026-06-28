# Consents — integración real actual del backend

Documento orientado a Omar y a consumo por LLM para reemplazar por
completo los helpers de `localStorage` de consentimientos.

Base path asumido: `/api/v1`

---

## Qué queda cubierto en este paso

### Implementado

- `GET /me/consents`
- `POST /me/consents/biometric`
- `DELETE /me/consents/biometric`
- `POST /me/consents/event-ai/{event_id|slug}`
- `DELETE /me/consents/event-ai/{event_id|slug}`

### Relación con otros endpoints

- `GET /events/{event_id|slug}` ahora puede incluir
  `viewer_event_ai_consent` cuando el request tiene Bearer válido.
- `login` ya sigue devolviendo `biometric_consent` dentro del usuario.

---

## Estado de verificación

### Probado en runtime local

- `GET /me/consents`
- `POST /me/consents/biometric`
- `DELETE /me/consents/biometric`
- `POST /me/consents/event-ai/{event_id|slug}`
- `DELETE /me/consents/event-ai/{event_id|slug}`
- `GET /events/{event_id|slug}` autenticado para leer `viewer_event_ai_consent`

### Qué quedó verificado

- `GET /me/consents` devuelve `biometric_consent`, `terms_consent` y `event_ai_consents`
- biometric con versión vieja responde `CONSENT_VERSION_OUTDATED`
- event AI acepta slug y UUID
- el detalle autenticado del evento expone `viewer_event_ai_consent`
- revocar biometric revoca también los `event_ai` activos

### Conclusión para integración

Este slice de consents está **apto para integración frontend** con el
contrato aquí documentado.

---

## Decisión de integración

El frontend ya **no debe usar `localStorage` como fuente de verdad** para:

- consentimiento biométrico
- consentimiento AI por evento

Si Omar mantiene cache local temporal para UX, debe tratarla solo como
cache derivada de la API, no como estado canónico.

---

## Resumen ejecutivo para el LLM del frontend

- dejar de usar `localStorage` como fuente de verdad
- usar `GET /me/consents` para hidratar estado real
- usar `viewer_event_ai_consent` para decidir UX dentro del evento
- invalidar cache local derivada cuando se revoque biometric
- no inventar claves cortas: el shape real usa `biometric_consent` y `terms_consent`

---

## 1) `GET /me/consents`

### Response real

```json
{
  "biometric_consent": {
    "accepted": true,
    "accepted_at": "2026-06-21T12:00:00.000Z",
    "revoked_at": null,
    "policy_version": "v1"
  },
  "terms_consent": {
    "accepted": true,
    "accepted_at": "2026-06-20T00:00:00.000Z",
    "revoked_at": null,
    "policy_version": "v1"
  },
  "event_ai_consents": [
    {
      "event_id": "uuid",
      "event_slug": "maraton-guayaquil-2026",
      "accepted_at": "2026-06-21T13:00:00.000Z",
      "policy_version": "v1"
    }
  ]
}
```

### Uso recomendado

- `AccountPage` puede leer `biometric_consent.accepted`
- el frontend puede hidratar un lookup por evento usando
  `event_ai_consents`
- si hace falta un mapa rápido:
  - key: `event_slug` o `event_id`
  - value: `accepted_at`

---

## 2) `POST /me/consents/biometric`

### Request

```json
{
  "policy_version": "v1"
}
```

### Response real

**201**

```json
{
  "accepted_at": "2026-06-21T12:00:00.000Z",
  "policy_version": "v1"
}
```

### Reglas

- requiere sesión autenticada
- valida versión vigente
- si el usuario ya tiene uno activo con la misma versión, el backend lo
  trata de forma idempotente lógica

### Error relevante

- `CONSENT_VERSION_OUTDATED`

---

## 3) `DELETE /me/consents/biometric`

### Response real

**204 No Content**

### Efectos reales

- revoca el consentimiento biométrico activo
- revoca en cascada los `event_ai` activos del usuario
- borra físicamente **todas** las búsquedas faciales del usuario
  (`search_queries`) y sus resultados (`search_results`) en cascada,
  incluyendo los embeddings de selfie persistidos. No queda ningún
  embedding huérfano server-side.

### Impacto frontend

Después de esta llamada:

- `AccountPage` debe reflejar que ya no hay consentimiento biométrico
- el flujo de selfie debe volver a pedir consentimiento biométrico
- cualquier cache local derivada de `event_ai` debe invalidarse

---

## 4) `POST /me/consents/event-ai/{event_id|slug}`

### Request

```json
{
  "policy_version": "v1"
}
```

### Response real

**201**

```json
{
  "event_id": "uuid",
  "accepted_at": "2026-06-21T12:00:00.000Z"
}
```

### Reglas

- requiere usuario autenticado y email verificado
- acepta UUID o slug en el path
- exige consentimiento biométrico activo
- valida versión vigente

### Errores relevantes

- `EMAIL_NOT_VERIFIED`
- `BIOMETRIC_CONSENT_REQUIRED`
- `CONSENT_VERSION_OUTDATED`
- `EVENT_NOT_ACTIVE`
- `EVENT_RETENTION_EXPIRED`
- `NOT_FOUND`

---

## 5) `DELETE /me/consents/event-ai/{event_id|slug}`

### Response real

**204 No Content**

### Reglas

- acepta UUID o slug
- si el evento existe pero no hay consentimiento activo, igual responde
  `204` (idempotente sobre el consentimiento)
- si el `event_id`/slug no corresponde a ningún evento, responde
  `404 NOT_FOUND` (no es 204): el backend resuelve el evento antes de
  revocar
- sirve para limpieza explícita por evento si alguna vista lo necesitara

### Error relevante

- `NOT_FOUND` — evento inexistente

---

## 6) `GET /events/{event_id|slug}` autenticado

### Campo adicional

Si el request incluye Bearer válido, event detail puede incluir:

```json
{
  "viewer_event_ai_consent": {
    "accepted": true,
    "accepted_at": "2026-06-21T12:00:00.000Z",
    "revoked_at": null,
    "policy_version": "v1"
  }
}
```

Si el usuario está autenticado pero no ha aceptado, el campo igual puede
venir con:

```json
{
  "viewer_event_ai_consent": {
    "accepted": false,
    "accepted_at": null,
    "revoked_at": null,
    "policy_version": "v1"
  }
}
```

### Uso recomendado

Esto sirve para decidir si abrir el disclaimer del evento sin depender de
un helper local viejo.

---

## Cómo reemplazar los helpers actuales del frontend

### `biometric-consent-storage.ts`

Reemplazar:

- `hasBiometricConsent()` → leer `user.biometric_consent` o `GET /me/consents`
- `recordBiometricConsent()` → `POST /me/consents/biometric`
- `revokeBiometricConsent()` → `DELETE /me/consents/biometric`

### `event-ai-consent-storage.ts`

Reemplazar:

- `hasEventAIConsent(userId, eventId)` → usar `viewer_event_ai_consent`
  del event detail o el resultado de `GET /me/consents`
- `recordEventAIConsent(userId, eventId)` →
  `POST /me/consents/event-ai/{event_id|slug}`

---

## Recomendación práctica para Omar

1. crear `lib/api/consents.ts`
2. crear adapters/tipos de red explícitos
3. dejar `EventGalleryPage` leyendo el estado desde backend
4. dejar `AccountPage` revocando contra backend real
5. invalidar cualquier cache local derivada cuando se revoque biometric
