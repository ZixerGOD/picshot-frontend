# Face Search — integración real actual del backend

Documento orientado a Omar y a consumo por LLM para integrar el flujo
de búsqueda facial por selfie dentro de la galería de un evento.

Base path asumido: `/api/v1`

---

## Qué queda cubierto en este paso

### Implementado

- `POST /events/{event_id}/face-search`

### Prerrequisitos (ya implementados en otros módulos)

- Consentimiento biométrico: `POST /me/consents/biometric`
- Consentimiento AI por evento: `POST /me/consents/event-ai/{event_id}`
- Email verificado

### Relación con otros endpoints

- `GET /events/{event_id}/photos?filter=face&face_search_id={search_id}`
  pagina sobre los resultados persistidos de una búsqueda facial previa.
  El `search_id` devuelto por face-search se pasa como query param. Los
  items vienen ordenados por relevancia (rank) y con el mismo shape que
  `filter=all`, con `next_cursor` igual que los demás filtros. Sin
  `face_search_id` responde `{ "items": [], "next_cursor": null }`.
- El flujo correcto: el `POST` inicia la búsqueda y trae los primeros
  matches inline (hasta 20) + el `search_id`; el `GET` con
  `face_search_id` se usa para paginar esos mismos resultados. Como la
  búsqueda persiste hasta 20 matches (decisión MVP), la paginación cubre
  como máximo esos 20.

---

## Estado de verificación

### Probado con tests automatizados

- happy path con matches
- búsqueda sin matches (retorna array vacío)
- propagación de `BIOMETRIC_CONSENT_REQUIRED`
- propagación de `NO_FACE_DETECTED`
- propagación de `MULTIPLE_FACES_DETECTED`
- `LOW_QUALITY_SELFIE` cuando el score es bajo
- `EVENT_NOT_ACTIVE` para eventos en draft
- selfie se borra incluso si el Vision Service falla
- búsqueda funciona en eventos `closed` (fotos compradas siguen buscables)

### Conclusión para integración

Este endpoint está **apto para integración frontend** con el contrato
aquí documentado.

---

## Decisión clave de integración

El face-search es **sincrónico** — no hay polling ni websocket. El
frontend hace un POST con la selfie, espera 2-4 segundos, y recibe los
matches directamente. Se recomienda mostrar un spinner o skeleton
durante la espera.

---

## Resumen ejecutivo para el LLM del frontend

- el endpoint es sincrónico, no hay que hacer polling
- la selfie se envía como `multipart/form-data` con campo `selfie`
- la selfie debe ser JPEG o PNG, máximo 5 MB
- el usuario DEBE tener consentimiento biométrico + AI del evento antes de llamar
- verificar email antes de permitir el flujo
- mapear `error.code` para mostrar UX apropiada según el caso
- guardar `search_id` para usarlo como `face_search_id` en paginación de fotos

---

## `POST /events/{event_id}/face-search`

### Request

- **Auth**: usuario autenticado con email verificado
- **Rate limit**: 10/min por usuario
- **Content-Type**: `multipart/form-data`
- **Campo**: `selfie` (JPEG o PNG, máximo 5 MB)

### Response real

**200**

```json
{
  "search_id": "uuid",
  "match_count": 7,
  "matches": [
    {
      "photo_id": "uuid",
      "similarity": 0.83,
      "preview_url": "http://localhost:3000/storage/events/e1/previews/p1.jpg",
      "thumbnail_url": "http://localhost:3000/storage/events/e1/previews/p1-thumb.jpg"
    }
  ]
}
```

### Campos de cada match

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `photo_id` | string (UUID) | ID de la foto donde se encontró la cara |
| `similarity` | number (0-1) | Score de similitud coseno. Mayor = más parecido |
| `preview_url` | string (URL) | URL de la preview con watermark |
| `thumbnail_url` | string (URL) | URL del thumbnail para grids |

### Notas sobre los resultados

- `matches` viene ordenado por `similarity` descendente
- el máximo de matches es 20
- `similarity` > 0.7 es generalmente un match confiable
- las URLs de preview tienen watermark — la foto sin marca solo se
  sirve post-compra

---

## Errores esperados

| Código | Cuándo | UX sugerida |
|--------|--------|-------------|
| `BIOMETRIC_CONSENT_REQUIRED` | no tiene consentimiento biométrico activo | abrir modal de consent biométrico |
| `EVENT_AI_CONSENT_REQUIRED` | no tiene consentimiento AI para este evento | abrir modal de consent AI del evento |
| `EMAIL_NOT_VERIFIED` | email no verificado | mostrar aviso con link a verificación |
| `NO_FACE_DETECTED` | la selfie no contiene una cara detectable | pedir otra selfie con mejor iluminación/ángulo |
| `MULTIPLE_FACES_DETECTED` | la selfie tiene más de una cara | pedir selfie individual |
| `LOW_QUALITY_SELFIE` | el score de calidad es muy bajo | pedir selfie con mejor iluminación |
| `EVENT_NOT_ACTIVE` | el evento no está activo ni cerrado | mostrar mensaje informativo |
| `FILE_TOO_LARGE` | selfie excede 5 MB | mostrar error de tamaño |
| `VALIDATION_ERROR` | no se envió el campo `selfie` | error de formulario |
| `RATE_LIMITED` | más de 10 búsquedas por minuto | mostrar cooldown |

---

## Flujo completo recomendado para el frontend

```
1. Usuario entra a EventGalleryPage
2. Leer `viewer_event_ai_consent` del event detail
3. Si no tiene consent biométrico → mostrar modal biométrico
4. Si no tiene consent AI del evento → mostrar modal AI
5. Ambos aceptados → habilitar botón "Buscar con mi cara"
6. Usuario toma/sube selfie
7. POST /events/{event_id}/face-search con selfie
8. Mostrar spinner (2-4 segundos)
9. Recibir matches → mostrar grid de fotos con similarity
10. Guardar search_id para paginación futura
```

---

## Adaptación recomendada al frontend

### Crear `lib/api/face-search.ts`

```typescript
// Tipo de red (snake_case, tal cual viene del backend)
interface FaceSearchNetworkResponse {
  search_id: string;
  match_count: number;
  matches: Array<{
    photo_id: string;
    similarity: number;
    preview_url: string;
    thumbnail_url: string;
  }>;
}

// Tipo interno del frontend (camelCase)
interface FaceSearchResult {
  searchId: string;
  matchCount: number;
  matches: Array<{
    photoId: string;
    similarity: number;
    previewUrl: string;
    thumbnailUrl: string;
  }>;
}
```

### Envío de la selfie

```typescript
const formData = new FormData();
formData.append('selfie', file); // File o Blob

const response = await fetch(`/api/v1/events/${eventId}/face-search`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

### Manejo de errores

```typescript
if (!response.ok) {
  const { error } = await response.json();
  switch (error.code) {
    case 'NO_FACE_DETECTED':
      // mostrar "No detectamos una cara en la foto"
      break;
    case 'MULTIPLE_FACES_DETECTED':
      // mostrar "Solo una persona por selfie"
      break;
    case 'LOW_QUALITY_SELFIE':
      // mostrar "Intenta con mejor iluminación"
      break;
    case 'BIOMETRIC_CONSENT_REQUIRED':
      // abrir modal de consentimiento
      break;
    // ...
  }
}
```

---

## Recomendación final para Omar / su LLM

1. implementar el flujo de consent como gate antes del face-search
2. no cachear resultados de búsqueda — cada selfie puede dar resultados distintos
3. guardar `search_id` en estado local para paginación con `face_search_id`
4. no enviar selfies mayores a 5 MB — comprimir en el frontend si es necesario
5. tratar `similarity` como indicador de confianza, no como dato a mostrar al usuario
