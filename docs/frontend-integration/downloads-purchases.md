# Downloads + Purchases

Este slice cierra el flujo del comprador: ver lo que compró y **descargar
la foto original** vía URLs firmadas temporales.

> **Nota (retención, 2026-06-27):** las fotos de un evento se borran **6 meses** después
> de la fecha del evento, aunque hayan sido compradas. Antes se avisa por correo al
> comprador (30 y 7 días antes) para que descargue. Tras el borrado, la compra **sigue
> apareciendo** en "mis compras" (el historial se conserva) pero al pedir la URL de
> descarga el backend responde error (la foto ya no existe). El front debería mostrar
> esas compras como "expiradas / ya no disponibles" en vez de tratarlo como un fallo.

La descarga real **no pasa por JS de cálculo**: el frontend pide una URL
firmada y navega a ella. El archivo lo sirve el backend.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /me/purchases`
- `GET /me/purchases/{order_id}`
- `POST /me/photos/{photo_id}/download-url`
- `GET /download/{photo_id}?sig=...&exp=...&uid=...&oid=...` — **el archivo
  binario**, el frontend no arma esta URL a mano, la recibe ya firmada

## Regla de integración

Para descargar una foto el frontend hace **dos pasos**:

1. `POST /me/photos/{photo_id}/download-url` → recibe `signed_url`
2. navega/abre `signed_url` para que baje el archivo

O sea: el frontend **nunca** construye la firma ni adivina la URL. Solo
usa la `signed_url` que el backend le da.

---

## 1) `GET /me/purchases`

Lista **plana por foto** (no por orden) de todo lo que el usuario compró.

### Headers

- `Authorization: Bearer <token>`

### Query (opcional)

- `cursor`
- `limit` (default 20, máx 100)
- `event_id` — filtrar por evento (UUID)

### Response `200`

```json
{
  "items": [
    {
      "id": "019f01ee-3018-74b0-bce0-3b2fa1c5982b",
      "order_id": "019f01ee-3017-70c2-9659-812aa94628f1",
      "order_short_id": "PCS-2026-0004",
      "event_id": "019eed3f-73d3-7002-8bf6-5261dc3ca95a",
      "event_title": "Maratón de Guayaquil",
      "photo_id": "019ef138-3a66-7f71-bca4-fb93e39578c7",
      "preview_url": "http://localhost:3000/storage/events/.../preview.jpg",
      "thumbnail_url": "http://localhost:3000/storage/events/.../thumb.jpg",
      "price_cents": 500,
      "width": 6000,
      "height": 4000,
      "bib": "1234",
      "purchased_at": "2026-06-26T03:18:53.103Z",
      "order_status": "confirmed",
      "retention_until": "2027-01-20",
      "pack_key": null,
      "downloadable": true
    }
  ],
  "next_cursor": null
}
```

### Notas reales

- es paginada con cursor: si `next_cursor` no es `null`, hay más; mandarlo
  como `?cursor=` en la siguiente llamada
- `downloadable` es la verdad: es `false` si la orden quedó `refunded` o si
  la retención del evento ya expiró. Si es `false`, **no** mostrar botón de
  descarga (o mostrarlo deshabilitado)
- la pantalla de detalle puede filtrar esta lista por `order_id` en cliente,
  **o** usar el endpoint dedicado (abajo)

---

## 2) `GET /me/purchases/{order_id}`

Detalle de una compra: resumen de la orden + sus fotos (mismo shape de item
que la lista).

### Response `200`

```json
{
  "order_id": "019f01ee-3017-70c2-9659-812aa94628f1",
  "order_short_id": "PCS-2026-0004",
  "order_status": "confirmed",
  "purchased_at": "2026-06-26T03:18:53.103Z",
  "subtotal_cents": 500,
  "discount_cents": 0,
  "total_cents": 500,
  "items": [ /* mismo shape que en GET /me/purchases */ ]
}
```

- `404 NOT_FOUND` si la orden no es del usuario o no es una compra
  (`confirmed`/`refunded`)

---

## 3) `POST /me/photos/{photo_id}/download-url`

Genera la URL firmada para descargar **esa** foto.

### Headers

- `Authorization: Bearer <token>`

### Response `200`

```json
{
  "signed_url": "http://localhost:3000/api/v1/download/019ef138-...?exp=1782494811&uid=...&oid=...&sig=...",
  "expires_at": "2026-06-26T17:26:51.000Z"
}
```

### Qué hace el frontend

```ts
const { signed_url } = await api.post(`/me/photos/${photoId}/download-url`)
window.location.assign(signed_url) // o <a href={signed_url} download>
```

### Notas reales

- la URL vive **5 minutos** y es **reutilizable** dentro de ese tiempo
  (sirve para reintentos en móvil)
- si expira, simplemente se pide otra con el mismo POST
- es descarga **individual por foto**, no hay ZIP ni descarga masiva

---

## 4) `GET /download/{photo_id}?...`

Es la URL firmada del paso anterior. Devuelve el **JPEG original** con
`Content-Disposition: attachment`. No lleva `Authorization` (la firma en el
query es la autorización).

El frontend **no arma esta URL**; solo navega a la `signed_url`.

---

## Errores importantes

### Al pedir la URL (`POST .../download-url`)

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `FORBIDDEN` | la foto no es de una compra del usuario | ocultar/deshabilitar descarga |
| `ORDER_REFUNDED` | la orden fue reembolsada | marcar como no descargable |
| `EVENT_RETENTION_EXPIRED` | pasó la retención del evento | avisar que ya no está disponible |

### Al descargar (`GET /download/...`)

| Code | HTTP | Qué debe hacer frontend |
|---|---|---|
| `SIGNATURE_INVALID` | 401 | pedir una URL nueva con el POST |
| `SIGNATURE_EXPIRED` | 410 | pedir una URL nueva con el POST |
| `EVENT_RETENTION_EXPIRED` | 410 | avisar que ya no está disponible |

---

## Adaptación recomendada al frontend

Crear un `lib/api/purchases.ts` real que:

- haga `GET /me/purchases` (con paginación por cursor)
- haga `GET /me/purchases/:orderId`
- haga `POST /me/photos/:photoId/download-url`
- deje de usar `<a download>` directo a una URL pública fija
- respete `downloadable`

---

## Pasos exactos para integrar

1. en `MyPurchasesPage`, llamar `GET /me/purchases` y agrupar por
   `event_title` / `event_id` si se quiere mostrar por evento
2. para cada foto, mostrar `preview_url`/`thumbnail_url` y, si
   `downloadable === true`, un botón "Descargar"
3. al hacer click en Descargar:
   - `POST /me/photos/{photo_id}/download-url`
   - `window.location.assign(signed_url)`
4. para el detalle (`/mis-compras/:orderId`), usar
   `GET /me/purchases/{order_id}` (o filtrar la lista por `order_id`)
5. paginar con `next_cursor` cuando la lista crezca

---

## Qué pantallas debe tener el frontend

### 1) `MyPurchasesPage` (`/mis-compras`)

- lista de fotos compradas (con preview, evento, precio)
- botón Descargar solo si `downloadable`
- stats opcionales (cuántas fotos, cuántos eventos) calculados sobre `items`

### 2) `PurchaseDetailPage` (`/mis-compras/:orderId`)

- usa `GET /me/purchases/{order_id}`
- muestra el resumen de la orden + sus fotos con descarga

---

## Qué NO debe hacer Omar / el LLM del frontend

- no construir la `signed_url` ni la firma a mano
- no cachear la `signed_url` más allá de sus 5 minutos
- no mostrar Descargar cuando `downloadable` es `false`
- no asumir descarga ZIP / masiva (no existe)
- no asumir `camelCase`: la red manda `snake_case`
- no tratar `preview_url` como la foto original (es la versión con marca de
  agua; el original solo baja por la URL firmada)

---

## Modelo mental correcto

- las compras viven en backend (derivadas de órdenes `confirmed`)
- el original full-res nunca sale sin una URL firmada ligada a la compra
- el frontend pide la URL y navega; el backend valida firma + retención,
  sirve el archivo y registra la descarga

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de firma (`signed-url`), service y rutas de downloads
- **E2E real contra DB**: mint de URL, descarga del binario con headers
  correctos, registro en `download_logs`, y rechazo `401/410` ante firma
  manipulada/expirada
