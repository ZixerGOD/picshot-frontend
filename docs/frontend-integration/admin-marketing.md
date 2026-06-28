# Admin — Marketing (campañas)

Slice del panel admin para **disparar una campaña de marketing**: un correo a todos los
usuarios con opt-in. Es la pantalla `/admin/marketing` (o un modal "Nueva campaña").

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `POST /admin/marketing/campaigns`

(No hay: programar campañas a futuro, segmentación por audiencia, plantillas guardadas,
listado/estado de campañas enviadas, ni métricas de apertura/click. Todo eso es fuera de
alcance hoy. El **unsubscribe** del lado usuario vive en [`account.md`](./account.md).)

## Modelo mental

- La campaña se envía a los usuarios con **`marketing_opt_in = true`** + **email
  verificado** + **cuenta activa**. El opt-in se captura en el registro (checkbox
  desmarcado por defecto). Los correos transaccionales (recibo, reset, etc.) **nunca**
  dependen de este opt-in; el marketing **sí**.
- El envío es **asíncrono**: el endpoint NO envía en el request. Encola un trabajo de
  fan-out en background que pagina los destinatarios, acuña un link de baja único por
  usuario y encola un correo por cada uno. Por eso la respuesta es **202 Accepted** y **no
  devuelve un conteo de destinatarios** (no se conoce de forma síncrona).
- El correo es **prioridad 5** (la más baja): si la cuota diaria de envío se tensa, el
  marketing es lo primero que se difiere al día siguiente (los críticos salen igual). Ver
  [`../emails/emails.md`](../emails/emails.md). En dev/sin SMTP, los correos quedan en
  log-only.
- Cada correo incluye obligatoriamente un **link de cancelar suscripción** que apunta a
  `/cancelar-suscripcion?token=…` (página del FE, ver `account.md`).

## Regla de integración

- **Idempotency-Key obligatorio** (igual que el resto de mutaciones admin): header
  `Idempotency-Key: <uuid>`. Generar **uno por intento de envío** y reusarlo si la red
  falla y reintentas (no generar uno nuevo por reintento).
- **Anti doble-blast**: además de la idempotency-key, el backend deduplica por
  **contenido** (hash de subject+body+cta) en una ventana de ~10 min. Disparar una campaña
  con el mismo contenido dentro de ese lapso responde **`CONFLICT`** — trátalo como "ya se
  envió esta campaña hace un momento", no como error a reintentar.
- `snake_case` en el body. Sin moneda ni nada de dinero aquí.

---

## `POST /admin/marketing/campaigns`

### Headers

- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>`

### Request

```json
{
  "subject": "Nuevas fotos de la Maratón ya disponibles",
  "body": "Hola,\n\nYa puedes encontrar tus fotos del evento...\n\nNos vemos en la meta.",
  "cta_label": "Ver eventos",
  "cta_url": "https://picshotec.com/eventos"
}
```

- `subject`: 1–150 chars (se limpia de saltos de línea).
- `body`: 1–5000 chars, **texto plano**. Los saltos de línea se convierten en párrafos; el
  HTML que mandes se **escapa** (no se interpreta) — no envíes markup.
- `cta_label` (máx 40 chars) + `cta_url`: **opcionales pero van juntos** (los dos o
  ninguno). `cta_url` debe ser `http(s)`.

### Response `202`

```json
{ "accepted": true }
```

La campaña quedó **encolada**; el envío ocurre en background. No hay conteo de
destinatarios en la respuesta.

### Errores

- `CONFLICT` — campaña de contenido idéntico disparada hace muy poco (dedup). No reintentar.
- `IDEMPOTENCY_KEY_REQUIRED` — falta el header.
- validación de body (subject/body vacíos o muy largos, `cta_url` no-http(s), o `cta_label`
  sin `cta_url` / viceversa).
- `UNAUTHENTICATED` / rol no admin → 401 / 403.

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/marketing.ts` real que:

- haga `POST /admin/marketing/campaigns` con `Idempotency-Key` (un uuid por intento).
- mande `snake_case` (`cta_label`/`cta_url`), texto plano en `body`.
- al recibir **202**, muestre "Campaña encolada, se enviará a los suscriptores" (no un
  número de destinatarios — el backend no lo devuelve).
- al recibir **`CONFLICT`**, muestre "Ya enviaste esta campaña hace un momento" (no
  reintentar automáticamente).

---

## Qué pantallas debe tener el frontend

### `AdminMarketingPage` (`/admin/marketing`)

- formulario: asunto, cuerpo (textarea, texto plano), CTA opcional (label + url).
- botón "Enviar campaña" → POST con Idempotency-Key; confirmación previa ("se enviará a
  todos los suscriptores").
- estado: encolada (202) / duplicada (CONFLICT) / error de validación.

---

## Qué NO debe hacer Omar / el LLM del frontend

- no esperar un conteo de destinatarios en la respuesta (es asíncrono).
- no mandar HTML en `body` (se escapa); usar texto plano con saltos de línea.
- no generar una `Idempotency-Key` nueva por cada reintento del mismo envío.
- no reintentar en `CONFLICT` (es el guard anti doble-blast).
- no construir el link de unsubscribe (lo arma el backend en cada correo); la página de
  baja del usuario sí la implementa el FE (ver `account.md`, `/cancelar-suscripcion`).
- no esperar programación/segmentación/plantillas/métricas: fuera de alcance.

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service/rutas (encola el fan-out con cursor inicial, audita
  `marketing.campaign.created`, dedup por contenido → `CONFLICT`, guard de rol)
- **E2E real contra DB/Redis**: con usuarios sembrados (opted-in+verificados, un opted-out
  y un no-verificado), el fan-out acuña tokens `marketing_unsubscribe` y encola
  `marketing_campaign` **solo** a los opted-in+verificados+activos; el opt-out e inactivo se
  excluyen; consumir el token del correo apaga `marketing_opt_in`; un opt-out **entre el
  encolado y el envío** se respeta (no se manda); la cuota difiere el marketing (P5) y deja
  salir un crítico (P1)
