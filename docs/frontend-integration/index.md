# Frontend Integration Hub

> 🟢 **Empieza aquí: [`INTEGRATION-PROMPT.md`](./INTEGRATION-PROMPT.md)** — guía de
> integración por fases (verificar health/CORS → leer/mapear → planificar → integrar
> módulo por módulo con pruebas). Léelo completo antes de codear.

Este directorio existe para que Omar —o su LLM— pueda integrar el
frontend contra el backend **sin adivinar** contratos, shapes ni
comportamientos.

La regla aquí es simple:

- documentamos **lo que el backend hace hoy**
- separamos claramente lo implementado de lo pendiente
- explicamos la adaptación que el frontend debe hacer
- evitamos mezclar mocks legacy con contrato real

---

## Cómo usar esta carpeta

1. Leer este `index.md`.
2. Ir al documento del módulo a integrar.
3. Implementar la capa `lib/api` del frontend usando el shape real del
   backend.
4. Si un endpoint cambia, **primero** se actualiza esta carpeta.

---

## Estado de confianza para integración

Lo que está documentado aquí como implementado:

- existe en backend real
- tiene contrato documentado
- fue probado contra la API local levantada
- tiene respaldo de tests automatizados

En otras palabras: **Omar sí puede integrar contra esto** sin asumir
que son mocks o ideas futuras.

Lo que todavía no exista o no esté cerrado se marca explícitamente como
pendiente. Aquí no vamos a vender humo.

---

## Decisiones de integración

### 1) El backend es la fuente de verdad

El frontend viejo tiene varios shapes legacy (`camelCase`, arrays planos,
campos como `image`, `location`, `basePrice`, `url`, etc.).

No vamos a deformar el backend para calzar esos mocks.  
La integración correcta es:

1. consumir el contrato backend real
2. mapearlo en la capa API del frontend
3. dejar la UI libre para seguir usando sus tipos internos si Omar quiere

### 2) Request/response se respetan tal como salen del backend

- JSON en `snake_case`
- errores con `error.code`
- dinero en centavos
- fechas en ISO-8601 UTC o `YYYY-MM-DD` según el campo
- listas paginadas con `{ items, next_cursor }`

### 3) Lo no implementado no se documenta como si existiera

Si algo todavía no está soportado de verdad, aquí se marca explícitamente
como pendiente.

---

## Documentos disponibles

- [Auth](./auth.md) — comportamiento real actual del backend auth
- [Consents](./consents.md) — consentimiento biométrico y AI por evento,
  con lecturas server-side para reemplazar `localStorage`
- [Events público](./events-public.md) — catálogo público, detalle de
  evento y galería pública; dropdowns de filtro (ciudades y tipos de evento)
- [Face Search](./face-search.md) — búsqueda facial por selfie,
  endpoint sincrónico con consent checks
- [Cart](./cart.md) — carrito server-side, merge guest → user,
  packs y validación/persistencia de cupones
- [Checkout + Orders](./checkout-orders.md) — checkout real con
  redirección Payphone card-only, confirmación backend y lectura de
  órdenes desde la API
- [Photographer Upload](./photographer-upload.md) — batch upload de
  fotos con validación, idempotency y procesamiento async
- [Downloads + Purchases](./downloads-purchases.md) — historial de compras
  y descarga del original vía signed URLs (mint + navegar)
- [Account](./account.md) — perfil (`GET/PATCH /me`), cambio de contraseña,
  logout-all, marketing unsubscribe y set-password del fotógrafo invitado
- [Photographer Panel](./photographer-panel.md) — lectura del panel:
  eventos asignados, fotos y ventas/ganancias del fotógrafo
- [Admin — Photographers](./admin-photographers.md) — gestión de
  fotógrafos (crear+invitar, editar, desactivar, soft delete)
- [Admin — Events](./admin-events.md) — CRUD de eventos (packs inline),
  transiciones de estado, asignar/desasignar fotógrafos, soft delete; cierre
  programado (`closes_at`) y catálogo gestionable de tipos de evento (`/admin/event-types`)
- [Admin — Photos](./admin-photos.md) — moderación de fotos (listar con
  filtros, eliminar: hide si vendida / hard delete si no)
- [Admin — Coupons](./admin-coupons.md) — CRUD de cupones (percent/fixed,
  global o por evento, vigencia, soft delete)
- [Admin — Orders](./admin-orders.md) — órdenes: listar (filtros), detalle
  (shape 7.3) y refund (revoca descargas + reverso best-effort en Payphone dentro
  de ventana; expone `payphone_reverse_status`)
- [**Ganancias y KPIs**](./earnings-kpis.md) — **mapa maestro** del split (20% plataforma
  / 80% pozo ÷ N asignados) + tabla de todos los KPIs y en qué pantalla va cada uno
- [Admin — Sales](./admin-sales.md) — ventas por fotógrafo (venta≠orden), pack
  repartido entre fotos, fee Payphone + desglose del split por venta
- [Admin — Metrics](./admin-metrics.md) — dashboard: overview (KPIs + rankings) y
  serie diaria (analytics); revenue bruto, tráfico en 0 (pendiente)
- [Admin — Marketing](./admin-marketing.md) — disparar campañas (fan-out async a
  opted-in, idempotente, dedup por contenido)
- [Public Forms](./forms.md) — contacto y trabaja-con-nosotros (públicos, rate-limit
  por IP, guardan en DB + notifican al admin)

Cada documento incluye:

- alcance real del slice
- requests y responses útiles
- errores importantes
- adaptación recomendada al frontend
- estado de verificación runtime

---

## Convenciones rápidas para el LLM del frontend

- **No asumir mocks legacy**
- **No asumir `camelCase` desde la red**
- **No asumir arrays planos cuando el backend devuelve paginación**
- **No inventar campos que el backend no manda**
- **Mapear en `lib/api`, no en componentes UI**

---

## Cobertura

Esta carpeta cubre los slices del backend entregados (auth —incluido `POST /auth/refresh`
y el unsubscribe de marketing en `account.md`—, consents, eventos, búsqueda, carrito,
checkout, downloads, fotógrafo, los módulos admin —incluido **marketing** en
[`admin-marketing.md`](./admin-marketing.md)— y los formularios públicos). No quedan slices
del backend pendientes de documentar.
