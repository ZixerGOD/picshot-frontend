# Auth — comportamiento real actual del backend

Documento orientado a integración frontend.  
Describe lo que el backend **devuelve hoy**, no el mock anterior del
frontend ni el contrato imaginado.

Base path asumido: `/api/v1`

---

## Alcance actual

### Implementado

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/refresh` ✅ (2026-06-27 — rotación de sesión)

### Cubierto en otras guías

- `POST /auth/set-password`, `POST /auth/logout-all`, `POST /me/change-password` y
  `POST /me/marketing/unsubscribe` → ver [`account.md`](./account.md).

---

## Estado de verificación

### Probado en runtime local

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`

### Qué quedó verificado

- register crea usuario y devuelve `verification_sent`
- en development puede devolver `debug.token` y `debug.url`
- login bloquea usuarios no verificados con `EMAIL_NOT_VERIFIED`
- verify-email habilita login real
- forgot-password devuelve respuesta neutra `202`
- reset-password rechaza reutilizar la contraseña actual con `PASSWORD_REUSED`
- reset-password invalida la contraseña vieja y permite login con la nueva

### Conclusión para integración

Este slice de auth está **apto para integración frontend** con el
contrato aquí documentado.

---

## Reglas globales

- request y response JSON usan `snake_case`
- errores siempre salen como:

```json
{
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "Technical message in English.",
    "details": {}
  }
}
```

- `access_token` viene en el body del login
- `refresh_token` viene en cookie `httpOnly`
- en non-production algunos endpoints agregan `debug` para QA local

---

## Por qué el frontend debe adaptarse

El frontend anterior estaba modelado alrededor de responses más simples
o mockeadas.

Ejemplos de diferencias reales:

- login devuelve `access_token`, no `token`
- register devuelve `verification_sent`, no un token usable directo
- reset-password devuelve `204 No Content`
- algunos endpoints son neutrales por seguridad aunque el usuario no exista

La integración correcta es mapear el backend real en `lib/api/auth.ts`
o equivalente.

---

## Modelos útiles

### `AuthLoginUser`

```json
{
  "id": "uuid",
  "email": "even@example.com",
  "first_name": "Even",
  "last_name": "Fierro",
  "role": "customer",
  "email_verified": true,
  "is_active": true,
  "marketing_opt_in": false,
  "biometric_consent": {
    "accepted": false,
    "accepted_at": null,
    "revoked_at": null,
    "policy_version": "v1"
  },
  "terms_consent": {
    "accepted": true,
    "accepted_at": "2026-06-21T00:00:00.000Z",
    "revoked_at": null,
    "policy_version": "v1"
  },
  "password_breached_after_login": false,
  "created_at": "2026-06-21T00:00:00.000Z"
}
```

### `debug` — solo non-production

```json
{
  "debug": {
    "token": "<opaque-token>",
    "url": "http://localhost:5173/verificar-email?token=..."
  }
}
```

Este campo **no debe asumirse** en production.

---

## Resumen ejecutivo para el LLM del frontend

- usar `access_token`, no `token`
- ante 401 en una request autenticada, llamar `POST /auth/refresh` **una sola vez**
  (nunca en paralelo — rota el token) y reintentar; si refresh falla, ir a login
- no depender del objeto `debug` fuera de desarrollo local
- mapear errores por `error.code`
- tratar `204 No Content` como success real en reset-password

---

## Endpoints

### `POST /auth/register`

#### Request

```json
{
  "first_name": "Even",
  "last_name": "Fierro",
  "email": "even@example.com",
  "password": "Picshot2026",
  "marketing_opt_in": false,
  "accepted_terms": true,
  "accepted_terms_version": "v1"
}
```

#### Qué hace el backend

- normaliza email a lowercase
- valida password policy + HIBP
- exige `accepted_terms=true`
- exige versión actual de términos
- crea usuario
- crea consentimiento `terms`
- crea token de verificación

#### Success

**201**

```json
{
  "email": "even@example.com",
  "verification_sent": true
}
```

En non-production puede incluir además `debug`.

#### Errores esperados

- `EMAIL_EXISTS`
- `WEAK_PASSWORD`
- `PASSWORD_BREACHED`
- `TERMS_NOT_ACCEPTED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`

#### Nota de integración

No esperar `pendingVerificationToken`.  
El backend real devuelve `verification_sent` y opcionalmente `debug`.

---

### `POST /auth/login`

#### Request

```json
{
  "email": "even@example.com",
  "password": "Picshot2026",
  "remember_me": false
}
```

#### Qué hace el backend

- normaliza email
- aplica rate limit
- revisa lockout
- valida bcrypt
- exige email verificado
- exige usuario activo
- crea sesión de refresh
- genera `access_token`
- setea cookie `refresh_token`
- revisa HIBP como advisory post-login

#### Success

**200**

```json
{
  "access_token": "<jwt>",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "even@example.com",
    "first_name": "Even",
    "last_name": "Fierro",
    "role": "customer",
    "email_verified": true,
    "is_active": true,
    "marketing_opt_in": false,
    "biometric_consent": {
      "accepted": false,
      "accepted_at": null,
      "revoked_at": null,
      "policy_version": "v1"
    },
    "terms_consent": {
      "accepted": true,
      "accepted_at": "2026-06-21T00:00:00.000Z",
      "revoked_at": null,
      "policy_version": "v1"
    },
    "password_breached_after_login": false,
    "created_at": "2026-06-21T00:00:00.000Z"
  }
}
```

#### Cookie

También llega `refresh_token` como cookie:

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Secure=true` solo en production
- `maxAge=7d` o `30d` según `remember_me`

#### Errores esperados

- `INVALID_CREDENTIALS`
- `EMAIL_NOT_VERIFIED`
- `ACCOUNT_DISABLED`
- `ACCOUNT_LOCKED`
- `RATE_LIMITED`

#### Nota de integración

No esperar `token`.  
El backend real devuelve `access_token`.

---

### `POST /auth/refresh`

Canjea la cookie `refresh_token` por un nuevo `access_token`, **rotando** el refresh
(cada refresh emite un refresh nuevo y revoca el viejo). Cómo el front lo usa: cuando una
request autenticada devuelve **401** (access expiró a los 15 min), llamar a este endpoint
**una vez** y reintentar la request original con el nuevo `access_token`.

#### Request

- **Sin body.** Usa la cookie `refresh_token` (se envía automática si el front hace fetch
  con `credentials: 'include'`). No requiere `Authorization`.

#### Success

**200** — mismo shape que login: `{ access_token, expires_in: 900, user }`. Además setea
una **nueva** cookie `refresh_token` (mismas flags que login).

#### Errores

- `UNAUTHENTICATED` (401) — no llegó la cookie.
- `INVALID_TOKEN` (401) — refresh inválido/expirado/ya usado. El backend **borra la
  cookie**. El front debe **redirigir a login** (no reintentar).
- `ACCOUNT_DISABLED` (403) — cuenta desactivada.

#### Notas de integración (importante)

- **No hagas refresh en paralelo.** Si varias requests fallan con 401 a la vez, dispará
  **un solo** `/auth/refresh` y encolá las demás hasta que termine (un interceptor con un
  "refresh en curso" compartido). El refresh **rota** el token: dos refresh concurrentes
  con la misma cookie → el segundo ve el token ya rotado y el backend lo trata como
  **reuso** → revoca **todas** las sesiones del usuario (lo desloguea de todos lados). Por
  eso el front nunca debe disparar dos refresh simultáneos del mismo token.
- Tras `INVALID_TOKEN`/`UNAUTHENTICATED` en refresh → ir a login; no hay forma de
  recuperar la sesión.

---

### `POST /auth/forgot-password`

#### Request

```json
{
  "email": "even@example.com"
}
```

#### Qué hace el backend

- aplica rate limit
- si el usuario existe y está activo, crea token `password_reset`
- responde de forma neutral

#### Success

**202**

```json
{
  "queued": true
}
```

En non-production puede incluir `debug`.

#### Errores esperados

- `VALIDATION_ERROR`
- `RATE_LIMITED`

#### Nota de integración

No depender de recibir `{ token }`.

---

### `POST /auth/reset-password`

#### Request

```json
{
  "token": "<opaque-token>",
  "password": "NewPassword1"
}
```

#### Qué hace el backend

- valida token `password_reset`
- valida policy + HIBP
- bloquea reutilizar la contraseña actual
- actualiza `password_hash`
- consume el token
- revoca sesiones activas

#### Success

**204 No Content**

#### Errores esperados

- `INVALID_TOKEN_PURPOSE`
- `EXPIRED_TOKEN_PURPOSE`
- `WEAK_PASSWORD`
- `PASSWORD_BREACHED`
- `PASSWORD_REUSED`

---

### `POST /auth/verify-email`

#### Request

```json
{
  "token": "<opaque-token>"
}
```

#### Success

**200** con body:

```json
{ "email": "even@example.com" }
```

(No es `204`. Tratar `200` como verificación exitosa.)

#### Errores esperados

- `INVALID_TOKEN_PURPOSE`
- `EXPIRED_TOKEN_PURPOSE`

---

### `POST /auth/resend-verification`

#### Request

```json
{
  "email": "even@example.com"
}
```

#### Success

**202**

```json
{
  "queued": true
}
```

En non-production puede incluir `debug`.

#### Errores esperados

- `VALIDATION_ERROR`
- `RATE_LIMITED`

---

## Recomendación de implementación frontend

1. Normalizar todos los adapters auth en una sola capa `lib/api`.
2. Tratar `error.code` como fuente de verdad.
3. No depender del campo `debug`.
4. Manejar `204` en reset-password; **verify-email devuelve `200 { email }`** (no 204).
