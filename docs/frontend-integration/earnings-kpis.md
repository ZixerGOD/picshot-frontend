# Ganancias y KPIs — mapa para el frontend

Guía maestra del **split de ganancias**: el modelo, todos los KPIs que devuelve el backend,
qué significa cada uno y **en qué pantalla se usa**. Las guías por módulo (admin-sales,
admin-metrics, admin-events, photographer-panel) detallan cada endpoint; esta es el índice.

Todo el dinero es en **centavos USD enteros** (`*_cents`). El frontend formatea.

## El modelo (decisión del cliente)

De cada venta, el bruto se parte así:

```
Bruto ........................ 100%
├─ Comisión plataforma ....... 20%   (lo que NO va a fotógrafos)
│   ├─ Payphone .............. 5.75% del bruto (fee del procesador)
│   └─ Picshot (neto) ........ 14.25% del bruto (comisión − Payphone)
└─ Pozo de fotógrafos ........ 80%
```

- El **pozo de cada EVENTO** = 80% de **todo** lo vendido del evento (packs + fotos sueltas).
- Se reparte en **partes iguales** entre los fotógrafos **asignados** al evento, **hayan
  vendido o no**. (Si hay 10 asignados, el pozo se divide ÷ 10.)
- Cálculo **en vivo**: el pozo y el N de asignados se recalculan al momento. Mientras el
  evento esté activo, la cifra de cada fotógrafo se mueve (sube con ventas, baja si se
  asigna otro fotógrafo). Se estabiliza cuando ya no hay ventas ni cambios de asignación.

Ejemplo: evento bruto **$1200**, 10 asignados → comisión $240 (Payphone $69 + Picshot $171),
pozo $960, **cada fotógrafo $96**.

## Tabla maestra de KPIs

| KPI | Qué es | Endpoint | Pantalla / uso |
|-----|--------|----------|----------------|
| `revenue_cents` | Bruto total vendido (rango) | `GET /admin/metrics/overview` | Dashboard admin — ventas totales |
| `platform_commission_cents` | 20% del bruto (comisión total) | overview · sales · event detail | Dashboard / reportes — comisión |
| `payphone_fee_cents` | 5.75% (fee del procesador) | overview · sales · event detail | Reportes — costo Payphone |
| `picshot_net_cents` | 14.25% (utilidad neta de Picshot) | overview · sales · event detail | Dashboard — **utilidad de la plataforma** |
| `photographers_pool_cents` | 80% total a repartir | `GET /admin/metrics/overview` | Dashboard — total a fotógrafos |
| `gross_cents` (sale) | Bruto de esa venta | `GET /admin/sales` | Reporte de ventas (por fila) |
| `pool_contribution_cents` | 80% que esa venta aporta al pozo | `GET /admin/sales` | Reporte de ventas (por fila) |
| `platform_earnings_cents` | = `picshot_net_cents` (lo que gana Picshot en esa venta) | `GET /admin/sales` | Reporte de ventas |
| `photographer_earnings_cents` | **Siempre `null`** por venta (la ganancia del fotógrafo es por EVENTO, no por venta) | `GET /admin/sales` | — (no usar; ver event detail / panel) |
| `earnings.pool_cents` | Pozo del evento (80%) | `GET /admin/events/{id}` | Detalle del evento — ganancias |
| `earnings.assigned_count` | N de fotógrafos asignados | `GET /admin/events/{id}` | Detalle del evento |
| `earnings.per_photographer[]` | Cada asignado con su parte (`earnings_cents`) | `GET /admin/events/{id}` | Detalle del evento — **a quién se le paga cuánto** |
| `pool_cents` (evento) | Pozo del evento (80% del bruto total) | `GET /photographer/events` | Panel del fotógrafo |
| `assigned_count` (evento) | N de asignados al evento | `GET /photographer/events` | Panel del fotógrafo |
| `my_earnings_cents` | **Lo que gana ESTE fotógrafo** en el evento (pozo ÷ N) | `GET /photographer/events` | Panel del fotógrafo — **mis ganancias** |
| `gross_cents` (photographer) | Volumen **vendido** de las fotos propias (informativo, NO es lo que cobra) | `GET /photographer/events` · `GET /photographer/sales` | Panel — volumen propio |

## Notas importantes para Omar

- **La ganancia de un fotógrafo es por evento, no por venta.** En `/admin/sales`,
  `photographer_earnings_cents` es `null` a propósito. Para "cuánto gana cada fotógrafo" usa
  `GET /admin/events/{id}` (`earnings.per_photographer`) o `GET /photographer/events`
  (`my_earnings_cents`). Esos dos coinciden persona-a-persona y suman el pozo exacto.
- **En el panel del fotógrafo**, `gross_cents` es su volumen vendido (cuánto se vendió de
  sus fotos, informativo); **lo que cobra es `my_earnings_cents`** (su parte del pozo). No
  confundir: en el modelo de partes iguales, lo que vendió no determina lo que cobra. El
  panel del fotógrafo **no** expone `payphone_fee_cents` ni `net_cents` (son métricas de
  plataforma, no de su pago).
- **`my_earnings_cents` es un estimado en vivo** mientras el evento esté activo (cambia con
  ventas y asignaciones). El front puede mostrarlo como "estimado" hasta que el evento cierre.
- **No hay endpoint de "total general" del fotógrafo**: sumá `my_earnings_cents` de sus
  eventos en el cliente.
- **Redondeo / KPIs de dashboard**: los totales de `overview` (agregado) y de `/admin/sales`
  (por venta) pueden diferir en 1–2¢ del pozo real por-evento, por redondeos a distinto
  nivel. **La fuente de verdad de pago son los números por-evento** (`per_photographer` y
  `my_earnings_cents`), que cuadran exacto. No persigas diferencias fantasma de centavos
  entre el dashboard y los pagos.
- **Pozo huérfano**: un evento con ventas pero sin fotógrafos asignados muestra `pool_cents`
  > 0 con `assigned_count: 0` y `per_photographer: []` — plata vendida sin a quién pagar.
  Es señal para que el admin asigne fotógrafos.
