# Events público — comportamiento real actual del backend

Documento orientado a Omar y a consumo por LLM para integrar:

- `HomePage`
- `EventsPage`
- `EventGalleryPage`

Base path asumido: `/api/v1`

---

## Alcance actual del slice

### Implementado

- `GET /events`
- `GET /events/{event_id|slug}`
- `GET /events/{event_id|slug}/photos`
- `GET /events/cities` (dropdown de ciudades del filtro)
- `GET /event-types` (dropdown de tipos del filtro)

### Implementado en otros slices (ver docs separados)

- `POST /events/{event_id}/face-search` → ver [face-search.md](./face-search.md)

---

## Estado de verificación

### Probado en runtime local

- `GET /events`
- `GET /events` con paginación por `next_cursor`
- `GET /events/{event_id|slug}`
- `GET /events/{event_id|slug}/photos`

### Qué quedó verificado

- el listado devuelve `{ items, next_cursor }`
- el detalle funciona tanto por UUID como por slug
- el detalle es público con **auth opcional**: un `Authorization` ausente o inválido NO
  da 401 — degrada a vista anónima y responde `200` (con un token válido añade campos del
  viewer, p.ej. `viewer_event_ai_consent`)
- la galería pública devuelve fotos seeded reales
- el detalle autenticado puede incluir `viewer_event_ai_consent`

### Conclusión para integración

Este slice público de eventos está **apto para integración frontend**
con el contrato aquí documentado.

---

## Decisión clave de integración

El frontend público actual todavía tiene shapes legacy como:

- arrays planos
- `location`
- `image`
- `displayDate`
- `basePrice`
- `Photo.url`
- `Photo.price`

El backend real **no devuelve eso**.

La integración correcta es:

1. consumir el contrato backend real
2. leer `items` y `next_cursor`
3. mapear a los tipos internos del frontend en `lib/api/events.ts`

---

## Resumen ejecutivo para el LLM del frontend

- no tipar la respuesta de red como `EventItem[]` plano
- leer siempre `response.items`
- mapear centavos a moneda visible en frontend
- soportar lookup por slug o UUID
- `filter=face` ya pagina resultados reales: primero se llama
  `POST /events/{event_id}/face-search` (trae los primeros matches +
  `search_id`) y luego se pagina con
  `GET .../photos?filter=face&face_search_id=<search_id>`

No hay que cambiar el backend para parecerse al mock anterior.

---

## 1) `GET /events`

### Response real

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "maraton-guayaquil-2026",
      "title": "Maratón de Guayaquil",
      "description": "...",
      "banner_image_url": "https://...",
      "cover_photo_url": "https://...",
      "date": "2026-07-20",
      "city": "Guayaquil",
      "type": "marathon",
      "status": "active",
      "photo_count": 20,
      "runner_count": 5000,
      "retention_until": "2027-01-20",
      "base_price_cents": 500,
      "packs": [
        { "key": "single", "price_cents": 500, "quantity": 1, "is_active": true }
      ],
      "created_at": "2026-06-22T00:00:00.000Z"
    }
  ],
  "next_cursor": null
}
```

### Query params soportados

- `status=active|closed|archived`
- `city`
- `type`
- `from`
- `to`
- `q`
- `cursor`
- `limit`
- `sort=date_desc|date_asc`

### Importante sobre fechas

`from` y `to` se interpretan como fechas del negocio en
`America/Guayaquil`, no como UTC puro.

### Dropdowns del filtro (ciudades y tipos)

Los dos selects de la barra de búsqueda se llenan con endpoints públicos
dedicados (no hardcodear listas en el frontend):

- `GET /events/cities` → `{ "cities": ["Guayaquil", "Quito", ...] }`. Ciudades
  distintas (orden alfabético) de eventos activos no borrados. El front usa el
  valor elegido como `GET /events?city=`.
- `GET /event-types` → `{ "event_types": [{ "key": "marathon", "label": "Maratón" }, ...] }`.
  Catálogo de tipos **activos** gestionado por el admin (ya no es un enum fijo),
  ordenado por `position`. Mostrar `label`, filtrar con la `key`: el filtro `type`
  de `GET /events` espera esa `key` (igual que el campo `type` que devuelve cada
  evento). El mismo catálogo alimenta el dropdown del form de contacto (ver
  [forms.md](./forms.md)).

---

## Adaptación recomendada al tipo `EventItem` del frontend

- `city` → `location`
- `cover_photo_url ?? banner_image_url` → `image`
- `banner_image_url` → `bannerImage`
- `cover_photo_url` → `coverPhoto`
- `photo_count` → `photoCount`
- `runner_count` → `runnerCount`
- `retention_until` → `retentionUntil`
- `base_price_cents / 100` → `basePrice`
- `date` → derivar `displayDate` en frontend

### Consecuencia práctica

`getEvents()` **no debe** tiparse como `EventItem[]` directo desde red.

Debe:

1. pedir `GET /events`
2. leer `response.items`
3. mapear cada item

---

## 2) `GET /events/{event_id|slug}`

### Response real

Mismo shape que un item de `GET /events`.

### Campo adicional cuando hay sesión

Si el request incluye Bearer válido, el backend puede agregar:

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

### Reglas

- acepta UUID o slug
- devuelve `NOT_FOUND` si no existe
- devuelve `EVENT_NOT_ACTIVE` si el evento no es público
- devuelve `EVENT_RETENTION_EXPIRED` si la retención ya venció

### Recomendación

El frontend puede seguir teniendo una función tipo `getEventById(...)`,
pero el argumento puede ser un slug.

Para decidir si abrir el disclaimer AI del evento, debe usar
`viewer_event_ai_consent` o `GET /me/consents`, no un helper local viejo.

---

## 3) `GET /events/{event_id|slug}/photos`

### Response real

```json
{
  "items": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "preview_url": "https://...",
      "thumbnail_url": "https://...",
      "price_cents": 500,
      "bib": "4509",
      "width": 6000,
      "height": 4000,
      "taken_at": "2026-07-20T10:23:00.000Z",
      "status": "published"
    }
  ],
  "next_cursor": null
}
```

### Query params soportados hoy

- `filter=all|face|bib`
- `bib` (con `filter=bib`)
- `face_search_id` (requerido con `filter=face` — el id de un face-search previo)
- `cursor`
- `limit`

### Estado real de filtros

- `filter=all` → funciona
- `filter=bib` → funciona
- `filter=face` → funciona. Requiere `face_search_id` de un face-search
  previo (`POST /events/{event_id}/face-search`). Levanta los resultados
  persistidos de esa búsqueda y los devuelve ordenados por relevancia
  (rank), con `next_cursor` igual que los demás filtros. El shape de cada
  item es el mismo de `filter=all`. Sin `face_search_id` responde
  `{ "items": [], "next_cursor": null }`. La búsqueda persiste hasta 20
  matches (decisión MVP), así que la paginación cubre como máximo esos 20.
  Detalle del flujo en [face-search.md](./face-search.md).

### Lo que NO existe

- un endpoint extra para estados locales del frontend

Si el frontend todavía tiene filtros o estados puramente locales, eso se
debe resolver del lado del frontend, no llamando al backend actual.

---

## Adaptación recomendada al tipo `Photo`

- `event_id` → `eventId`
- `preview_url` → `url`
- `thumbnail_url` → `thumbnailUrl`
- `price_cents / 100` → `price`
- `taken_at` → `createdAt` solo si la UI todavía necesita un campo temporal equivalente

---

## Errores esperados

### `GET /events`

- `VALIDATION_ERROR`

### `GET /events/{event_id|slug}`

- `NOT_FOUND`
- `EVENT_NOT_ACTIVE`
- `EVENT_RETENTION_EXPIRED`

### `GET /events/{event_id|slug}/photos`

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `EVENT_NOT_ACTIVE`
- `EVENT_RETENTION_EXPIRED`

---

## Seed local disponible

El backend tiene seed de desarrollo con eventos y fotos públicas para
probar el frontend sin depender del pipeline real de upload.

### Comando

```bash
pnpm db:seed
```

### Qué deja cargado hoy

- 3 eventos públicos de ejemplo
- 20 fotos por evento
- packs activos por evento

---

## Recomendación final para Omar / su LLM

1. no cambiar el backend para seguir el mock viejo
2. mapear payloads en `lib/api`
3. usar `error.code` para UX y manejo de errores
4. tratar paginación como contrato real
5. no asumir capacidades extra fuera de los endpoints documentados aquí
