# Photographer Upload — integración real actual del backend

Documento orientado a Omar y a consumo por LLM para integrar el batch
upload de fotos desde el panel del fotógrafo.

Base path asumido: `/api/v1`

---

## Qué queda cubierto en este paso

### Implementado

- `POST /photographer/events/{event_id}/photos` (batch upload)

### Lectura del panel (en otra guía)

- `GET /photographer/events`, `GET /photographer/photos`, `GET /photographer/sales`
  **ya están implementados** — su contrato vive en
  [`photographer-panel.md`](./photographer-panel.md). Esta guía cubre solo el **upload**.

---

## Estado de verificación

### Probado con tests automatizados

- happy path con 2 fotos aceptadas
- batch mayor a 10 fotos → `BATCH_TOO_LARGE`
- batch vacío → `VALIDATION_ERROR`
- evento no activo → `EVENT_NOT_ACTIVE`
- fotógrafo no asignado → `EVENT_NOT_ASSIGNED`
- pack single no existe → `PACK_SINGLE_REQUIRED`
- formato no soportado → `UNSUPPORTED_FORMAT`
- archivo mayor a 30 MB → `FILE_TOO_LARGE`
- dimensiones menores a 1920px → `IMAGE_TOO_SMALL`
- duplicado por hash → `DUPLICATE_PHOTO`
- batch mixto (archivos aceptados y rechazados en la misma respuesta)
- race condition P2002 en hash duplicado concurrente
- archivos truncados en multipart → reportados como rechazados
- idempotency-key requerido y funcional

### Conclusión para integración

Este endpoint está **apto para integración frontend** con el contrato
aquí documentado.

---

## Decisión clave de integración

El upload es **parcialmente asíncrono**:

1. El POST responde inmediatamente con `accepted[]` y `rejected[]`
2. Cada foto aceptada queda en `status: "processing"`
3. Un worker BullMQ procesa cada foto en background (2-5 segundos):
   detección de caras, watermark, thumbnail, metadata EXIF
4. Al terminar, la foto pasa a `status: "published"`

El frontend debe refrescar el listado de fotos periódicamente o
implementar polling para ver el cambio de estado.

---

## Resumen ejecutivo para el LLM del frontend

- enviar hasta 10 archivos como `multipart/form-data`
- campos nombrados `file_0`, `file_1`, ..., `file_9`
- cada archivo JPEG o PNG, máximo 30 MB, lado largo mínimo 1920 px
- incluir header `Idempotency-Key: <uuid>` (obligatorio)
- la respuesta separa `accepted` y `rejected` en la misma request
- fotos aceptadas quedan en `processing` hasta que el worker las indexe
- el header `Idempotency-Key` previene duplicados si el usuario reintenta

---

## `POST /photographer/events/{event_id}/photos`

### Request

- **Auth**: fotógrafo autenticado, asignado al evento
- **Rate limit**: 100/min por fotógrafo
- **Content-Type**: `multipart/form-data`
- **Header obligatorio**: `Idempotency-Key: <uuid>`
- **Body limit**: 350 MB total
- **Campos**: `file_0` a `file_9` (hasta 10 archivos)

### Validaciones por archivo

| Regla | Límite | Error si falla |
|-------|--------|---------------|
| Formato | JPEG o PNG | `UNSUPPORTED_FORMAT` |
| Tamaño | ≤ 30 MB | `FILE_TOO_LARGE` |
| Lado largo | ≥ 1920 px | `IMAGE_TOO_SMALL` |
| Imagen legible | sharp puede leer metadata | `INVALID_IMAGE` |
| Duplicado | SHA-256 único por evento | `DUPLICATE_PHOTO` |

### Response real

**201**

```json
{
  "batch_id": "uuid",
  "accepted": [
    {
      "id": "uuid",
      "filename": "IMG_0001.jpg",
      "status": "processing"
    }
  ],
  "rejected": [
    {
      "filename": "IMG_0002.heic",
      "code": "UNSUPPORTED_FORMAT",
      "message": "image/heic is not allowed."
    }
  ]
}
```

### Campos de accepted

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID de la foto creada |
| `filename` | string | nombre original del archivo |
| `status` | `"processing"` | siempre `processing` al crear |

### Campos de rejected

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `filename` | string | nombre original del archivo |
| `code` | string | código de error machine-readable |
| `message` | string | descripción técnica (no para mostrar al usuario) |

---

## Errores a nivel batch

Estos errores se lanzan antes de procesar archivos individuales y
responden como error HTTP estándar (no dentro de `rejected`).

| Código | Cuándo | UX sugerida |
|--------|--------|-------------|
| `BATCH_TOO_LARGE` | más de 10 archivos | limitar selector de archivos |
| `VALIDATION_ERROR` | 0 archivos enviados | validar en frontend antes de enviar |
| `NOT_FOUND` | el `event_id` no existe | mostrar error y redirigir |
| `EVENT_NOT_ASSIGNED` | fotógrafo no asignado a este evento | mostrar error y redirigir |
| `EVENT_NOT_ACTIVE` | evento no está activo | mostrar mensaje informativo |
| `PACK_SINGLE_REQUIRED` | evento no tiene pack single activo | avisar al admin |
| `IDEMPOTENCY_KEY_REQUIRED` | falta header `Idempotency-Key` | agregar header automáticamente |

---

## Ciclo de vida de una foto

```
upload → processing → published
                   → failed (si el Vision Service falla después de 3 reintentos)
```

- `processing`: el worker está generando preview, thumbnail, watermark y
  detectando caras
- `published`: listo para aparecer en la galería pública y en búsquedas
  faciales
- `failed`: el procesamiento falló permanentemente — el fotógrafo puede
  subir la foto de nuevo

---

## Idempotency

El header `Idempotency-Key` es obligatorio. Cómo funciona:

1. Primera request con key `abc-123` → se procesa normalmente
2. Segunda request con **misma** key y **mismo** body → se devuelve la
   respuesta cacheada con header `X-Idempotency-Replay: true`
3. Segunda request con **misma** key pero **body diferente** → error
   `409 CONFLICT`

Las keys expiran en 24 horas. Generar un UUID nuevo para cada batch
intencional.

---

## Adaptación recomendada al frontend

### Crear `lib/api/photographer.ts`

```typescript
// Tipo de red (snake_case)
interface UploadNetworkResponse {
  // opcional: si TODOS los archivos se rechazan en la capa multipart, el 201 vuelve
  // sin batch_id, solo con { accepted: [], rejected: [...] }.
  batch_id?: string;
  accepted: Array<{
    id: string;
    filename: string;
    status: 'processing';
  }>;
  rejected: Array<{
    filename: string;
    code: string;
    message: string;
  }>;
}
```

### Envío del batch

```typescript
const formData = new FormData();
files.forEach((file, i) => formData.append(`file_${i}`, file));

const response = await fetch(
  `/api/v1/photographer/events/${eventId}/photos`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: formData,
  },
);
```

### Validación previa en frontend (recomendada)

```typescript
// Antes de enviar, filtrar archivos inválidos para UX inmediata
const MAX_FILES = 10;
const MAX_SIZE = 30 * 1024 * 1024; // 30 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

function validateFiles(files: File[]): { valid: File[]; invalid: Array<{ file: File; reason: string }> } {
  // ... validar tipo, tamaño, cantidad
}
```

### Manejo de respuesta mixta

```typescript
const data: UploadNetworkResponse = await response.json();

if (data.accepted.length > 0) {
  // mostrar fotos aceptadas con indicador "procesando..."
}
if (data.rejected.length > 0) {
  // mostrar lista de rechazados con el motivo traducido desde code
}
```

---

## Recomendación final para Omar / su LLM

1. generar `Idempotency-Key` automáticamente en la capa API, no en el componente
2. validar archivos en frontend antes de enviar (UX inmediata), pero confiar
   en el backend como fuente de verdad
3. no enviar HEIC — el backend lo rechaza, mejor filtrar en el selector de archivos
4. implementar polling o refresh para detectar `processing → published`
5. mapear `rejected[].code` a mensajes en español para el usuario
6. el `message` de cada rejected es técnico — no mostrarlo al usuario directamente
7. mostrar progreso del upload (FormData con `XMLHttpRequest` o stream) para
   batches pesados
