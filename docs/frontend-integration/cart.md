# Cart + Coupons — integración real actual del backend

Documento orientado a Omar y a consumo por LLM para integrar:

- `CartPage`
- `CheckoutPage` (solo la parte de leer carrito persistido)
- merge guest → user después de login
- validación y persistencia de cupones

Base path asumido: `/api/v1`

---

## Alcance actual del slice

### Implementado

- `GET /me/cart`
- `PUT /me/cart`
- `POST /me/cart/items`
- `POST /me/cart/packs`
- `DELETE /me/cart/items/{item_id}`
- `DELETE /me/cart/packs/{pack_id}`
- `DELETE /me/cart`
- `POST /me/cart/merge`
- `POST /coupons/validate`

### Importante

Este slice **ya está listo en backend real** y fue probado contra la API
local corriendo en `localhost:3000`.

---

## Estado de verificación

### Probado en runtime local

- `GET /me/cart` vacío
- `POST /me/cart/items`
- `DELETE /me/cart/items/{item_id}`
- `POST /me/cart/packs` con `pack_key=all`
- `DELETE /me/cart/packs/{pack_id}`
- `PUT /me/cart` con `coupon_code`
- `POST /me/cart/merge`
- `POST /coupons/validate`
- conflicto `COUPON_EVENT_MISMATCH` al intentar usar cupón de evento en
  carrito mixto

### Conclusión para integración

Este slice está **apto para integración frontend**.

---

## Decisión clave de integración

El carrito real del backend es **server-side** y el payload ya viene
**render-ready**.

Eso significa:

- el frontend **no** debe recalcular precios reales
- el frontend **no** debe persistir el cart final en `localStorage`
- el frontend **sí** puede mantener un guest cart local temporal para
  luego hacer `POST /me/cart/merge`
- el frontend debe tratar `totals` y `coupon` del backend como fuente de
  verdad

---

## Resumen ejecutivo para el LLM del frontend

- no usar `CartContext` actual como fuente final de verdad
- mover la integración a `lib/api/cart.ts`
- consumir `snake_case` y mapear a tipos internos si Omar quiere seguir
  usando `camelCase`
- mostrar `totals` exactamente como vienen del backend
- si hay `COUPON_EVENT_MISMATCH`, pedir al usuario quitar el cupón o dejar
  un solo evento en el cart
- `pack_key='all'` ya existe y no envía `photo_ids` en request

---

## 1) `GET /me/cart`

### Response real

```json
{
  "items": [
    {
      "id": "uuid",
      "photo_id": "uuid",
      "event_id": "uuid",
      "event_slug": "maraton-guayaquil-2026",
      "event_title": "Maratón de Guayaquil",
      "preview_url": "https://...",
      "thumbnail_url": "https://...",
      "price_cents": 500,
      "bib": "4520",
      "width": 6000,
      "height": 4000,
      "added_at": "2026-06-22T21:32:45.259Z"
    }
  ],
  "packs": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "event_slug": "triatlon-quito-2026",
      "event_title": "Triatlón de Quito",
      "pack_key": "all",
      "quantity": null,
      "price_cents": 5200,
      "photo_ids": ["uuid", "uuid"],
      "photos": [
        {
          "photo_id": "uuid",
          "preview_url": "https://...",
          "thumbnail_url": "https://...",
          "bib": null,
          "width": 6000,
          "height": 4000
        }
      ],
      "added_at": "2026-06-22T21:33:55.908Z"
    }
  ],
  "coupon": {
    "code": "EVENT500",
    "event_id": "uuid",
    "discount_type": "fixed",
    "discount_value": null,
    "discount_value_cents": 500
  },
  "totals": {
    "subtotal_cents": 1500,
    "discount_cents": 500,
    "total_cents": 1000
  },
  "updated_at": "2026-06-22T21:33:34.744Z"
}
```

### Qué significa

- `items[]` ya trae lo necesario para renderizar singles
- `packs[]` ya trae el resumen renderizable del pack
- `coupon` puede ser `null`
- `totals` ya viene calculado por el server

---

## 2) `PUT /me/cart`

### Uso

Reemplaza el cart completo y persiste `coupon_code`.

### Request real

```json
{
  "items": [
    {
      "photo_id": "uuid",
      "event_id": "uuid",
      "price_cents": 500
    }
  ],
  "packs": [
    {
      "event_id": "uuid",
      "pack_key": "pack_3",
      "photo_ids": ["uuid", "uuid", "uuid"],
      "price_cents": 1200
    }
  ],
  "coupon_code": "WELCOME10"
}
```

### Notas

- para `pack_key='all'`, el frontend **no envía** `photo_ids`
- `price_cents` se acepta como control de coherencia; el server manda si
  cambió el precio
- response: devuelve el cart canónico completo

---

## 3) `POST /me/cart/items`

### Request

```json
{
  "photo_id": "uuid",
  "event_id": "uuid"
}
```

### Response `201`

Cart actualizado completo.

### Errores importantes

- `PHOTO_UNAVAILABLE`
- `CONFLICT` si ya está como single o ya está cubierto por un pack

---

## 4) `POST /me/cart/packs`

### Request pack contado

```json
{
  "event_id": "uuid",
  "pack_key": "pack_3",
  "photo_ids": ["uuid", "uuid", "uuid"]
}
```

### Request pack all

```json
{
  "event_id": "uuid",
  "pack_key": "all"
}
```

### Response `201`

Cart actualizado completo.

### Regla real

Si agregas un pack que cubre fotos ya presentes como singles del mismo
evento, el backend quita esos singles del carrito persistido.

---

## 5) Deletes

### `DELETE /me/cart/items/{item_id}`

Devuelve cart actualizado.

### `DELETE /me/cart/packs/{pack_id}`

Devuelve cart actualizado.

### `DELETE /me/cart`

Devuelve `204 No Content`.

---

## 6) `POST /me/cart/merge`

### Uso

Se llama después del login si el usuario tenía un guest cart local.

### Request

Usa el mismo shape de `PUT /me/cart`:

```json
{
  "items": [
    { "photo_id": "uuid", "event_id": "uuid", "price_cents": 500 }
  ],
  "packs": [],
  "coupon_code": null
}
```

### Comportamiento real

- el backend fusiona guest + server cart
- hace dedupe
- revalida disponibilidad/precios
- el servidor gana en `totals`

---

## 7) `POST /coupons/validate`

### Request

```json
{
  "code": "WELCOME10",
  "event_ids": ["uuid"]
}
```

### Response real

```json
{
  "code": "WELCOME10",
  "event_id": null,
  "discount_type": "percent",
  "discount_value": 10,
  "discount_value_cents": null
}
```

### Qué hace y qué no hace

- **sí** valida si el cupón es usable
- **no** lo persiste por sí mismo
- para persistirlo, luego toca `PUT /me/cart` con `coupon_code`

### Cupón que deja de aplicar al pagar (`CART_CHANGED`)

Un cupón guardado en el carrito puede dejar de ser válido entre que se
aplicó y el momento del `POST /checkout` (expiró, se desactivó, se agotó
o ya no aplica al carrito). En ese caso el backend **ya no devuelve un
error duro de cupón**: cae a un re-price tolerante y responde
`CART_CHANGED` con el carrito recalculado **sin** el cupón.

El `details` de `CART_CHANGED` incluye el booleano `coupon_removed`
(`true` cuando se quitó el cupón) junto al `canonical_cart` recalculado:

```json
{
  "error": {
    "code": "CART_CHANGED",
    "message": "Cart contents changed on the server.",
    "details": {
      "removed_photo_ids": [],
      "price_changes": [],
      "coupon_removed": true,
      "canonical_cart": { "items": [], "packs": [], "coupon": null, "totals": {} }
    }
  }
}
```

UX sugerida: ante `CART_CHANGED` con `coupon_removed: true`, mostrar
"el cupón ya no aplica", refrescar el total desde `details.canonical_cart`
(el `coupon` vendrá `null`) y dejar que el usuario confirme el checkout
otra vez. Esto se maneja en la pantalla de checkout, no en el carrito
(ver [checkout-orders.md](./checkout-orders.md)).

---

## Errores esperados

| Código | Cuándo | UX sugerida |
|--------|--------|-------------|
| `PHOTO_UNAVAILABLE` | foto borrada, no publicada o evento no comprable | quitar item y avisar |
| `PRICE_CHANGED` | precio ya no coincide con el enviado | refrescar cart desde response/GET |
| `PACK_PHOTO_COUNT_MISMATCH` | `photo_ids` no coincide con la cantidad del pack | corregir selección |
| `PACK_NOT_AVAILABLE_FOR_EVENT` | ese pack no está activo en el evento | deshabilitar opción |
| `PACK_PHOTOS_CROSS_EVENT` | mezcló fotos de distintos eventos en un pack | corregir selección |
| `COUPON_NOT_FOUND` | cupón no existe | mostrar “cupón no válido” |
| `COUPON_INACTIVE` | cupón apagado | mostrar que ya no está disponible |
| `COUPON_NOT_STARTED` | vigencia futura | mostrar fecha de inicio |
| `COUPON_EXPIRED` | vigencia vencida | pedir otro cupón |
| `COUPON_USAGE_EXCEEDED` | agotó usos | avisar que ya no aplica |
| `COUPON_EVENT_MISMATCH` | cupón de evento con carrito mixto u otro evento | pedir quitar cupón o dejar un solo evento |
| `CONFLICT` | duplicados o foto ya cubierta por pack | refrescar estado del cart |

---

## Adaptación recomendada al frontend

### Mapping mínimo sugerido

- `price_cents / 100` → precio visible en UI
- `discount_type='percent'` → el FE legacy lo puede mapear a
  `percentage`
- `pack_key='pack_3' | 'pack_5' | 'pack_10'` → mapear a los enums
  internos legacy si Omar decide mantenerlos

### Recomendación concreta

Crear un `lib/api/cart.ts` con:

- tipos de red (`snake_case`)
- mapping a tipos internos (`camelCase`) si hace falta
- funciones:
  - `getCart()`
  - `replaceCart()`
  - `addCartItem()`
  - `addCartPack()`
  - `removeCartItem()`
  - `removeCartPack()`
  - `clearCart()`
  - `mergeCart()`
  - `validateCoupon()`

### Qué NO hacer

- no recalcular totales como fuente final de verdad
- no seguir usando `localStorage` como cart autenticado final
- no asumir que un cupón por evento sirve en un carrito con múltiples
  eventos

### Recuperación de carrito abandonado (email)

El backend envía recordatorios automáticos (2h/24h/72h) al dueño de un carrito con
fotos sin comprar. El CTA del correo apunta a **`/carrito`** (sobre `FRONTEND_PUBLIC_URL`).
El front solo necesita garantizar que esa ruta carga el carrito del usuario autenticado
(el mismo `GET /me/cart`). No hay endpoint nuevo ni parámetros: es un deep-link simple.

