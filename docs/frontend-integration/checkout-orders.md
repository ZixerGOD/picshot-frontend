# Checkout + Orders

Este slice ya quedó backend-driven para el flujo real con Payphone
**solo tarjeta**.

## Qué existe hoy

- `POST /checkout`
- `GET /orders/active`
- `GET /orders/{order_id}`
- `GET /checkout/return` — **interno de Payphone**, no lo llama el
  frontend manualmente

## Regla de integración

El frontend **no confirma pagos**.  
El frontend solo:

1. llama `POST /checkout`
2. recibe `payphone_redirect_url`
3. navega a esa URL en la **misma pestaña**
4. espera que el backend haga el `Confirm` cuando Payphone regrese
5. lee el resultado en `/checkout/success|error|pending?order=...`

O sea: la parte crítica queda del lado backend, no en JS del browser.

---

## 1) `POST /checkout`

### Request

```json
{
  "buyer_email": "even@example.com",
  "buyer_identification": "0912345678",
  "use_server_cart": true,
  "items": [],
  "packs": [],
  "coupon_code": null
}
```

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>`

### Response `201`

```json
{
  "order_id": "019f0b0d-3000-7000-8000-000000000001",
  "short_id": "PCS-2026-0001",
  "payphone_redirect_url": "https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=...",
  "expires_at": "2026-06-22T23:10:00.000Z",
  "totals": {
    "subtotal_cents": 1800,
    "discount_cents": 0,
    "total_cents": 1800
  },
  "idempotent_replay": false
}
```

### Qué hace el frontend

```ts
window.location.assign(response.payphone_redirect_url)
```

No popup.  
No iframe.  
No webview.

### Notas reales

- para el flujo MVP usar `use_server_cart: true`
- el backend usa el carrito server-side como fuente de verdad
- si reenvías la misma request con la misma `Idempotency-Key`, la
  respuesta vuelve con `idempotent_replay: true`

---

## 2) `GET /orders/active`

Devuelve la orden activa del usuario si sigue en `awaiting_payment`.

### Response `200`

```json
null
```

o:

```json
{
  "id": "019f0b0d-3000-7000-8000-000000000001",
  "short_id": "PCS-2026-0001",
  "user_id": "019f0b0d-2000-7000-8000-000000000001",
  "buyer_email": "even@example.com",
  "buyer_identification": null,
  "items": [],
  "packs": [],
  "coupon_code": null,
  "totals": {
    "subtotal_cents": 1800,
    "discount_cents": 0,
    "total_cents": 1800
  },
  "status": "awaiting_payment",
  "created_at": "2026-06-22T23:00:00.000Z",
  "expires_at": "2026-06-22T23:10:00.000Z",
  "confirmed_at": null,
  "refunded_at": null,
  "refund_reason": null,
  "payphone_reverse_status": null,
  "payphone_transactions": []
}
```

### Uso recomendado

Cuando el usuario entra a checkout, primero revisar si ya tiene una
orden activa y, si sí, mostrarle el estado en vez de crear otra.

---

## 3) `GET /orders/{order_id}`

Este endpoint es la fuente de verdad para las pantallas:

- `/checkout/success`
- `/checkout/error`
- `/checkout/pending`
- `/mis-compras/:orderId`

### Campos importantes

- `status`
- `short_id`
- `totals`
- `items[]` — cada foto de la orden trae miniatura lista para pintar:
  ```json
  {
    "photo_id": "uuid", "unit_price_cents": 500, "pack_id": null,
    "preview_url": "https://.../preview.jpg",
    "thumbnail_url": "https://.../thumb.jpg",
    "bib": "1234"
  }
  ```
  Usar `thumbnail_url` (o `preview_url`) para mostrar las fotos compradas en
  `/checkout/success` y `/mis-compras/:orderId` sin un fetch extra; `bib` es el
  dorsal (puede ser `null`). Ninguna de estas URLs es el original full-res: la
  descarga real sigue el flujo de URL firmada de
  [downloads-purchases.md](./downloads-purchases.md).
- `payphone_reverse_status` — estado del reverso de dinero en Payphone; solo es
  relevante en órdenes `refunded` (en cualquier otra es `null`). Valores:
  `pending | reversed | rejected | uncertain | skipped | null`. El comprador no
  opera el reverso; si lo muestras, ver la tabla de significados y la guía de UI en
  [`admin-orders.md`](./admin-orders.md).
- `payphone_transactions[]` — cada entrada:
  ```json
  {
    "id": "uuid", "transaction_id": "...", "client_transaction_id": "...",
    "response_code": 3,
    "card_brand": "Visa", "card_type": "Credit", "card_last4": "4242",
    "authorized_at": "...", "confirmed_at": "...",
    "message": "Approved", "attempt_number": 1
  }
  ```
  Los datos de tarjeta (`card_brand`, `card_type`, `card_last4`) vienen del confirm
  de Payphone; cualquiera puede ser `null` (transacciones canceladas/fallidas o sin
  tarjeta). `card_last4` son solo los últimos 4 dígitos. UI sugerida:
  `Visa Credit ••••4242`.

### Status posibles hoy

- `pending`
- `awaiting_payment`
- `expired`
- `cancelled`
- `confirmed`
- `failed`
- `reversed`
- `refunded`

Para este MVP de frontend, los más relevantes son:

- `awaiting_payment`
- `confirmed`
- `failed`
- `expired`

---

## 4) Retorno desde Payphone

Payphone vuelve al backend con:

- `id`
- `clientTransactionId`

El backend:

1. busca la orden
2. llama `Confirm`
3. actualiza la orden
4. redirige al frontend a:
   - `/checkout/success?order=...`
   - `/checkout/error?order=...`
   - `/checkout/pending?order=...`

El frontend **no debe** intentar reconstruir este paso por su cuenta.

> **Nota (cron de expiración, 2026-06-27):** ahora hay un job que marca `expired` las
> órdenes vencidas cada 5 min. Si el usuario paga justo al filo de la ventana, el
> retorno puede llegar con la orden ya `expired`; el backend igual intenta confirmar y,
> si Payphone aprobó, redirige a `/checkout/success` con la orden `confirmed`. O sea:
> una orden que el front creía expirada puede terminar en `success`. Confía siempre en
> el status real que devuelve `GET /orders/:id`, no en una expiración inferida en cliente.

> **Nota (reconciliación de pagos, 2026-06-27):** una orden puede pasar a `confirmed`
> **sin que el usuario vuelva** a la app. Si pagó pero el redirect se perdió (cerró el
> browser, se cayó la red), un job de fondo detecta el pago en Payphone y confirma la
> orden por su cuenta (entrega las fotos) en cuestión de ~1 min. Implicación para el
> front: si una compra quedó "colgada" sin retorno, **no asumas que falló** — relee
> `GET /orders/:id`; puede haberse confirmado sola. Idealmente, la vista de "mis compras"
> refleja el estado del backend, no un resultado inferido del flujo de redirect.

---

## Errores importantes de `POST /checkout`

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `CART_EMPTY` | no hay nada que cobrar | regresar al carrito |
| `CART_CHANGED` | el carrito real cambió | refrescar carrito con `details.canonical_cart` y pedir confirmación otra vez |
| `CART_CHANGED` + `details.coupon_removed: true` | el cupón aplicado dejó de ser válido (expiró/desactivado/agotado/ya no aplica) | avisar "el cupón ya no aplica", refrescar total con `details.canonical_cart` (vendrá con `coupon: null`) y reconfirmar |
| `PAYMENT_IN_PROGRESS` | ya hay una orden activa | consultar `details.active_order_id` o `GET /orders/active` |
| `IDENTIFICATION_REQUIRED` | total > $50 sin cédula/RUC | pedir identificación |
| `IDENTIFICATION_INVALID` | cédula/RUC inválida | corregir input |
| `PAYPHONE_UNAVAILABLE` | Payphone no respondió | toast + permitir reintentar |

---

## Adaptación recomendada al frontend

Crear un `lib/api/checkout.ts` real que:

- haga `POST /checkout`
- haga `GET /orders/active`
- haga `GET /orders/:id`
- elimine la simulación local de Payphone
- elimine `localStorage` como fuente de verdad de órdenes reales

---

## Pasos exactos para integrar

1. al entrar a `CheckoutPage`, llamar `GET /orders/active`
2. si devuelve una orden `awaiting_payment`, mostrar ese estado y ofrecer
   reanudar / consultar en vez de crear otra
3. si no hay orden activa, leer el carrito real desde `GET /me/cart`
4. construir el body de `POST /checkout` usando:
   - `buyer_email`
   - `buyer_identification` si el total pasa de $50 o si el flujo ya lo
     pide siempre
   - `use_server_cart: true`
   - `items: []`
   - `packs: []`
   - `coupon_code: null` si el cupón ya vive en el carrito server-side
5. generar un UUID nuevo para `Idempotency-Key` por cada intento real de
   checkout
6. si `POST /checkout` responde `201`, hacer:

```ts
window.location.assign(response.payphone_redirect_url)
```

7. crear las páginas del frontend:
   - `/checkout/success`
   - `/checkout/error`
   - `/checkout/pending`
8. en esas páginas leer `order` desde query string y luego llamar
   `GET /orders/{order_id}`
9. renderizar la UI según `status`, `short_id`, `totals` y
   `payphone_transactions`

---

## Qué pantallas debe tener el frontend

### 1) `CheckoutPage`

Responsabilidades mínimas:

- mostrar resumen del carrito real
- pedir email del comprador si el frontend no lo trae de sesión
- pedir identificación cuando aplique
- iniciar `POST /checkout`
- bloquear doble submit mientras el request esté en curso

### 2) `CheckoutSuccessPage`

Debe:

- leer `order_id` desde query string
- llamar `GET /orders/{order_id}`
- mostrar confirmación solo si el status real es `confirmed`
- mostrar `short_id` como identificador útil para soporte

### 3) `CheckoutErrorPage`

Debe:

- leer `order_id`
- consultar `GET /orders/{order_id}`
- mostrar mensaje de reintento si el status real es `failed` o `expired`
- permitir volver al carrito o reiniciar checkout

### 4) `CheckoutPendingPage`

Debe:

- leer `order_id`
- consultar `GET /orders/{order_id}`
- explicar que el backend quedó esperando confirmación
- permitir refresh manual del estado

### 5) `MyPurchaseDetailPage` o equivalente

Debe usar `GET /orders/{order_id}` como fuente de verdad para mostrar:

- status
- total
- fotos/items comprados
- transacciones Payphone si Omar quiere mostrar soporte/debug

---

## Qué NO debe hacer Omar / el LLM del frontend

- no confirmar el pago desde frontend
- no llamar Payphone `Confirm` desde browser
- no abrir popup ni iframe para este MVP
- no usar la app de Payphone
- no guardar órdenes reales en `localStorage` como verdad final
- no crear una segunda orden si `GET /orders/active` ya devolvió una
- no asumir `confirmed` solo porque el usuario volvió de Payphone
- no reconstruir montos en frontend a punta de cálculos propios
- no depender de mocks legacy de checkout

---

## Modelo mental correcto del flujo

- el carrito real vive en backend
- la orden real vive en backend
- Payphone cobra en su pantalla hosted
- el backend confirma el pago
- el frontend solo arranca el checkout, redirige y luego consulta estado

Si Omar respeta ese modelo, no se mete en huevadas de duplicidad,
replay, ni estados fantasmas en el browser.

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests automatizados de cliente Payphone
- tests de rutas checkout/orders
- tests globales del workspace API pasando
