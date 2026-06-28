# Admin — Sales

Slice del panel admin para **ver las ventas** atribuidas por fotógrafo, con filtros
y totales. Es la pantalla `/admin/ventas`.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/sales`

(No hay export CSV server-side — el FE lo genera en cliente. No hay refund desde
aquí — eso vive en `admin-orders.md`. No hay filtro por estado ni settlement/payouts:
fuera de alcance.)

## Modelo mental: venta ≠ orden

- una **orden** es la transacción del comprador (un pago Payphone). Vive en
  `admin-orders.md`.
- una **venta** (sale) es **una foto vendida**, atribuida al fotógrafo que la subió.
  Una orden de 3 fotos = **3 ventas**. Esta pantalla lista ventas.
- solo cuentan las ventas de órdenes **`confirmed`** (las refunded/reversed no
  aparecen).

## Regla de integración

> Ver el mapa completo de KPIs y el modelo del split en [earnings-kpis.md](./earnings-kpis.md).

- dinero en **centavos USD** (no €): `gross_cents` (bruto), `payphone_fee_cents`
  (comisión de la pasarela ~5.75%), `net_cents` (= bruto − fee).
- **packs**: cuando una foto se vendió dentro de un pack, su `gross_cents` es la
  **parte proporcional del precio del pack** (el precio del pack repartido entre
  sus fotos), no el precio individual. Así las ventas suman exactamente lo pagado.
- **split de ganancias** (por venta y en `totals`): el bruto se parte 20%
  plataforma / 80% pozo de fotógrafos. El backend ya devuelve el desglose:
  - `platform_commission_cents` — 20% del bruto (comisión total de la plataforma).
  - `picshot_net_cents` — 14.25% del bruto (utilidad neta de Picshot = comisión − Payphone).
  - `pool_contribution_cents` — 80% del bruto (lo que esa venta aporta al pozo del evento).
  - `platform_earnings_cents` = `picshot_net_cents` (lo que se queda Picshot en esa venta;
    **ya no es `null`**).
- **`photographer_earnings_cents` sigue `null` por venta — a propósito.** En este
  modelo la ganancia del fotógrafo **no es por venta sino por EVENTO** (el pozo del
  80% repartido en partes iguales entre los asignados, pozo ÷ N). Para "cuánto gana
  cada fotógrafo" usa `GET /admin/events/{id}` (`earnings.per_photographer`) o
  `GET /photographer/events` (`my_earnings_cents`). Ver [earnings-kpis.md](./earnings-kpis.md).

---

## `GET /admin/sales`

### Headers

- `Authorization: Bearer <token>`

### Query (opcional)

- `event_id` (uuid), `photographer_id` (uuid)
- `from`, `to` — rango de fechas `YYYY-MM-DD` sobre la fecha de la venta
  (`sold_at` = confirmación de la orden), zona `America/Guayaquil`
- `cursor`, `limit` (default 20, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "019f07d5-1900-7aaa-bbbb-000000000001",
      "order_id": "019f07d5-18e9-7bd0-ab46-2ef464d9c715",
      "order_short_id": "PCS-2026-0005",
      "event_id": "019eed3f-73d3-7002-8bf6-5261dc3ca95a",
      "event_title": "Maratón de Guayaquil",
      "photographer_id": "019eed3f-73cf-7c01-8fc6-6e72be9fede3",
      "photographer_name": "Seed Photographer",
      "buyer_email": "buyer@example.com",
      "photo_id": "019ef138-3a66-7f71-bca4-fb93e39578c7",
      "pack_key": "pack_3",
      "gross_cents": 400,
      "payphone_fee_cents": 23,
      "net_cents": 377,
      "platform_commission_cents": 80,
      "picshot_net_cents": 57,
      "pool_contribution_cents": 320,
      "platform_earnings_cents": 57,
      "photographer_earnings_cents": null,
      "sold_at": "2026-06-27T06:50:00.000Z"
    }
  ],
  "totals": {
    "gross_cents": 3200,
    "payphone_fee_cents": 184,
    "net_cents": 3016,
    "platform_commission_cents": 640,
    "picshot_net_cents": 456,
    "pool_contribution_cents": 2560,
    "sales_count": 7
  },
  "next_cursor": null
}
```

### Notas reales

- `totals` es sobre **todo el conjunto filtrado**, no solo la página — sirve para
  las StatsCards (ingresos / fee / neto y, si querés, comisión / utilidad Picshot /
  pozo). `sales_count` = nº de ventas (fotos).
- `totals` también trae el split agregado del conjunto filtrado:
  `platform_commission_cents`, `picshot_net_cents`, `pool_contribution_cents`.
- `pack_key` es `null` para una compra individual, o el pack (`pack_3`, etc.) si la
  foto se vendió en un pack.
- mapeo de columnas de la tabla: monto = `gross_cents`, comisión = `payphone_fee_cents`,
  comprador = `buyer_email`, fecha = `sold_at`.
- la suma de `payphone_fee_cents` por fila puede diferir 1-2¢ del
  `totals.payphone_fee_cents` por redondeo — usar el de `totals` para los totales.
- **cupones**: `gross_cents` es **neto de descuento** — el descuento del cupón se
  prorratea entre las fotos al momento de la compra, así que la suma de las ventas
  reconcilia exacto con lo realmente cobrado (`total_cents` de la orden).
- paginar con `next_cursor`.

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/sales.ts` real que:

- haga `GET /admin/sales` (con `event_id`, `photographer_id`, `from`, `to`, cursor)
- use USD/centavos (no €) y `snake_case`
- arme las StatsCards desde `totals` (gross/fee/net y, opcional, comisión /
  utilidad Picshot / pozo)
- para "para Picshot" use `picshot_net_cents` / `platform_earnings_cents`; para
  "cuánto va a fotógrafos" use `pool_contribution_cents` (el pozo), **no**
  `photographer_earnings_cents` (que es `null` por venta a propósito — el reparto
  por fotógrafo es por evento; ver [earnings-kpis.md](./earnings-kpis.md))
- para CSV: exportar en cliente desde `items` (no hay endpoint `.csv`)

---

## Qué pantallas debe tener el frontend

### `AdminSalesPage` (`/admin/ventas`)

- 3 StatsCards desde `totals`: ingresos, comisión Payphone, neto
- tabla con `GET /admin/sales`: id/orden, evento, fotógrafo, comprador, monto,
  comisión, fecha
- filtros: evento, fotógrafo, rango de fechas
- (export CSV en cliente para contabilidad)

---

## Qué NO debe hacer Omar / el LLM del frontend

- no confundir venta con orden: una orden de N fotos son N filas aquí
- no asumir que `gross_cents` de un pack es el precio individual: es la parte del pack
- no calcular la ganancia de un fotógrafo desde `/admin/sales`:
  `photographer_earnings_cents` es `null` por venta a propósito (el reparto es por
  evento, pozo ÷ N). Usar `GET /admin/events/{id}` o `GET /photographer/events`
- no esperar un endpoint CSV server-side ni filtro por estado de transacción
- no asumir `camelCase` ni moneda con símbolo: `snake_case`, USD en centavos

---

## Modelo mental correcto

- una venta = una foto vendida atribuida a su fotógrafo; un pack se reparte entre
  sus fotos para que la atribución sume exacto lo pagado
- `net_cents` = bruto − comisión Payphone; **no** es lo que se lleva el fotógrafo:
  de cada venta, 80% (`pool_contribution_cents`) va al pozo del evento y 20%
  (`platform_commission_cents`) a la plataforma. Lo que cobra cada fotógrafo es el
  pozo del evento ÷ N asignados (por evento, no por venta)
- el admin ve TODAS las ventas; los filtros acotan; los totales son del conjunto
  filtrado completo

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (item shape, pack_key, split null, filtros, cursor,
  totals desde aggregate, aislamiento de rol) + unit test de `splitEqualCents`
- **E2E real contra DB**: compra de un **pack_3** ($12) → los `order_items`
  guardan **400/400/400** (suman 1200, reconcilian con el total), no 500×3; tras
  confirmar la orden, `GET /admin/sales` muestra 3 ventas con `gross_cents=400`,
  `pack_key=pack_3`, split por venta (`platform_commission_cents` /
  `picshot_net_cents` / `pool_contribution_cents`) y `photographer_earnings_cents`
  null, y `totals` que reconcilian; filtros
  `event_id`/`photographer_id`/`from-to`; aislamiento (sin auth → 401, customer →
  403, cursor malformado → 400)
