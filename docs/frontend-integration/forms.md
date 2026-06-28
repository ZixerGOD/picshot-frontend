# Public Forms

Dos formularios **públicos** (sin login): `Contacto` (`/contacto`) y `Trabaja con
nosotros` (`/trabaja-con-nosotros`). Ambos guardan la solicitud y devuelven un `id`.

Base path asumido: `/api/v1`

## Qué existe hoy

- `POST /contact-requests`
- `POST /staff-applications`

(No requieren auth. No hay subida de archivos, ni captcha, ni endpoint para
leer/gestionar las submissions desde el frontend — eso es interno del admin.)

## Regla de integración

- son **públicos**: no se manda `Authorization`.
- payloads `snake_case`; respuesta `201 { "id": "uuid" }` (solo el id; no hay
  número de seguimiento).
- **anti-spam en capas**:
  - **rate-limit por IP**: `3/min` y `10/hora`. Al excederlo → `429 RATE_LIMITED`
    con `details.retry_after_seconds`.
  - **honeypot**: ambos forms aceptan un campo opcional `website` (señuelo). El FE
    **debe** renderizarlo oculto (off-screen / `aria-hidden="true"` /
    `autocomplete="off"` / `tabindex="-1"`) y **dejarlo vacío** — un usuario real
    nunca lo llena. Si llega con valor, el backend **descarta** la submission en
    silencio: responde `201 { "id": ... }` igual (stealth, para no avisar al bot)
    pero **no** la guarda ni notifica. **No mandes `website`** (o mándalo vacío).
  - Turnstile (captcha) está **pendiente** (se sumará como tercera capa).
- requeridos vs opcionales: ver cada forma abajo.

---

## 1) `POST /contact-requests`

### Request

```json
{
  "full_name": "Ana Pérez",
  "email": "ana@example.com",
  "message": "Quiero fotos de mi maratón",
  "event_name": "Maratón Quito 2026",
  "phone": "+593999999999",
  "event_type": "marathon",
  "event_date": "2026-08-15"
}
```

- **requeridos**: `full_name`, `email`, `message`.
- **opcionales**: `event_name`, `phone`, `event_type`, `event_date`.
- `event_type` es la `key` de un tipo del catálogo gestionable (ya no un enum fijo).
  Llenar el dropdown con `GET /event-types` (mostrar `label`, enviar `key`); ver
  [events-public.md](./events-public.md). Un `event_type` que no esté en el catálogo
  activo → `VALIDATION_ERROR`.
- `event_date` formato `YYYY-MM-DD` (fechas imposibles → 400).
- `phone`: usar prefijo **`+593`** (Ecuador), no `+34`.

### Response `201`

```json
{ "id": "019f0987-b12e-77f1-a065-d4fe7eaa08ac" }
```

---

## 2) `POST /staff-applications`

### Request

```json
{
  "full_name": "Foto Grafo",
  "email": "foto@example.com",
  "city": "Guayaquil",
  "experience": "5 años cubriendo carreras de calle",
  "portfolio_url": "https://miportafolio.com",
  "social": "@usuario",
  "gear": "Canon R6 + 70-200 f/2.8"
}
```

- **requeridos**: `full_name`, `email`, `city`, `experience`.
- **opcionales**: `portfolio_url` (debe ser URL válida), `social`, `gear`.
- el portafolio es **solo un link** (no hay subida de archivos).

### Response `201`

```json
{ "id": "019f0987-b154-7c40-b7c9-3a02d0818671" }
```

---

## Errores

| Code | HTTP | Cuándo | Qué hace el frontend |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | falta un requerido / email inválido / `event_type` o `event_date` inválidos / `portfolio_url` no-URL | mostrar errores de campo (`details.fields`) |
| `RATE_LIMITED` | 429 | excedió 3/min o 10/hora desde esa IP | mostrar "intenta de nuevo en unos minutos"; respetar `retry_after_seconds` |

---

## Adaptación recomendada al frontend

Crear un `lib/api/forms.ts` real que:

- haga `POST /contact-requests` y `POST /staff-applications` (sin auth)
- mapee el form a `snake_case` (`full_name`, `event_type`, `event_date`, etc.)
- maneje el `429` con un mensaje amable usando `retry_after_seconds`
- corrija el placeholder de teléfono a `+593`
- muestre éxito al recibir `201` (el backend no devuelve mensaje ni tracking ID;
  el `id` puede usarse internamente pero no es un número de seguimiento al usuario)

---

## Qué NO debe hacer Omar / el LLM del frontend

- no mandar `Authorization` (son públicos)
- no esperar un mensaje de confirmación ni un "número de seguimiento" en la
  respuesta: solo `{ id }`
- no asumir subida de portafolio: es un `portfolio_url` (link)
- no olvidar el honeypot: render el campo `website` oculto y vacío (ver Regla de
  integración). No lo muestres ni lo prellenes
- no asumir `camelCase`: la red usa `snake_case`

---

## Modelo mental correcto

- el usuario envía la forma → se guarda como solicitud `pending` y se notifica al
  admin (hoy stub; SMTP real más adelante)
- la gestión de las solicitudes (leer/atender/aprobar) es interna del admin y no
  está expuesta al frontend público
- el anti-spam es en capas: rate-limit por IP (el FE maneja el `429`) + honeypot
  (el FE solo renderiza `website` oculto y vacío); Turnstile vendrá después

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service, rutas (validación + público) y del rate-limit de doble ventana
- **E2E real contra DB + Redis**: ambas formas crean su fila (`status='pending'`) y
  devuelven `{id}`; validaciones (`message`/`experience` faltantes, `event_type`
  inválido, email inválido, `event_date` imposible) → 400; **rate-limit**: el 4º
  request (válido o inválido) desde la misma IP → `429 RATE_LIMITED` con
  `retry_after_seconds`
