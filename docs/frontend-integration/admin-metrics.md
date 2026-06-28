# Admin — Metrics & Analytics

Slice del **dashboard admin** (`/admin`) y la pantalla de **métricas**: KPIs
agregados, rankings y una serie diaria de ventas/ingresos.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/metrics/overview`
- `GET /admin/analytics`

(Solo lectura: sin mutaciones. No hay trends/deltas vs período anterior, ni fuentes
de tráfico, ni KPIs operativos — fuera de alcance.)

## Regla de integración

> Ver el mapa completo de KPIs y el modelo del split en [earnings-kpis.md](./earnings-kpis.md).

- dinero en **centavos USD** (no €). `revenue_cents` es **bruto** (antes del fee de
  Payphone ~5.75%); el desglose del split (comisión, fee, utilidad, pozo) viene aparte
  en `overview` (ver abajo).
- ⚠️ **`revenue_cents` NO significa lo mismo en los dos endpoints** (cuidado al pintar):
  - **overview** (y `top_events[]`, `active_photographers[]`): `SUM(order_items.unit_price_cents)`
    = subtotal **bruto de cupón** (no resta el descuento).
  - **analytics** (serie diaria): `SUM(orders.total_cents)` = **neto de cupón** (subtotal −
    descuento).
  - Con cupones aplicados, los totales de overview y analytics **no cuadran** para la misma
    ventana — es esperado, no un bug. No los presentes como el mismo número.
- solo cuentan órdenes **`confirmed`** (refunded/reversed fuera).
- todas las fechas/ventanas usan calendario `America/Guayaquil`.

---

## 1) `GET /admin/metrics/overview`

### Query (opcional)

- `range` = `7d | 30d | 90d` (default `30d`) — ventana para revenue, ventas,
  fotos vendidas y los rankings (`top_events`, `active_photographers`).

### Response `200`

```json
{
  "revenue_cents": 2000,
  "platform_commission_cents": 400,
  "payphone_fee_cents": 115,
  "picshot_net_cents": 285,
  "photographers_pool_cents": 1600,
  "sales_count": 4,
  "photos_sold": 4,
  "active_events": 2,
  "active_coupons": 3,
  "total_photographers": 1,
  "top_events": [
    { "event_id": "uuid", "event_title": "Maratón de Guayaquil", "revenue_cents": 2000, "sales_count": 4 }
  ],
  "active_photographers": [
    { "photographer_id": "uuid", "name": "Seed Photographer", "revenue_cents": 2000, "sales_count": 4 }
  ],
  "coupons_near_limit": [
    { "coupon_id": "uuid", "code": "USEDOUT10", "uses_count": 2, "max_uses": 2 }
  ],
  "events_retention_soon": [
    { "event_id": "uuid", "event_title": "...", "retention_until": "2026-07-10" }
  ]
}
```

### Semántica de cada campo

- **ventaneados por `range`** (sobre la fecha de confirmación de la orden):
  - `revenue_cents` — ingresos brutos de ventas confirmadas.
  - desglose del split sobre ese bruto (ver [earnings-kpis.md](./earnings-kpis.md)):
    - `platform_commission_cents` — 20% del bruto (comisión total de la plataforma).
    - `payphone_fee_cents` — 5.75% del bruto (fee del procesador).
    - `picshot_net_cents` — 14.25% del bruto (**utilidad neta de la plataforma** =
      comisión − Payphone).
    - `photographers_pool_cents` — 80% del bruto (total a repartir entre fotógrafos).
  - `sales_count` — nº de **órdenes** (transacciones).
  - `photos_sold` — nº de **fotos** vendidas (líneas de orden). Por eso
    `photos_sold` ≥ `sales_count` (una orden puede llevar varias fotos).
  - `top_events[]` — top 5 eventos por ingresos. `sales_count` aquí = fotos del evento.
  - `active_photographers[]` — top 5 fotógrafos por ingresos. `sales_count` = fotos.
- **estado actual** (no dependen del `range`):
  - `active_events` — eventos en estado `active`.
  - `active_coupons` — cupones activos y vigentes hoy.
  - `total_photographers` — total de fotógrafos.
  - `coupons_near_limit[]` — cupones con uso ≥ 80% (`uses_count/max_uses`).
  - `events_retention_soon[]` — eventos cuya retención vence en los próximos 30 días.

---

## 2) `GET /admin/analytics`

Serie diaria para los gráficos (ventas/ingresos por día).

### Query (opcional)

- `days` — nº de días hacia atrás (default `14`, **máx 90**).

### Response `200`

```json
{
  "items": [
    {
      "date": "2026-06-22",
      "visits": 0,
      "page_views": 0,
      "unique_visitors": 0,
      "sales_count": 3,
      "revenue_cents": 1500
    }
  ]
}
```

### Notas reales

- un item por **cada** día del rango (los días sin ventas vienen con `0`, ya
  rellenados — no hay huecos).
- `sales_count` = órdenes confirmadas ese día; `revenue_cents` = ingresos brutos
  de ese día (calendario Guayaquil).
- **tráfico (`visits`, `page_views`, `unique_visitors`) viene siempre en `0`**: no
  hay tracking de tráfico server-side todavía (se integrará un proveedor en el FE
  más adelante). No los grafiques como datos reales aún.

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/metrics.ts` real que:

- haga `GET /admin/metrics/overview?range=...` para las StatsCards y las tablas
  (top eventos, fotógrafos activos, cupones por cerrarse, retención próxima)
- haga `GET /admin/analytics?days=...` para los gráficos de ventas/ingresos por día
- use USD/centavos (no €) y `snake_case`
- **no** muestre los trends hardcodeados (`12% / 8% / 5%`): el backend no provee
  deltas vs período anterior
- **no** grafique las visitas como reales (vienen en 0)

---

## Qué pantallas debe tener el frontend

### `AdminDashboardPage` (`/admin`)

- StatsCards: ingresos, ventas, fotos vendidas, eventos activos (todo de `overview`);
  opcional: comisión (`platform_commission_cents`), utilidad de la plataforma
  (`picshot_net_cents`) y total a fotógrafos (`photographers_pool_cents`)
- gráfico de ingresos/ventas por día (de `analytics`)
- tablas: "Eventos con más ventas" (`top_events`), "Fotógrafos activos"
  (`active_photographers`), "Cupones por cerrarse" (`coupons_near_limit`),
  "Retención próxima a vencer" (`events_retention_soon`)

### `AdminMetricsPage` (métricas)

- gráficos de `analytics` (ventas/ingresos por día); las tarjetas de tráfico/
  conversión quedan pendientes hasta que haya tracking real

---

## Qué NO debe hacer Omar / el LLM del frontend

- no asumir que `revenue_cents` es neto: es bruto (antes del fee Payphone)
- no graficar visits/page_views/unique_visitors: hoy son 0 (placeholder)
- no esperar trends/deltas ni fuentes de tráfico del backend
- no confundir `sales_count` (órdenes) con `photos_sold` (fotos)
- no asumir `camelCase` ni moneda con símbolo: `snake_case`, USD en centavos

---

## Modelo mental correcto

- `overview` = foto del estado + KPIs de la ventana elegida; `analytics` = serie
  temporal para gráficos
- ingresos = bruto de ventas confirmadas; el split (20% plataforma / 80% pozo) ya
  viene desglosado en `overview` (`platform_commission_cents`, `payphone_fee_cents`,
  `picshot_net_cents`, `photographers_pool_cents`). El reparto **por fotógrafo** no
  está aquí: es por evento (ver [earnings-kpis.md](./earnings-kpis.md))
- el backend agrega; el FE formatea (USD, fechas locales) y elige los rangos

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (ensamblado de campos, ranking + límite, filtro de
  cupones ≥80%, ventana de retención, relleno de días vacíos, tráfico 0, validación
  de `range`/`days`, aislamiento de rol)
- **E2E real contra DB**: `overview` reconcilia con la DB (revenue 2000, sales 4,
  photos 4, 2 eventos activos, 3 cupones, 1 fotógrafo, top_events/active_photographers
  correctos, coupons_near_limit detecta un cupón al 100%); `analytics` devuelve 14
  días con ventas reales en sus días (06-22: 3/1500, 06-25: 1/500) y tráfico 0;
  `range`/`days` inválidos → 400; aislamiento (sin auth → 401, no-admin → 403)
