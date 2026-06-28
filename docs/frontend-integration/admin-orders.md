# Admin — Orders (+refund)

Slice del panel admin para **gestionar órdenes**: listarlas (con filtros), ver el
detalle completo (items, totales, transacciones Payphone) y **emitir refunds**.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/orders`
- `GET /admin/orders/{order_id}`
- `POST /admin/orders/{order_id}/refund`

(No hay refund parcial ni edición de la orden: fuera de alcance. El reverso real a
Payphone **sí** ocurre en el refund cuando está dentro de ventana — ver "Efectos".)

## Regla de integración

- el **refund intenta el reverso real en Payphone** si está dentro de ventana
  (mismo día, < 20:00 EC); fuera de ventana o si falla, el reembolso del dinero es
  manual/externo. En todos los casos el refund marca la orden `refunded`, revoca
  descargas futuras y notifica al comprador (ver "Efectos" en el endpoint)
- solo una orden **`confirmed`** se puede refundar; cualquier otro estado →
  `ORDER_NOT_REFUNDABLE`
- el detalle reusa **el mismo shape de orden** que el lado cliente
  (`GET /orders/{order_id}`, ver `checkout-orders.md`)
- dinero en centavos; fechas ISO-8601

---

## 1) `GET /admin/orders`

Lista paginada de órdenes (no incluye las soft-deleted).

### Headers

- `Authorization: Bearer <token>`

### Query (opcional)

- `status` = `pending | awaiting_payment | expired | cancelled | confirmed | failed | reversed | refunded`
- `q` — busca por `short_id` o `buyer_email` (insensible a mayúsculas)
- `from`, `to` — rango de fechas `YYYY-MM-DD` sobre la fecha de creación
  (días calendario `America/Guayaquil`)
- `cursor`, `limit` (default 20, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "019f01ee-3017-70c2-9659-812aa94628f1",
      "short_id": "PCS-2026-0004",
      "buyer_email": "buyer@example.com",
      "buyer_name": "Test Payphone",
      "total_cents": 500,
      "status": "confirmed",
      "item_count": 1,
      "created_at": "2026-06-26T03:16:54.935Z",
      "confirmed_at": "2026-06-26T03:18:53.103Z",
      "refunded_at": null
    }
  ],
  "next_cursor": null
}
```

### Notas reales

- `buyer_name` viene del usuario dueño de la cuenta (puede ser `null`)
- `item_count` = nº de fotos sueltas + nº de packs de la orden
- cada `item` del detalle trae **`preview_url`/`thumbnail_url`/`bib`** de la foto, para
  mostrar cada compra con su miniatura (mismo shape en el detalle del comprador)
- el item de la lista es **resumido**; para items/packs/pagos usar el detalle
- paginar con `next_cursor`

---

## 2) `GET /admin/orders/{order_id}`

Detalle completo. **Mismo shape que `GET /orders/{order_id}`** (ver
`checkout-orders.md`): incluye `items[]`, `packs[]`, `coupon_code`, `totals`,
`status`, fechas, `refunded_at`, `refund_reason` y `payphone_transactions[]`.

### Response `200` (resumen de campos)

```json
{
  "id": "uuid", "short_id": "PCS-2026-0004", "user_id": "uuid",
  "buyer_email": "buyer@example.com", "buyer_identification": null,
  "items": [{ "photo_id": "uuid", "unit_price_cents": 500, "pack_id": null,
    "preview_url": "https://.../preview.jpg", "thumbnail_url": "https://.../thumb.jpg", "bib": "1234" }],
  "packs": [],
  "coupon_code": null,
  "totals": { "subtotal_cents": 500, "discount_cents": 0, "total_cents": 500 },
  "status": "confirmed",
  "created_at": "...", "expires_at": "...", "confirmed_at": "...",
  "refunded_at": null, "refund_reason": null,
  "payphone_reverse_status": null,
  "payphone_transactions": [{
    "id": "uuid", "transaction_id": "...", "client_transaction_id": "...",
    "response_code": 3,
    "card_brand": "Visa", "card_type": "Credit", "card_last4": "4242",
    "authorized_at": "...", "confirmed_at": "...",
    "message": "Approved", "attempt_number": 1
  }]
}
```

- `404 NOT_FOUND` si el `order_id` no existe
- el admin ve **cualquier** orden (no solo las propias)
- el `refund_note` interno **no** se expone aquí (solo `refund_reason`)
- **datos de tarjeta** (`card_brand`, `card_type`, `card_last4`): vienen del confirm
  de Payphone. Cualquiera puede ser `null` (transacciones canceladas/fallidas o
  métodos sin tarjeta). `card_last4` son solo los últimos 4 dígitos — nunca el
  número completo. Para UI: `{card_brand} {card_type} ••••{card_last4}` →
  "Visa Credit ••••4242"

---

## 3) `POST /admin/orders/{order_id}/refund`

Marca la orden como reembolsada (cambio de estado interno).

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` — **requerido**

### Request

```json
{
  "reason": "buyer_request",
  "note": "el comprador pidió reembolso por teléfono"
}
```

- `reason` requerido: `buyer_request | duplicate | system_error | other`
- `note` opcional (texto libre, máx 500); se guarda para auditoría pero **no** se
  devuelve en el detalle

### Response `200`

La orden con `status: "refunded"` (mismo shape del detalle, con `refunded_at` y
`refund_reason` ya seteados).

### Efectos

- la orden pasa a `refunded`
- **se revocan las descargas futuras**: pedir un signed URL de una foto de esa
  orden devuelve `ORDER_REFUNDED` (410), y `/me/purchases` la muestra con
  `downloadable=false`
- se notifica al comprador (email)
- **reverso del dinero en Payphone (automático cuando se puede)**: si la orden está
  dentro de la ventana que Payphone permite (mismo día de la transacción, hasta las
  **20:00 hora Ecuador**), el backend pide el reverso a Payphone y el dinero vuelve
  a la tarjeta del cliente solo. Si está **fuera de ventana** o no se puede, la
  orden igual queda `refunded` y la devolución es **manual/externa**. El `status`
  es `refunded` en todos los casos.
- **`payphone_reverse_status`** (campo nuevo en el detalle): es el estado operable
  del reverso, para que el operador sepa si debe hacer devolución manual:
  | valor | significado | acción del operador |
  |---|---|---|
  | `reversed` | Payphone devolvió el dinero | **no** hacer nada |
  | `rejected` | Payphone rechazó el reverso | revisar el motivo en el audit; devolver manual si el dinero no volvió (un raro "ya reversada" out-of-band cae aquí — verificar en Payphone) |
  | `skipped` | fuera de ventana o sin transacción | devolución manual |
  | `uncertain` | no se pudo confirmar (timeout/red/respuesta ambigua) | **verificar primero en Payphone** antes de devolver manual (riesgo de doble pago) |
  | `pending` | reverso aún en proceso/reintentándose | esperar; el sistema lo reintenta |
  | `null` | la orden no está reembolsada | — |
  Un job de reconciliación reintenta automáticamente los `pending`/`uncertain`
  dentro de ventana; fuera de ventana pasan a `skipped`. **UI sugerida**: badge
  verde "Dinero devuelto" (`reversed`), ámbar "Devolución manual" (`rejected`/`skipped`),
  rojo "Verificar en Payphone" (`uncertain`), gris "Procesando" (`pending`).

### Errores

| Code | HTTP | Qué significa | Qué debe hacer frontend |
|---|---|---|---|
| `ORDER_REFUNDED` | 410 | la orden ya estaba reembolsada | refrescar; ya está refunded |
| `ORDER_NOT_REFUNDABLE` | 409 | la orden no está `confirmed` (ej. pending/expired/failed) | deshabilitar el botón si `status != confirmed` |
| `NOT_FOUND` | 404 | el `order_id` no existe | refrescar la lista |
| `VALIDATION_ERROR` | 400 | `reason` inválido o body mal formado | validar el form |

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/orders.ts` real que:

- haga `GET /admin/orders` (con `status`, `q`, `from`, `to`, cursor)
- haga `GET /admin/orders/:id` (reusar el tipo de orden del lado cliente —
  es el mismo shape)
- haga `POST /admin/orders/:id/refund` (con `Idempotency-Key`)
- use USD/centavos (no €) y `snake_case`

---

## Qué pantallas debe tener el frontend

### `AdminOrdersPage` (`/admin/ordenes`)

- tabla con `GET /admin/orders` (short_id, comprador, total, estado, nº items,
  fecha)
- filtros: estado, búsqueda (`q`), rango de fechas (`from`/`to`)
- abrir detalle (`GET /admin/orders/:id`) con items, totales y transacciones
  Payphone
- acción **reembolsar** (con confirmación + selección de `reason` y `note`
  opcional), solo habilitada si la orden está `confirmed`

---

## Qué NO debe hacer Omar / el LLM del frontend

- no asumir que el reembolso del dinero es siempre automático: el reverso en
  Payphone solo ocurre dentro de ventana (mismo día, < 20:00 EC); fuera de ventana
  es manual/externo. El `status` siempre queda `refunded` igual
- no ofrecer refund parcial ni "des-refundar": no existen
- no permitir reembolsar una orden no `confirmed` (el backend devuelve 409)
- no reintentar el `POST` refund sin `Idempotency-Key` (es requerido); reusar la
  misma key para el mismo intento (replay seguro)
- no asumir que el item de la lista trae items/packs: eso vive en el detalle
- no asumir `camelCase` ni moneda con símbolo: `snake_case`, USD en centavos

---

## Modelo mental correcto

- una orden ≠ una venta: la orden es la transacción del comprador (con sus pagos
  Payphone); la atribución por fotógrafo/comisión vive en otro slice (sales)
- refundar es una acción administrativa interna: protege al comprador cortando
  las descargas y deja registro auditado; el dinero se gestiona aparte
- el comprador conserva la orden en su historial, pero ya no puede descargar

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (incl. idempotencia, filtros, aislamiento de rol,
  refund best-effort de email)
- **E2E real contra DB**: list con `buyer_name`/`item_count` y filtros
  (`status`, `q` por short_id y email, `from/to`, paginación); detalle shape 7.3;
  **refund** de una orden confirmed → `refunded` + audit `order.confirmed_to_refunded`;
  idempotency replay; segundo refund → `ORDER_NOT_REFUNDABLE`; **cruce con
  downloads**: tras refundar todas las órdenes que poseen la foto, el comprador
  recibe `ORDER_REFUNDED` (410) al pedir su signed URL; aislamiento (sin auth →
  401, customer → 403); refund de orden inexistente → 404
