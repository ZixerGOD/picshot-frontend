# Admin — Coupons

Slice del panel admin para **gestionar cupones** promocionales: listar (con
filtros), crear, editar y eliminar. La validación/aplicación del cupón en el
carrito y el checkout ya existe desde otro slice (ver `cart.md` →
`POST /coupons/validate`); aquí solo se administra el catálogo.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/coupons`
- `POST /admin/coupons`
- `PATCH /admin/coupons/{coupon_id}`
- `DELETE /admin/coupons/{coupon_id}`

(No hay incremento manual de usos, ni reseteo de `uses_count`, ni acciones
masivas: fuera de alcance.)

## Regla de integración

- el `code` se almacena **siempre en MAYÚSCULAS** (el backend normaliza: hace
  trim + upper). `welcome10` y `WELCOME10` son el mismo cupón
- un cupón es de **un tipo**: `percent` (con `discount_value` 1–100) **o**
  `fixed` (con `discount_value_cents`). Nunca ambos
- `event_id: null` = cupón **global** (aplica a todos los eventos); con
  `event_id` = solo ese evento
- vigencia con fechas **date-only** `YYYY-MM-DD` (no timestamps). Se interpretan
  en calendario `America/Guayaquil`
- dinero en centavos; `is_active` controla disponibilidad
- **`max_uses` = tope total de canjes**; `max_uses: null` (o ausente al crear) =
  **usos ilimitados**. Es un entero `>= 1` o `null` — nunca `0`
- **`uses_count` es un contador real**: sube +1 cuando una orden con ese cupón se
  **confirma** (pago aprobado) y baja −1 cuando esa orden se **refunda**. El FE
  solo lo muestra; no hay endpoint para editarlo
- al alcanzar el tope (`uses_count >= max_uses`) el cupón deja de validar en el
  carrito → `COUPON_USAGE_EXCEEDED`. Un cupón ilimitado nunca dispara ese error

---

## 1) `GET /admin/coupons`

Lista paginada de cupones (no incluye los eliminados).

### Headers

- `Authorization: Bearer <token>`

### Query (opcional)

- `q` — busca por `code` (insensible a mayúsculas)
- `event_id` (uuid) — filtra por evento
- `is_active` — `"true"` | `"false"`
- `cursor`
- `limit` (default 20, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "019f06c9-335b-76c0-aa6d-d3779dc5c838",
      "code": "WELCOME10",
      "event_id": null,
      "event_title": null,
      "discount_type": "percent",
      "discount_value": 10,
      "discount_value_cents": null,
      "max_uses": 100,
      "uses_count": 0,
      "valid_from": "2026-06-21",
      "valid_until": "2026-12-31",
      "is_active": true,
      "created_at": "2026-06-27T01:54:37.019Z",
      "updated_at": "2026-06-27T01:54:37.019Z"
    }
  ],
  "next_cursor": null
}
```

### Notas reales

- `event_title` viene resuelto en la respuesta (es `null` si el cupón es global)
- para un cupón `fixed`, `discount_value` es `null` y `discount_value_cents`
  trae el monto; para `percent` es al revés
- `is_active` en el query es **string** (`"true"`/`"false"`)
- paginar con `next_cursor`

---

## 2) `POST /admin/coupons`

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` — **requerido**

### Request — `percent`

```json
{
  "code": "WELCOME10",
  "event_id": null,
  "discount_type": "percent",
  "discount_value": 10,
  "max_uses": 100,
  "valid_from": "2026-06-21",
  "valid_until": "2026-12-31",
  "is_active": true
}
```

### Request — `fixed`

```json
{
  "code": "FLAT5",
  "discount_type": "fixed",
  "discount_value_cents": 500,
  "max_uses": 50,
  "valid_from": "2026-06-21",
  "valid_until": "2026-12-31"
}
```

- `code`, `discount_type`, `valid_from`, `valid_until` son requeridos
- `max_uses` **opcional**: número `>= 1` para un tope total, u **omitirlo** (o
  `null`) para usos **ilimitados**. `0` no es válido
- según el tipo: `percent` ⇒ manda `discount_value` (1–100) y **no**
  `discount_value_cents`; `fixed` ⇒ manda `discount_value_cents` (>0) y **no**
  `discount_value`. Mandar ambos (o el equivocado) → `VALIDATION_ERROR`
- `event_id` opcional; si se manda, debe existir
- `is_active` opcional (default `true`)

### Response `201`

El cupón creado (mismo shape que un item de la lista).

### Errores

| Code | Qué significa | Qué debe hacer frontend |
|---|---|---|
| `COUPON_CODE_DUPLICATE` | ya existe un cupón con ese code | error en el campo code |
| `NOT_FOUND` | el `event_id` no existe | corregir selección de evento |
| `VALIDATION_ERROR` | body inválido: coherencia tipo↔valor, `valid_from > valid_until`, rangos | mostrar validación |

---

## 3) `PATCH /admin/coupons/{coupon_id}`

Edita y/o activa-desactiva. Body **parcial**.

### Request

```json
{
  "code": "SUMMER",
  "event_id": null,
  "discount_type": "fixed",
  "discount_value_cents": 800,
  "max_uses": 200,
  "valid_from": "2026-07-01",
  "valid_until": "2026-08-31",
  "is_active": false
}
```

### Response `200`

El cupón actualizado (mismo shape que un item de la lista).

### Notas reales

- desactivar = `{ "is_active": false }`; reactivar = `{ "is_active": true }`.
  No hay endpoint aparte
- **cambiar de tipo**: si mandas `discount_type: "fixed"`, manda también su
  `discount_value_cents`; el backend anula el lado opuesto automáticamente.
  Si el tipo resultante queda sin su valor → `VALIDATION_ERROR`
- `max_uses`: mandar un número lo fija como tope; mandar `null` lo pasa a
  **ilimitado**; **omitirlo** no lo toca. Un tope numérico no puede quedar por
  debajo del `uses_count` actual → `VALIDATION_ERROR` (pasar a `null` siempre se
  permite)
- `valid_from` debe quedar `<= valid_until` (sobre el estado resultante)
- `404 NOT_FOUND` si el `coupon_id` no existe o ya fue eliminado
- `COUPON_CODE_DUPLICATE` si el nuevo `code` choca con otro cupón

---

## 4) `DELETE /admin/coupons/{coupon_id}`

### Response `204`

- es un **soft delete**: el cupón se marca borrado e inactivo, desaparece de la
  lista y deja de validar en el carrito (`COUPON_NOT_FOUND`)
- `404 NOT_FOUND` si no existe o ya fue eliminado
- las órdenes pasadas que usaron el cupón **no se afectan** (guardan el `code`
  como snapshot, sin relación al cupón)

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/coupons.ts` real que:

- haga `GET /admin/coupons` (con `q`, `event_id`, `is_active`, cursor)
- haga `POST /admin/coupons` (con `Idempotency-Key`)
- haga `PATCH /admin/coupons/:id`
- haga `DELETE /admin/coupons/:id`
- modele el descuento como **unión discriminada** por `discount_type`:
  `percent` usa `discount_value`, `fixed` usa `discount_value_cents`
- use USD/centavos (no €) y `snake_case`

---

## Qué pantallas debe tener el frontend

### `AdminCouponsPage` (`/admin/cupones`)

- tabla con `GET /admin/coupons` (code, evento, descuento, usos
  `uses_count/max_uses`, vigencia, estado)
- filtros: evento, estado (`is_active`), búsqueda por code (`q`)
- crear cupón (form → `POST`), generando un `Idempotency-Key` nuevo por intento
- editar / activar-desactivar (`PATCH`)
- eliminar (`DELETE`, soft)

---

## Qué NO debe hacer Omar / el LLM del frontend

- no mostrar el descuento `fixed` con símbolo `€`: es USD en centavos
- no mandar `discount_value` y `discount_value_cents` juntos: el backend
  rechaza por tipo
- no asumir que `code` distingue mayúsculas: el backend lo normaliza a UPPER
- no reintentar el `POST` sin un `Idempotency-Key` (es requerido); reusar la
  misma key para el mismo intento (replay seguro)
- no ofrecer "sumar usos" ni resetear `uses_count`: no existe
- no asumir campos del wishlist que el backend **no** tiene: cupón apilable
  (stackable), límite por usuario, monto mínimo de compra (`min_purchase`)
- no asumir `camelCase`: la red manda `snake_case`

---

## Modelo mental correcto

- un cupón es de un solo tipo (`percent` o `fixed`); el backend mantiene la
  coherencia y anula el lado opuesto al cambiar de tipo
- `is_active` y la vigencia (`valid_from`/`valid_until`, calendario Guayaquil)
  controlan si el cupón aplica; el carrito valida contra eso en tiempo real
- eliminar es soft: protege las órdenes históricas (que guardan el `code` como
  snapshot) y saca el cupón de circulación

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (incl. coherencia tipo↔valor, idempotencia,
  aislamiento de rol)
- **E2E real contra DB**: create `percent`/`fixed` (normaliza code a UPPER),
  `COUPON_CODE_DUPLICATE` en duplicado, `VALIDATION_ERROR` por incoherencia y
  por `valid_from > valid_until`, `NOT_FOUND` con `event_id` inexistente; list
  con filtros (`q`, `event_id`, `is_active`) y `event_title` resuelto;
  paginación con cursor; PATCH (cambio de tipo, activar/desactivar);
  soft delete; y el **cruce con el carrito**: el cupón valida activo, devuelve
  `COUPON_INACTIVE` tras desactivar y `COUPON_NOT_FOUND` tras eliminar;
  aislamiento (sin auth → 401, no-admin → 403)
