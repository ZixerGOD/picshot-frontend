# Admin — Photographers

Primer slice del panel admin: gestionar fotógrafos (listar, crear con
invitación, editar, desactivar/eliminar).

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/photographers`
- `POST /admin/photographers`
- `PATCH /admin/photographers/{photographer_id}`
- `DELETE /admin/photographers/{photographer_id}`

## Regla de integración

- el admin **crea** la cuenta del fotógrafo; no hay auto-registro
- al crear, el backend genera un token de invitación y "envía" un email con
  un link a `/set-password`. El fotógrafo fija ahí su contraseña (ver
  `account.md` → `POST /auth/set-password`)
- la respuesta del create **no devuelve el token** (va por email). En
  desarrollo, el link/token llega en un campo `debug` para poder probar
- `commission_rate` se maneja como **decimal** (`0.70` = 70%)

---

## 1) `GET /admin/photographers`

Lista paginada con agregados por fotógrafo.

### Headers

- `Authorization: Bearer <token>`

### Query (opcional)

- `q` — busca por nombre/email
- `is_active` — `"true"` | `"false"`
- `cursor`
- `limit` (default 20, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "019f05a1-c5cf-72e0-9dc0-ef0c5f6772d0",
      "first_name": "Nuevo",
      "last_name": "Fotografo",
      "email": "fotografo@picshot.test",
      "phone": "+593988888888",
      "identification": "0911111111",
      "city": "Quito",
      "commission_rate": 0.65,
      "is_active": true,
      "invited_at": "2026-06-26T00:00:00.000Z",
      "last_login_at": null,
      "assigned_events": [ { "id": "019eed3f-...", "title": "Maratón de Guayaquil" } ],
      "uploaded_count": 20,
      "sales_count": 4,
      "gross_cents": 2000,
      "net_cents": 1885
    }
  ],
  "next_cursor": null
}
```

### Notas reales

- `is_active` en el query es **string** (`"true"`/`"false"`)
- los agregados (`uploaded_count`, `sales_count`, `gross_cents`, `net_cents`)
  cuentan solo órdenes confirmadas
- paginar con `next_cursor`

---

## 2) `POST /admin/photographers`

Crea el fotógrafo y dispara la invitación.

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` — **requerido**

### Request

```json
{
  "first_name": "Nuevo",
  "last_name": "Fotografo",
  "email": "fotografo@picshot.test",
  "phone": "+593988888888",
  "identification": "0911111111",
  "city": "Quito",
  "commission_rate": 0.65
}
```

- `phone` es opcional; el resto requerido
- `commission_rate` decimal entre `0` y `1`
- **no se piden datos bancarios** (los pagos los maneja el admin aparte)

### Response `201`

```json
{
  "photographer": { /* mismo shape que un item de la lista */ },
  "invite_sent": true
}
```

- en **desarrollo** la respuesta trae además un `debug: { token, url }` con el
  link de set-password (para probar sin email real)
- el fotógrafo nace `is_active: false` hasta que acepta la invitación
  (set-password) — eso lo deja `is_active: true`

### Errores

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `EMAIL_EXISTS` | ya hay cuenta con ese email | error en el campo email |
| `IDENTIFICATION_INVALID` | cédula/RUC con formato inválido (10 o 13 dígitos) | corregir input |
| `VALIDATION_ERROR` | body inválido (campos faltantes/mal) | mostrar validación |

---

## 3) `PATCH /admin/photographers/{photographer_id}`

Edita y/o activa-desactiva. Body **parcial**.

### Request

```json
{
  "first_name": "...",
  "last_name": "...",
  "phone": "...",
  "city": "...",
  "commission_rate": 0.5,
  "is_active": false
}
```

### Response `200`

El fotógrafo actualizado (mismo shape que un item de la lista).

- `404 NOT_FOUND` si el `photographer_id` no existe, no es un fotógrafo, o ya
  fue eliminado (soft delete)

### Notas reales

- desactivar = `{ "is_active": false }`; reactivar = `{ "is_active": true }`.
  No hay endpoint aparte para esto
- un fotógrafo desactivado **no puede loguear** (las sesiones se invalidan
  contra `is_active` en cada request)

---

## 4) `DELETE /admin/photographers/{photographer_id}`

### Response `204`

- `404 NOT_FOUND` si el `photographer_id` no existe, no es un fotógrafo, o ya
  fue eliminado
- es un **soft delete**: la cuenta se marca borrada e inactiva, se desasigna
  de todos sus eventos y se le revocan las sesiones
- **sus fotos publicadas se conservan** (atribución/ventas históricas), por
  eso no es un borrado físico

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/photographers.ts` real que:

- haga `GET /admin/photographers` (con `q`, `is_active`, cursor)
- haga `POST /admin/photographers` (con `Idempotency-Key`)
- haga `PATCH /admin/photographers/:id`
- haga `DELETE /admin/photographers/:id`
- convierta el form: usar `snake_case` y `commission_rate` decimal
- sumar al form los campos del contrato que el FE mock no tenía: `phone`,
  `identification`. (Banco **no** va.)

---

## Qué pantallas debe tener el frontend

### `AdminPhotographersPage` (`/admin/fotografos`)

- tabla con `GET /admin/photographers` (nombre, email, comisión, fotos,
  ventas, bruto/neto, último login, eventos asignados, estado)
- crear fotógrafo (form → `POST`), generando un `Idempotency-Key` nuevo por
  intento
- editar / activar-desactivar (`PATCH`)
- eliminar (`DELETE`, soft)
- (asignar fotógrafos a eventos es de **otro** slice admin: admin-events)

---

## Qué NO debe hacer Omar / el LLM del frontend

- no esperar el token de invitación en la respuesta de producción (va por
  email; en dev viene en `debug`)
- no mandar `commission_rate` en basis points: es decimal (`0.70`)
- no pedir datos bancarios en el form
- no reintentar el `POST` sin un `Idempotency-Key` (es requerido); reusar la
  misma key para el mismo intento (replay seguro)
- no asumir que el fotógrafo recién creado puede loguear (está inactivo hasta
  el set-password)
- no asumir `camelCase`: la red manda `snake_case`

---

## Modelo mental correcto

- crear fotógrafo = crear la cuenta + invitación; el fotógrafo se activa solo
  cuando acepta (set-password)
- desactivar/eliminar nunca destruye la atribución de las fotos ya subidas
- el admin gestiona; el backend hace el scoping de rol y la consistencia

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (incl. idempotencia y aislamiento de rol)
- **E2E real contra DB**: loop completo (admin crea → token → set-password →
  login del nuevo fotógrafo), idempotency replay sin duplicar,
  `EMAIL_EXISTS`/`IDENTIFICATION_INVALID`, desactivar → login 403, soft
  delete, y aislamiento (customer/photographer → 403)
