# Prompt de integración Frontend ↔ Backend (Picshot)

> **Para el agente/LLM que integra el frontend.** Lee este archivo COMPLETO antes de
> tocar código. Tu trabajo es conectar el frontend existente con el backend de
> Picshot **por fases, con plan y pruebas**. Está terminantemente prohibido
> "integrar todo de un solo tiro". Avanza poco a poco y valida en cada paso.

---

## 0. Reglas de oro (no negociables)

1. **Trabajas por FASES.** Nunca dispares una integración masiva de golpe. Una cosa
   a la vez, probada, antes de la siguiente.
2. **Primero planificar, después codear.** No escribas código de integración hasta
   tener un plan revisado (Fase 2).
3. **Pregunta antes de asumir.** Si un contrato, un campo o un flujo no está claro,
   pregunta en vez de inventar.
4. **Prueba después de cada módulo.** Implementas un módulo → paras → corres una
   prueba real (request al backend / flujo en la UI) → recién entonces sigues.
5. **No modifiques el backend.** Si encuentras un bug, un campo que falta o algo que
   habría que cambiar en el backend, **NO lo arregles tú**: documéntalo claro
   (endpoint + qué esperabas vs qué pasó) y repórtalo a Omar para que lo escale al
   equipo de backend. Tú puedes **leer** el backend (solo lectura) para entender un
   contrato, pero no lo tocas.
6. El **contrato es estable**: los `error.code` son UPPER_SNAKE_CASE y no cambian;
   el frontend hace `switch` sobre `code` y mapea a copy en español (el `message`
   del backend es técnico, para soporte, **no** se muestra crudo al usuario).

## 1. Fase 0 — Verificar que el backend responde (antes de TODO)

El backend ya está desplegado. Antes de integrar nada:

1. **Confirma la URL base del backend — NO la asumas ni la quemes en el código.**
   El dominio/subdominio/puerto real depende de dónde esté desplegado y **puede
   cambiar**, así que NO hay un host fijo escrito en esta doc a propósito. Antes de
   integrar, **consíguela**: pregúntasela a Omar / al equipo, o revisa la config de
   deploy real del backend (el bloque de Caddy y las env `*_PUBLIC_URL` /
   `CORS_ORIGINS` en `docs/deploy.md`) para saber el host de producción.
2. **Una vez que la tengas, ponla en tu propia env del frontend — nunca hardcodees el
   host en el código.** El cliente HTTP debe leerla de una variable de entorno tuya
   (Vite: `VITE_API_URL`). En desarrollo local el backend corre en
   `http://localhost:3000`. La URL efectiva de cada endpoint es
   **`${VITE_API_URL}/api/v1/...`** (tu host + el prefijo fijo `/api/v1` que verás en
   cada slice). Si el dominio cambia, solo tocas tu env.
3. `GET ${VITE_API_URL}/health` → debe responder `200 { "status": "ok" }` (ojo: `/health`
   va sin el prefijo `/api/v1`).
4. Haz una request real **desde el origen del frontend** (no solo curl) para
   descartar **CORS**: si el navegador bloquea por CORS, repórtalo (el backend tiene
   un allowlist de orígenes — hay que agregar el dominio/origen real del frontend a la
   config del backend).
5. Verifica que las llamadas autenticadas funcionan (login → recibir
   `access_token` → mandar `Authorization: Bearer ...`).

> **Sobre las URLs absolutas que devuelve el backend** (`preview_url`, `thumbnail_url`,
> `signed_url`, links de email): las **genera el backend** según su propia config de
> deploy — no las construyes ni las hardcodeas tú. En los slices verás ejemplos con
> `http://localhost:3000/...`: son valores de **dev**; en producción vendrán con el
> host real que tenga configurado el backend. Úsalas tal cual te llegan.

**No avances a la Fase 1 hasta que health + CORS + una llamada autenticada de prueba
funcionen.** Si algo falla aquí, es config/infra: repórtalo a Omar.

## 2. Fase 1 — Leer y mapear el contrato

1. Empieza por [`./index.md`](./index.md): es el mapa de todos los slices de
   integración. Recórrelo.
2. Para el detalle de cada endpoint (request, response, errores), usa
   [`../endpoints.md`](../endpoints.md).
3. Convenciones del wire (léelas una vez): JSON en `snake_case`; paths en
   `kebab-case` plural; IDs UUID (string); dinero en **centavos enteros**; fechas
   **ISO-8601 UTC** (conviertes a `America/Guayaquil` en el cliente); JWT
   `Authorization: Bearer` + refresh token en cookie httpOnly.
4. Construye un **mapa**: por cada pantalla/feature del frontend, qué endpoints
   consume y qué slice de `frontend-integration/` lo cubre.

## 3. Fase 2 — Planificar (sin codear)

1. Analiza el **frontend existente** (componentes, servicios/API client, estado) y
   crúzalo con los módulos/endpoints del backend.
2. Divide el trabajo en **módulos ejecutables** y marca cuáles se pueden hacer **en
   paralelo** y cuáles dependen de otros. Sugerencia de orden por dependencias:
   - **Base**: cliente HTTP + manejo de `error.code` + auth (login/registro/refresh
     de sesión, adjuntar el Bearer).
   - **Catálogo público**: eventos + galería + face-search (selfie).
   - **Compra**: carrito → cupones → checkout/Payphone (redirect) → retorno →
     detalle de orden → descargas firmadas.
   - **Cuentas**: perfil, verificación de email, reset de contraseña.
   - **Paneles**: fotógrafo y admin (cada submódulo admin es paralelizable).
   - **Forms públicos**: contacto + "trabaja con nosotros" (**incluye el honeypot**,
     ver §5).
3. Presenta el plan (módulos, orden, qué va en paralelo) **antes** de implementar.

## 4. Fase 3 — Implementar módulo por módulo

Para CADA módulo del plan, en este orden:

1. **Explica primero** (para que Omar entienda y decida): "este endpoint te trae X,
   sirve para Y; el frontend hoy tiene/espera Z". Si hay un **desajuste** (el FE no
   tiene un campo, o el shape difiere, o falta un estado), **plantéalo**: "esto no
   calza con lo que hay en el front; las opciones son A o B, ¿cómo lo hacemos?" y
   espera la decisión.
2. **Implementa** ese módulo (y solo ese).
3. **Prueba**: corre el flujo real contra el backend (o un test). Confirma que pasa.
4. Recién entonces, **siguiente módulo**.

> Si un módulo es grande, pártelo en sub-pasos y prueba cada sub-paso.

## 5. Cosas que el frontend SÍ tiene que implementar (ojo)

- **Honeypot en los forms públicos**: ambos forms (`/contact-requests`,
  `/staff-applications`) aceptan un campo opcional `website`. **Debes renderizar un
  input oculto llamado `website`** (off-screen / `aria-hidden="true"` /
  `autocomplete="off"` / `tabindex="-1"`) y **dejarlo vacío**. Un usuario real nunca
  lo llena; si un bot lo llena, el backend descarta la submission en silencio. Ver
  [`./forms.md`](./forms.md).
- **Mapear `error.code` → copy en español** (no mostrar `message` crudo).
- **Idempotency-Key** (UUID) en `POST /checkout` y endpoints que inician
  transacción Payphone.
- **`payphone_reverse_status`** en el detalle de orden (admin): mostrar el estado del
  reembolso según la tabla de [`./admin-orders.md`](./admin-orders.md).
- **Formatear dinero** (centavos → `$x.xx`) y fechas (UTC → America/Guayaquil) en el
  cliente.

## 6. Reporte de problemas

Si encuentras algo que parece un **bug del backend** o un **hueco de contrato**
(falta un endpoint/campo, un shape no calza, un error no documentado): **no lo
arregles en el backend**. Anótalo así y pásaselo a Omar:

```
[BACKEND] <endpoint o módulo>
Esperaba: ...
Obtuve: ...
Impacto en el frontend: ...
Propuesta: ...
```

Omar lo escala al equipo de backend y se ajusta. Mientras tanto, sigue con los
módulos que no dependan de eso.

---

**Resumen:** Fase 0 (health + CORS) → Fase 1 (leer/mapear) → Fase 2 (plan, sin
codear) → Fase 3 (módulo → explicar → implementar → probar → siguiente). Por fases,
con preguntas, sin big-bang.
