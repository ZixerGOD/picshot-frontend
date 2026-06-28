# Admin — Photos

Slice del panel admin para **moderar fotos**: listarlas (con filtros) y
eliminarlas. **Solo el admin puede borrar fotos** — el fotógrafo, una vez sube,
no puede borrar ni modificar.

Todo aquí requiere sesión con **rol `admin`**.

Base path asumido: `/api/v1`

## Qué existe hoy

- `GET /admin/photos`
- `DELETE /admin/photos/{photo_id}`

(No hay subir fotos desde admin — eso es del fotógrafo. No hay PATCH de
precio/hide manual, ni acciones masivas: fuera de alcance.)

## Regla de integración

- el admin ve **todas** las fotos, en cualquier estado (`processing`,
  `published`, `hidden`, `failed`)
- el DELETE es **condicional** según si la foto tiene ventas/órdenes (ver abajo);
  siempre responde `204`
- dinero en centavos; fechas ISO-8601

---

## 1) `GET /admin/photos`

### Query (opcional)

- `event_id` (uuid), `photographer_id` (uuid)
- `status` = `processing | published | hidden | failed`
- `q` (busca por dorsal `bib`)
- `cursor`, `limit` (default 30, máx 100)

### Response `200`

```json
{
  "items": [
    {
      "id": "uuid", "event_id": "uuid", "event_title": "Maratón de Guayaquil",
      "photographer_id": "uuid", "photographer_name": "Foto Grafo",
      "preview_url": "http://localhost:3000/storage/.../preview.jpg",
      "thumbnail_url": "http://localhost:3000/storage/.../thumb.jpg",
      "price_cents": 500, "status": "published", "bib": "1234",
      "width": 6000, "height": 4000, "file_size_bytes": 5242880,
      "taken_at": null, "uploaded_at": "2026-06-22T12:00:00.000Z",
      "sales_count": 7
    }
  ],
  "next_cursor": null
}
```

- `sales_count` = ventas confirmadas de esa foto
- paginar con `next_cursor`

---

## 2) `DELETE /admin/photos/{photo_id}`

### Response `204`

El comportamiento depende de si la foto tiene órdenes asociadas:

- **Tiene órdenes** (vendida o en proceso) → la foto pasa a `status="hidden"`:
  desaparece del catálogo público y de las búsquedas, **pero el archivo se
  conserva** y los compradores **mantienen su descarga** (siguen viéndola en
  `/me/purchases` y pueden pedir su signed URL).
- **No tiene órdenes** → **borrado real**: se elimina la foto y sus 3 archivos del
  disco, y en cascada sus caras/embeddings, resultados de búsqueda y items de
  carrito.

En ambos casos la respuesta es `204`. `404 NOT_FOUND` si la foto no existe.

Nota: "tiene órdenes" cuenta cualquier orden (incluidas en proceso/abandonadas),
no solo ventas confirmadas. Por eso una foto puede quedar `hidden` aunque su
`sales_count` sea `0` (alguien la tuvo en un checkout). El FE no debe asumir que
`sales_count === 0` garantiza borrado físico.

---

## Adaptación recomendada al frontend

Crear un `lib/api/admin/photos.ts` real que:

- haga `GET /admin/photos` (con filtros + cursor)
- haga `DELETE /admin/photos/:id`
- quite el botón "Simular subida" (subir es del fotógrafo, no del admin)
- use USD/centavos (no €) y `snake_case`

---

## Qué pantallas debe tener el frontend

### `AdminPhotosPage` (`/admin/fotos`)

- tabla con `GET /admin/photos` (preview, evento, fotógrafo, precio, estado,
  ventas, dimensiones/peso)
- filtros: evento, fotógrafo, estado, dorsal (`q`)
- acción eliminar (con confirmación), entendiendo que una foto vendida no se borra
  sino que se oculta

---

## Qué NO debe hacer Omar / el LLM del frontend

- no ofrecer "subir foto" desde el admin (es del fotógrafo)
- no asumir que DELETE siempre borra: una foto con ventas queda `hidden` y el
  comprador la conserva
- no esperar hide/unhide manual, edición de precio, ni acciones masivas (no
  existen)
- no asumir `camelCase` ni moneda con símbolo: `snake_case`, USD en centavos

---

## Modelo mental correcto

- el admin modera; el fotógrafo nunca borra/modifica sus fotos
- borrar una foto vendida la oculta (protege la compra y la atribución); borrar una
  no vendida la elimina de verdad y libera storage + biometría
- el backend decide hide-vs-borrado según las órdenes; el FE solo dispara el DELETE

## Estado de verificación

Verificado con:

- typecheck limpio del API
- tests de service y rutas (incl. hide-si-vendida, hard-delete-si-no, aislamiento)
- **E2E real contra DB**: list con filtros y agregados; **hard delete** de una foto
  sin órdenes (fila eliminada, cascade); **hide** de una foto vendida (queda
  `hidden`, el comprador la sigue viendo en `/me/purchases` y obtiene su download
  URL); aislamiento (customer → 403, sin auth → 401)
