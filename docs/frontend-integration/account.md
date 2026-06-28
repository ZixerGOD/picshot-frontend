# Account

Este slice cubre la gestión de la cuenta del usuario: ver/editar perfil,
cambiar contraseña, cerrar sesión en todos los dispositivos, marketing, y el
set-password del fotógrafo invitado.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /me`
- `PATCH /me`
- `POST /me/change-password`
- `POST /me/marketing/unsubscribe`
- `POST /auth/logout-all`
- `POST /auth/set-password` — set inicial del fotógrafo invitado

## Regla de integración

- el `user` que devuelve `GET /me` es **el mismo shape** que el `user` del
  login. No inventar campos
- el **email no se edita** desde el panel (cambio de email queda fuera de
  alcance; se maneja por soporte)
- `change-password` mantiene **viva la sesión actual** y revoca las otras;
  `logout-all` revoca **todas** (incluida la actual → toca re-login)

---

## 1) `GET /me`

Relee el perfil del usuario autenticado.

### Headers

- `Authorization: Bearer <token>`

### Response `200`

```json
{
  "id": "019f01e8-1074-72b3-8cdd-b286dcbbc528",
  "email": "user@picshot.test",
  "first_name": "Test",
  "last_name": "User",
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
    "accepted_at": "2026-06-26T03:10:13.620Z",
    "revoked_at": null,
    "policy_version": "v1"
  },
  "password_breached_after_login": false,
  "created_at": "2026-06-26T03:10:13.620Z"
}
```

### Uso recomendado

`AccountPage` llama `GET /me` al cargar para tener el perfil fresco (no
depender solo del `user` que quedó en memoria del login).

---

## 2) `PATCH /me`

Edita el perfil. Body **parcial**: solo manda lo que cambia.

### Request

```json
{
  "first_name": "Nuevo",
  "last_name": "Nombre",
  "marketing_opt_in": true
}
```

- campos editables: `first_name`, `last_name`, `marketing_opt_in`
- **email NO** es editable (si lo mandas, se ignora)

### Response `200`

El `user` actualizado (mismo shape que `GET /me`).

---

## 3) `POST /me/change-password`

### Request

```json
{
  "current_password": "ActualPass1",
  "new_password": "NuevaPass2"
}
```

### Response `204`

- revoca las **otras** sesiones del usuario; la sesión actual sigue viva
- la confirmación de contraseña (`confirm_password`) se valida **en el
  frontend**; el backend solo recibe `new_password`

### Errores

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `INVALID_CREDENTIALS` | la contraseña actual está mal | error en el campo actual |
| `WEAK_PASSWORD` | no cumple la política (8+, mayúscula, dígito) | mostrar requisitos |
| `PASSWORD_BREACHED` | aparece en filtraciones conocidas | pedir otra |
| `PASSWORD_REUSED` | es igual a la actual | pedir una distinta |

---

## 4) `POST /me/marketing/unsubscribe`

Dual: funciona **público con token** (link del email) **o** autenticado.

### Request

```json
{ "token": "..." }
```

- **con token** (link de email de marketing): no requiere `Authorization`
- **sin token**: requiere `Authorization` (es el toggle del usuario logueado)

### Response `200`

```json
{ "marketing_opt_in": false }
```

- nota: estando logueado, también se puede apagar marketing con
  `PATCH /me { "marketing_opt_in": false }`

> **Página de baja (2026-06-27):** el correo de marketing ya está activo. Su link de
> "Cancelar suscripción" apunta a **`/cancelar-suscripcion?token=...`** (sobre
> `FRONTEND_PUBLIC_URL`). Omar debe crear esa página: lee el `token` del query y hace
> `POST /me/marketing/unsubscribe { token }` (público, sin login) → muestra confirmación.
> El endpoint es **idempotente**: un token ya consumido o expirado igual responde **200
> `{ marketing_opt_in: false }`** (segundo click → mostrar "ya estás dado de baja", no un
> error). Solo un token **inválido de verdad** (que nunca existió) responde **401**
> `INVALID_TOKEN_PURPOSE` → ahí sí mostrar "enlace inválido".

---

## 5) `POST /auth/logout-all`

### Headers

- `Authorization: Bearer <token>`

### Response `204`

- revoca **todas** las sesiones (incluida la actual)
- tras esto el frontend debe limpiar su estado de sesión y mandar al login

---

## 6) `POST /auth/set-password`

Set inicial de contraseña del **fotógrafo invitado** (el admin lo crea y le
llega un email con el link `/set-password?token=...`).

### Request

```json
{ "token": "...", "password": "MiPass123" }
```

### Response `204`

- deja la cuenta `email_verified: true` + `is_active: true` → ya puede
  loguear

### Errores

| Code | HTTP | Qué significa |
|---|---|---|
| `INVALID_TOKEN_PURPOSE` | 401 | token inválido o de otro tipo |
| `EXPIRED_TOKEN_PURPOSE` | 410 | token expirado (7 días) o ya usado |
| `WEAK_PASSWORD` | 422 | no cumple política |
| `PASSWORD_BREACHED` | 422 | filtrada |

---

## Adaptación recomendada al frontend

Crear un `lib/api/account.ts` real que:

- haga `GET /me` (refetch de perfil)
- haga `PATCH /me`
- haga `POST /me/change-password`
- haga `POST /me/marketing/unsubscribe`
- haga `POST /auth/logout-all`
- y un `lib/api/auth.ts` que sume `POST /auth/set-password`

---

## Qué pantallas debe tener el frontend

### 1) `AccountPage` (`/mi-cuenta`)

- mostrar perfil desde `GET /me`
- editar nombre / marketing con `PATCH /me`
- cambiar contraseña con `POST /me/change-password`
- "cerrar sesión en todos los dispositivos" con `POST /auth/logout-all`
- (consentimiento biométrico vive en el slice de consents)

### 2) `UnsubscribePage` (`/cancelar-suscripcion`)

- si llega `?token=...`, hacer `POST /me/marketing/unsubscribe { token }`
  sin requerir login
- mostrar confirmación de `marketing_opt_in: false`

### 3) `SetPasswordPage` (`/set-password`)

- leer `?token=...`
- pedir contraseña (con confirmación en cliente)
- `POST /auth/set-password { token, password }`
- en `204`, mandar al login

---

## Qué NO debe hacer Omar / el LLM del frontend

- no intentar editar el email vía `PATCH /me`
- no mandar `confirm_password` al backend (eso se valida en cliente)
- no asumir que tras `change-password` hay que re-login (la sesión actual
  sigue); **sí** re-login tras `logout-all`
- no inventar campos del `user`: usar el shape tal cual
- no asumir `camelCase`: la red manda `snake_case`

---

## Modelo mental correcto

- `GET /me` es la fuente de verdad del perfil
- `change-password` ≠ `logout-all`: uno conserva tu sesión, el otro la mata
- el unsubscribe por token es público (viene de un email); el toggle
  autenticado es equivalente a `PATCH /me`

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas de account + auth (set-password, logout-all)
- **E2E real contra DB**: GET/PATCH `/me`, change-password (sesión actual
  viva, las otras revocadas, login viejo falla / nuevo funciona),
  logout-all (token rechazado después), unsubscribe por token y autenticado,
  y el loop de set-password del fotógrafo invitado
