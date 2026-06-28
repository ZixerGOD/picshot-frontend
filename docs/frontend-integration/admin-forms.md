# Admin — Formularios (contacto y postulaciones)

Slice del panel admin para **revisar y atender** las submissions de los formularios
públicos: solicitudes de contacto (`/contacto`) y postulaciones de fotógrafo
(`/trabaja-con-nosotros`). Son las pantallas `/admin/contacto` y `/admin/postulaciones`.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/contact-requests` · `GET /admin/contact-requests/{id}` · `PATCH /admin/contact-requests/{id}`
- `GET /admin/staff-applications` · `GET /admin/staff-applications/{id}` · `PATCH /admin/staff-applications/{id}`

## Modelo mental

- Los forms públicos se guardan en DB y **notifican por correo** al alias correspondiente
  (contacto → `EMAIL_ALIAS_CONTACT`, postulaciones → `EMAIL_ALIAS_APPLICATIONS`). Este
  panel es para verlos y marcarles estado.
- **No hay onboarding automático**: aprobar una postulación **no** crea ni invita al
  fotógrafo. El admin revisa, contacta a la persona por fuera, y si procede crea la cuenta
  manualmente con `POST /admin/photographers` (ver `admin-photographers.md`). Marcar
  `approved` es solo un cambio de estado para el seguimiento interno.
- El portafolio es un **link** (`portfolio_url`), no archivos subidos.

## Listados

Ambos listados son keyset (cursor por `id` descendente, más nuevo primero) con el shape
estándar `{ items, next_cursor }`. Filtros comunes:

- `status` — contacto: `pending|attended|discarded`; postulaciones: `pending|approved|rejected`.
- `q` — texto libre: contacto busca en nombre/email; postulaciones en nombre/email/ciudad.
- `from` / `to` — rango de fecha de creación (`YYYY-MM-DD`, calendario Guayaquil).
- `cursor`, `limit` (1–100, default 20).

`next_cursor` es `null` en la última página; mientras no sea `null`, reenvíalo como
`cursor` para la siguiente.

## Cambiar estado (`PATCH`)

```json
{ "status": "attended", "note": "Llamada hecha, coordinamos por WhatsApp" }
```

- Contacto: `status` ∈ `attended | discarded`. Postulación: `status` ∈ `approved | rejected`.
  (No se puede volver a `pending` desde el panel.)
- `note` es opcional (máx 2000 chars), para dejar contexto interno de la atención.
  Si re-marcas el estado y **no** reenvías `note`, la nota previa se conserva (solo se
  sobrescribe cuando mandas el campo).
- La respuesta es el item actualizado. El backend sella `attended_at` (contacto) o
  `reviewed_at` (postulación) y audita el cambio (`from`→`to`).
- Errores: `NOT_FOUND` (404) si el id no existe; `VALIDATION_ERROR` (400) si el `status`
  no es uno de los permitidos para ese recurso.

## Shapes

**ContactRequest**:
```json
{
  "id": "uuid",
  "full_name": "Ana Pérez",
  "email": "ana@example.com",
  "phone": null,
  "event_name": "Maratón de Guayaquil",
  "event_type": "marathon",
  "event_date": "2026-08-15",
  "message": "Quiero cotizar fotos para mi evento",
  "status": "pending",
  "note": null,
  "created_at": "2026-06-28T14:00:00.000Z",
  "attended_at": null
}
```
`event_type` puede ser `marathon|cycling|triathlon|mtb|other` o `null`. `event_date` es
`YYYY-MM-DD` o `null`.

**StaffApplication**:
```json
{
  "id": "uuid",
  "full_name": "Luis Gómez",
  "email": "luis@example.com",
  "city": "Guayaquil",
  "portfolio_url": "https://luis.example/portfolio",
  "social": "@luisfoto",
  "gear": "Canon R6 + 70-200 f/2.8",
  "experience": "5 años cubriendo carreras",
  "status": "pending",
  "note": null,
  "created_at": "2026-06-28T14:00:00.000Z",
  "reviewed_at": null
}
```

## Qué pantallas debe tener el frontend

- `AdminContactRequestsPage` (`/admin/contacto`): tabla con filtro por estado + búsqueda,
  detalle, y acciones "marcar atendida" / "descartar" con nota opcional.
- `AdminStaffApplicationsPage` (`/admin/postulaciones`): igual, con acciones "aprobar" /
  "rechazar". El `portfolio_url` se muestra como enlace externo.

## Qué NO debe hacer Omar / el LLM del frontend

- No esperar que "aprobar" cree/invite al fotógrafo: es solo un estado. La creación es
  manual en la pantalla de fotógrafos.
- No asumir subida de archivos de portafolio: solo hay `portfolio_url` (link).
- No mostrar `note` al postulante/usuario: es interno.

## Estado de verificación

- typecheck limpio + tests de rutas (list/detail/patch, validación de status, 404, 403 no-admin)
- **E2E real contra DB**: list con filtro, detail, `NOT_FOUND`, cambio de estado con nota,
  sellado de `attended_at`/`reviewed_at` y registro de auditoría `*.status_changed`.
