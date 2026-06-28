# Photographer Panel (lectura: eventos, fotos, ventas)

Este slice es la parte de **solo lectura** del panel del fotógrafo: sus
eventos asignados, sus fotos y sus ventas/ganancias. (El upload ya está en
`photographer-upload.md`.)

Todo aquí requiere sesión con **rol `photographer`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /photographer/events`
- `GET /photographer/photos`
- `GET /photographer/sales`

## Regla de integración

- el fotógrafo **solo ve lo suyo**: sus eventos asignados, sus fotos, sus
  ventas. El backend lo scopea por el token; el frontend no manda ningún id
  de fotógrafo
- el dinero viene en centavos enteros. Lo que el fotógrafo **COBRA** es
  `my_earnings_cents` (su parte del pozo del evento, en `GET /photographer/events`);
  `gross_cents` es solo el volumen vendido de sus propias fotos (informativo).
  El fee Payphone lo absorbe Picshot, no el fotógrafo: por eso el panel del
  fotógrafo no expone `payphone_fee_cents` ni `net_cents`
- las ventas cuentan **solo órdenes confirmadas** (las reembolsadas no suman)
- no hay endpoint de "resumen/dashboard": los **totales y los gráficos por
  evento se calculan en el cliente** sumando lo que devuelven estos endpoints

---

## 1) `GET /photographer/events`

> Ver el mapa completo de KPIs y el modelo del split en [earnings-kpis.md](./earnings-kpis.md).

Eventos asignados al fotógrafo, con agregados por evento.

### Headers

- `Authorization: Bearer <token>`

### Response `200`

```json
{
  "items": [
    {
      "id": "019eed3f-73d3-7002-8bf6-5261dc3ca95a",
      "slug": "maraton-guayaquil-2026",
      "title": "Maratón de Guayaquil",
      "description": null,
      "banner_image_url": null,
      "cover_photo_url": null,
      "date": "2026-07-20",
      "city": "Guayaquil",
      "type": "marathon",
      "status": "active",
      "photo_count": 200,
      "runner_count": null,
      "retention_until": "2027-01-20",
      "base_price_cents": 500,
      "packs": [ { "key": "single", "price_cents": 500, "quantity": null, "is_active": true } ],
      "created_at": "2026-06-20T00:00:00.000Z",
      "assigned_at": "2026-06-21T00:00:00.000Z",
      "uploaded_count": 20,
      "sold_count": 4,
      "gross_cents": 2000,
      "pool_cents": 9600,
      "assigned_count": 10,
      "my_earnings_cents": 960
    }
  ]
}
```

### Notas reales

- es el shape público del evento + extras del fotógrafo: `assigned_at`,
  `uploaded_count` (cuántas subió él), `sold_count`, `gross_cents`,
  `pool_cents`, `assigned_count`, `my_earnings_cents`
- **`gross_cents` es el volumen vendido PROPIO del fotógrafo** (cuánto se
  vendió de sus fotos) — es informativo. **Lo que cobra el fotógrafo es
  `my_earnings_cents`**: su parte del **pozo del evento** (`pool_cents` = 80% del
  bruto TOTAL del evento) dividido en partes iguales entre los asignados
  (`pool_cents` ÷ `assigned_count`). No depende de cuánto vendió él.
- `pool_cents` es el pozo de TODO el evento (todos los fotógrafos); `assigned_count`
  es el N de asignados (el divisor). `my_earnings_cents` se recalcula **en vivo**:
  sube con ventas del evento, baja si se asigna otro fotógrafo. Mostralo como
  "estimado" hasta que el evento cierre. Ver [earnings-kpis.md](./earnings-kpis.md).
- `photo_count` es el total publicado del evento; `uploaded_count` es lo del
  fotógrafo. No confundirlos
- no está paginado (un fotógrafo tiene pocos eventos)
- **no hay endpoint de total general**: el "total a cobrar" se arma sumando
  `my_earnings_cents` de estos `items` en cliente (no sumes `gross_cents`, eso es
  volumen propio, no lo que cobra)

---

## 2) `GET /photographer/photos`

Las fotos del fotógrafo, paginadas.

### Query (opcional)

- `event_id` — filtrar por evento
- `cursor`
- `limit` (default 30, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "019ef138-3a66-7f71-bca4-fb93e39578c7",
      "event_id": "019eed3f-73d3-7002-8bf6-5261dc3ca95a",
      "event_title": "Maratón de Guayaquil",
      "preview_url": "http://localhost:3000/storage/events/.../preview.jpg",
      "thumbnail_url": "http://localhost:3000/storage/events/.../thumb.jpg",
      "price_cents": 500,
      "status": "published",
      "bib": "1234",
      "width": 6000,
      "height": 4000,
      "taken_at": null,
      "uploaded_at": "2026-06-22T12:00:00.000Z",
      "sales_count": 1
    }
  ],
  "next_cursor": null
}
```

### Notas reales

- `status` puede ser `processing | published | hidden | failed`. Justo
  después de subir, las fotos están en `processing` (con `width`/`height` en
  `0`) hasta que el worker las indexa → el frontend debe **refrescar/poll**
  para verlas pasar a `published`
- `sales_count` es cuántas veces se vendió esa foto (órdenes confirmadas)
- paginar con `next_cursor`

---

## 3) `GET /photographer/sales`

Las ventas del fotógrafo, con totales del conjunto filtrado.

### Query (opcional)

- `from`, `to` — rango de fechas `YYYY-MM-DD` (zona America/Guayaquil)
- `event_id`
- `cursor`
- `limit` (default 30, máx 100)

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
      "pack_key": null,
      "gross_cents": 500,
      "sold_at": "2026-06-26T03:18:53.103Z"
    }
  ],
  "totals": {
    "gross_cents": 2000,
    "sales_count": 4
  },
  "next_cursor": null
}
```

### Notas reales

- `totals` es sobre **todo el conjunto filtrado**, no solo la página actual:
  sirve para las tarjetas de "ganancias totales / ventas".
- el **ranking/gráfico por evento** se arma en cliente agrupando `items` por
  `event_id` (el backend no manda ese desglose)
- `gross_cents` (item y `totals`) mide el **volumen de sus ventas propias**, no
  lo que cobra. Lo que cobra el fotógrafo es por evento (`my_earnings_cents` en
  `GET /photographer/events`, su parte del pozo ÷ N). No asumas que `gross_cents`
  es "lo que se lleva el fotógrafo". El fee Payphone lo absorbe Picshot, por eso
  no hay `payphone_fee_cents`/`net_cents` aquí. Ver [earnings-kpis.md](./earnings-kpis.md)

---

## Errores importantes

| Code | HTTP | Qué significa |
|---|---|---|
| `FORBIDDEN` | 403 | el token no es de rol `photographer` |
| `UNAUTHENTICATED` | 401 | sin token |
| `VALIDATION_ERROR` | 400 | query inválido (ej. `from`/`to` mal, cursor corrupto) |

---

## Adaptación recomendada al frontend

Crear un `lib/api/photographer.ts` real que:

- haga `GET /photographer/events`
- haga `GET /photographer/photos` (con `event_id` y cursor)
- haga `GET /photographer/sales` (con `from`/`to`/`event_id` y cursor)
- calcule en cliente: stats del dashboard y desgloses por evento
- deje de usar el `DEMO_PHOTOGRAPHER_ID` y los datos mock

---

## Qué pantallas debe tener el frontend

### 1) `PhotographerDashboardPage` (`/fotografo`)

- stats: **ganancias = suma de `my_earnings_cents`** (lo que cobra), más fotos y
  ventas, todo desde `GET /photographer/events`
- gráfico "ganancias por evento" usando `my_earnings_cents` por evento (no
  `gross_cents`, que es volumen propio)
- lista de eventos asignados

### 2) `PhotographerPhotosPage` (`/fotografo/fotos`)

- grid de fotos desde `GET /photographer/photos`
- filtro por evento (`event_id`)
- mostrar el `status` (procesando / publicada / error) y refrescar para ver
  las `processing` pasar a `published`

### 3) `PhotographerEarningsPage` (`/fotografo/ganancias`)

- tarjetas con `totals` de `GET /photographer/sales`
- tabla "historial de ventas" desde `items`
- gráfico por evento agrupando `items` en cliente

---

## Qué NO debe hacer Omar / el LLM del frontend

- no mandar ningún `photographer_id`: el backend usa el token
- no asumir que `gross_cents` es lo que cobra el fotógrafo: eso es volumen de
  sus ventas propias. **Lo que cobra es `my_earnings_cents`** (su parte del pozo
  del evento, en partes iguales). Ver [earnings-kpis.md](./earnings-kpis.md)
- no esperar `payphone_fee_cents`/`net_cents` en el panel del fotógrafo: el fee
  Payphone lo absorbe Picshot, no se le descuenta al fotógrafo
- no sumar `gross_cents` para el "total a cobrar": sumá `my_earnings_cents`
- no esperar un endpoint de "resumen": los totales globales (excepto
  `sales.totals`) y los desgloses por evento se calculan en cliente
- no asumir que la foto recién subida ya está `published` (puede estar
  `processing`); refrescar
- no asumir moneda con símbolo: es USD en centavos, el frontend formatea
- no asumir `camelCase`: la red manda `snake_case`

---

## Modelo mental correcto

- el fotógrafo es dueño de sus fotos; sus ventas se derivan de `OrderItem`
  sobre órdenes confirmadas
- el backend hace el scoping por token; el frontend solo pinta
- los gráficos/rankings por evento son trabajo del cliente sobre los datos
  que devuelven estos tres endpoints

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de `earnings`, service y rutas del panel
- **E2E real contra DB**: contra un fotógrafo con ventas reales, cuadrando
  `uploaded/sold/gross` y `totals` contra SQL directo, más aislamiento entre
  fotógrafos, filtros `event_id`/`from`/`to` y paginación
