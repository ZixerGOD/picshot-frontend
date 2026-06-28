# Admin — Events

Slice del panel admin para gestionar eventos: crear (con packs), editar,
transicionar estado, asignar/desasignar fotógrafos y eliminar.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/events`
- `POST /admin/events`
- `GET /admin/events/{event_id}`
- `PATCH /admin/events/{event_id}`
- `DELETE /admin/events/{event_id}`
- `POST /admin/events/{event_id}/photographers/{photographer_id}`
- `DELETE /admin/events/{event_id}/photographers/{photographer_id}`
- `GET /admin/event-types`
- `POST /admin/event-types`
- `PATCH /admin/event-types/{event_type_id}`
- `DELETE /admin/event-types/{event_type_id}`

## Regla de integración

- el admin ve **todos** los estados (incluye `draft`, `archived`,
  `retention_expired`); el catálogo público no
- los packs se crean/editan **inline con el evento** (no hay endpoint de packs
  aparte): el array `packs` viaja en el body de create y de PATCH
- `retention_until` lo **calcula el backend** (`date` + 6 meses); el FE no lo manda
- `slug` se autogenera del título si no se envía
- dinero en centavos enteros; fechas `YYYY-MM-DD` (date) o ISO-8601 (timestamps)
- `type` es la `key` de un tipo del catálogo gestionable (ver sección de tipos),
  **no** un enum fijo: un valor inexistente o inactivo → `VALIDATION_ERROR`
- `closes_at` (ISO-8601 UTC, opcional/nullable) programa el auto-cierre del evento
  (ver sección de auto-cierre)

---

## 1) `GET /admin/events`

### Query (opcional)

- `q` (busca título/slug/ciudad), `status`, `city`, `type`
- `sort` = `date_desc` (default) | `date_asc`
- `cursor`, `limit` (default 20, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "uuid", "slug": "maraton-guayaquil", "title": "...",
      "description": null, "banner_image_url": null, "cover_photo_url": null,
      "date": "2026-08-15", "city": "Guayaquil", "type": "marathon",
      "status": "active", "photo_count": 30, "runner_count": 5000,
      "retention_until": "2027-02-15", "base_price_cents": 500,
      "packs": [ { "key": "single", "price_cents": 500, "quantity": 1, "is_active": true } ],
      "created_at": "2026-06-26T00:00:00.000Z",
      "revenue_cents": 80000,
      "sales_count": 120,
      "assigned_photographer_ids": ["uuid", "uuid"]
    }
  ],
  "next_cursor": null
}
```

- `revenue_cents` = bruto de órdenes confirmadas del evento; `sales_count` = nº de
  ventas confirmadas; `assigned_photographer_ids` alimenta la columna "Fotógrafos"

---

## 2) `POST /admin/events`

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` — **requerido**

### Request

```json
{
  "title": "Maratón de Guayaquil",
  "slug": "maraton-guayaquil",
  "description": "...",
  "date": "2026-08-15",
  "city": "Guayaquil",
  "type": "marathon",
  "runner_count": 5000,
  "banner_image_url": "https://...",
  "cover_photo_url": "https://...",
  "base_price_cents": 500,
  "closes_at": "2026-09-15T00:00:00Z",
  "packs": [
    { "key": "single", "price_cents": 500,  "quantity": 1,    "is_active": true },
    { "key": "pack_3", "price_cents": 1200, "quantity": 3,    "is_active": true },
    { "key": "all",    "price_cents": 3000, "quantity": null, "is_active": true }
  ]
}
```

- `slug` opcional (autogenerado del título si falta); `description`,
  `runner_count`, `banner_image_url`, `cover_photo_url` opcionales
- `type` debe ser una `key` de un tipo **activo** del catálogo (ver sección de
  tipos); inválido/inactivo → `VALIDATION_ERROR`
- `closes_at` opcional (ISO-8601 UTC): fecha de auto-cierre. Omitirlo/`null` = sin
  auto-cierre (cierre manual). Ver sección de auto-cierre
- `packs` debe incluir un `single` con `is_active: true`; `all` lleva
  `quantity: null`

### Response `201`

El evento creado (mismo shape que un item de la lista). Nace `status: draft` y
con `retention_until = date + 6 meses`.

### Errores

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `PACK_SINGLE_REQUIRED` | falta el pack `single` activo | exigirlo en el PackEditor |
| `CONFLICT` | el `slug` ya existe | pedir otro título/slug |
| `VALIDATION_ERROR` | body inválido | mostrar validación |

---

## 3) `GET /admin/events/{event_id}`

> Ver el mapa completo de KPIs y el modelo del split en [earnings-kpis.md](./earnings-kpis.md).

Detalle: el shape de la lista + `assigned_photographers` (datos de cada fotógrafo
asignado) + un bloque `earnings` (las ganancias del evento y a quién se le paga cuánto).

### Response `200`

```json
{
  "...campos del item de la lista...",
  "assigned_photographers": [
    { "id": "uuid", "first_name": "Foto", "last_name": "Grafo", "email": "..." }
  ],
  "earnings": {
    "gross_cents": 120000,
    "platform_commission_cents": 24000,
    "payphone_fee_cents": 6900,
    "picshot_net_cents": 17100,
    "pool_cents": 96000,
    "assigned_count": 10,
    "per_photographer": [
      { "photographer_id": "uuid", "name": "Seed Photographer", "earnings_cents": 9600 }
    ]
  }
}
```

- el bloque `earnings` es la pantalla "ganancias del evento / a quién se paga cuánto":
  - `gross_cents` — bruto total vendido del evento (packs + fotos sueltas).
  - `platform_commission_cents` — 20% del bruto (comisión de la plataforma).
  - `payphone_fee_cents` — 5.75% del bruto (fee del procesador).
  - `picshot_net_cents` — 14.25% del bruto (utilidad neta de Picshot).
  - `pool_cents` — 80% del bruto (el **pozo** que se reparte entre los asignados).
  - `assigned_count` — N de fotógrafos asignados (el divisor del pozo).
  - `per_photographer[]` — cada asignado con su parte (`earnings_cents` = `pool_cents` ÷ N,
    en partes iguales, **haya vendido o no**). Suma exactamente `pool_cents`.
- el cálculo es **en vivo**: cambia con las ventas y con asignar/desasignar fotógrafos.
  Un evento con ventas pero `assigned_count: 0` muestra `pool_cents > 0` con
  `per_photographer: []` (pozo huérfano: plata sin a quién pagar). Ver [earnings-kpis.md](./earnings-kpis.md).
- `404 NOT_FOUND` si no existe o fue eliminado

---

## 4) `PATCH /admin/events/{event_id}`

Body **parcial**: campos del create **excepto `slug` y `date`** (no editables) + `status`.
Incluye `closes_at` (mandar `null` para limpiar el auto-cierre) y `type` (validado
contra el catálogo activo, igual que en create).

### Transiciones de estado válidas

`draft → active → closed → archived` (y se puede archivar desde `active`/`closed`).
Una transición inválida devuelve `409 CONFLICT`. El admin **no** setea
`retention_expired` (eso lo hace el cron).

### Packs

Si se incluye `packs`, **reemplaza** todos los packs del evento (no hace merge),
manteniendo el invariante del `single` activo (`PACK_SINGLE_REQUIRED` si falta).

### Response `200`

El evento actualizado. `404 NOT_FOUND` si no existe.

---

## 5) `DELETE /admin/events/{event_id}`

### Response `204`

- es un **soft delete**: el evento se marca como eliminado y desaparece de todas
  las listas. Para el ciclo de vida normal usar `PATCH status` (cerrar/archivar).
- **cascada** (en la misma transacción): las fotos vendibles del evento pasan a
  `hidden` (dejan de comprarse y de aparecer en búsquedas), los carts que las
  referencian se purgan, y los cupones del evento se desactivan. **Los archivos y
  las órdenes/ventas confirmadas se conservan** (no es borrado físico).
- `404 NOT_FOUND` si no existe

---

## 6) Asignar / desasignar fotógrafo

- `POST /admin/events/{event_id}/photographers/{photographer_id}` → **201**
  `{ event_id, photographer_id, assigned_at }`. **Idempotente**: re-asignar
  devuelve la asignación existente (201).
- `DELETE /admin/events/{event_id}/photographers/{photographer_id}` → **204**.
  **Las fotos ya subidas por ese fotógrafo se conservan** (atribución/earnings).
- `404 NOT_FOUND` si el evento o el fotógrafo no existen (assign), o si no estaba
  asignado (unassign).
- solo los fotógrafos asignados pueden subir fotos al evento, y un fotógrafo solo
  ve sus eventos asignados en `GET /photographer/events`

---

## 7) Auto-cierre por fecha (`closes_at`)

El admin puede programar el cierre automático de un evento:

- `closes_at` (ISO-8601 UTC, **nullable**) se setea en `POST`/`PATCH /admin/events`.
- Un cron pasa el evento de `active` a `closed` cuando `closes_at` ya venció (el
  admin **no** dispara la transición a mano).
- `null`/ausente = sin auto-cierre (se cierra manual vía `PATCH status`).
- El campo se expone como `closes_at` en la lista y el detalle del evento admin.
- `closed` saca al evento del catálogo público destacado, pero **las fotos siguen
  siendo comprables** (se vende también después del evento). Para retirarlo de venta,
  pasar a `archived`.

Implicación para el frontend: el form de edición puede ofrecer un date-time picker
opcional para `closes_at`; mostrarlo en el detalle; y no asumir que un evento `closed`
ya no vende.

---

## 8) Tipos de evento (catálogo gestionable)

El `type` de un evento es una `key` de este catálogo (ya no un enum hardcodeado). El
público lee solo los activos en `GET /event-types` (ver [events-public.md](./events-public.md)).

- `GET /admin/event-types` → `{ "event_types": [{ id, key, label, is_active, position }] }`
  (todos, activos e inactivos).
- `POST /admin/event-types` → body `{ key, label, position? }`. `key` en `lower_snake`
  (máx 40), único. Si ya existe (incluso si está **inactivo**) → `CONFLICT`: para reusar
  una `key` desactivada **no** se recrea, se reactiva con `PATCH is_active:true`. Response 201.
- `PATCH /admin/event-types/{event_type_id}` → body parcial `{ label?, is_active?, position? }`.
  Reactivar = `is_active:true`. `NOT_FOUND` si no existe.
- `DELETE /admin/event-types/{event_type_id}` → **soft-delete** (`is_active:false`, no borra
  la fila). Los eventos existentes con esa `key` quedan intactos; solo deja de ofrecerse para
  nuevos. Response 204.
- Crear/editar un evento (o el form de contacto) con un `type` inexistente o inactivo →
  `VALIDATION_ERROR`.

Implicación para el frontend: el dropdown de `type` del form de evento sale de
`GET /admin/event-types` (mostrar `label`, enviar `key`); puede haber una pantalla de
gestión del catálogo (crear/renombrar/activar-desactivar/reordenar).

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/events.ts` real que:

- haga `GET /admin/events` (con filtros + cursor)
- haga `POST /admin/events` (con `Idempotency-Key`, packs inline)
- haga `GET/PATCH/DELETE /admin/events/:id`
- haga assign/unassign de fotógrafos
- convierta el form a `snake_case`, derive `retention_until` del backend (no
  enviarla), y use USD (no €)
- la lista de fotógrafos disponibles sale de `GET /admin/photographers`; los ya
  asignados, de `assigned_photographer_ids` del evento

---

## Qué pantallas debe tener el frontend

### `AdminEventsPage` (`/admin/eventos`)

- tabla con `GET /admin/events` (incluir `draft`/`archived`/`retention_expired`)
- columnas: evento, tipo, estado, fotos (`photo_count`), fotógrafos
  (`assigned_photographer_ids.length`), precio base / packs, ingresos
  (`revenue_cents`)

### `AdminEventCreatePage` (`/admin/eventos/nuevo`)

- form con título, fecha, ciudad, tipo, participantes, imágenes, descripción
- `PackEditor` (single requerido) → arma el array `packs`
- `Idempotency-Key` nuevo por intento

### `AdminEventDetailPage` (`/admin/eventos/:eventId`)

- `GET /admin/events/:id` (con `assigned_photographers` y `earnings`)
- editar campos + packs (`PATCH`), transicionar estado (activar/cerrar/archivar)
- tab Fotógrafos: asignar/desasignar
- tab/sección Ganancias: pozo (`earnings.pool_cents`), comisión/utilidad
  (`platform_commission_cents` / `picshot_net_cents`) y tabla "a quién se paga
  cuánto" (`earnings.per_photographer`)
- eliminar (soft)

---

## Qué NO debe hacer Omar / el LLM del frontend

- no mandar `retention_until` (la calcula el backend)
- no esperar un endpoint de packs aparte: van inline en create/PATCH
- no hacer merge de packs en PATCH: es **reemplazo total** del array
- no asumir que DELETE borra de verdad (es soft); usar archivar para el ciclo de vida
- no forzar transiciones de estado ilegales (devuelven `CONFLICT`)
- no asumir `camelCase` ni moneda con símbolo: `snake_case`, USD en centavos
- no exponer `photographer_id` en vistas públicas

---

## Modelo mental correcto

- el admin tiene control total (con soft delete); el ciclo de vida real es por
  estado (`draft→active→closed→archived`)
- packs = parte del evento; asignaciones = pivote evento↔fotógrafo que habilita
  el upload y el panel del fotógrafo
- el backend hace el scoping de rol y la consistencia (slug único, single pack,
  retención)

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (incl. transiciones, idempotencia, aislamiento de rol)
- **E2E real contra DB**: crear (slug auto + retención +6m + draft), `CONFLICT` por
  slug, `PACK_SINGLE_REQUIRED`, list/detail con agregados, transición válida e
  inválida (`CONFLICT`), **asignar y verificar que el fotógrafo lo ve en
  `/photographer/events`**, desasignar, soft delete, y aislamiento (photographer →
  403)
