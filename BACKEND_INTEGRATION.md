# Guía de Integración — Backend SHOTS

Este documento es el contrato que debe seguir el backend para conectarse con el frontend. Si el backend responde estos endpoints, solo hay que configurar `VITE_API_URL` en el frontend y todo fluye.

## Configuración mínima en el frontend

```env
VITE_API_URL=http://localhost:3000/api
```

Si `VITE_API_URL` está vacío, el frontend usa mocks y sigue navegable.

## Formato general

- Base URL: el valor de `VITE_API_URL`
- Todos los intercambios son **JSON**, salvo `/events/:id/face-search` que usa `multipart/form-data`.
- Se esperan respuestas con `Content-Type: application/json` y códigos HTTP estándar.

---

## Autenticación

El frontend guarda el token devuelto por el login y lo envía en cada petición como
`Authorization: Bearer <token>`. Las rutas privadas del frontend (`/admin`, `/fotografo`,
`/mis-compras`) se protegen en cliente según el `role` del usuario.

### 0. Login

```http
POST /auth/login
Content-Type: application/json
```

**Body:**

```json
{ "email": "admin@picshot.com", "password": "••••••" }
```

**Respuesta esperada:**

```json
{
  "token": "jwt-o-token-de-sesion",
  "user": {
    "id": "admin-1",
    "name": "Admin Picshot",
    "email": "admin@picshot.com",
    "role": "admin",
    "photographerId": "ph-1"
  }
}
```

- `role` ∈ `"admin" | "photographer" | "customer"`.
- `photographerId` solo se incluye cuando `role === "photographer"` (vincula la sesión con su panel).
- En modo mock las credenciales válidas son: `admin@picshot.com / admin123`,
  `fotografo@picshot.com / foto123`, `comprador@email.com / demo123`.

## Endpoints

### 1. Listar eventos

```http
GET /events
```

**Respuesta esperada:**

```json
[
  {
    "id": "maraton-madrid-2024",
    "title": "Maratón de Madrid 2024",
    "date": "2024-11-12",
    "displayDate": "12 Nov 2024",
    "location": "Madrid",
    "type": "Maratón",
    "image": "https://cdn.shots.com/events/madrid.jpg",
    "photoCount": 14500,
    "runnerCount": 42000,
    "isNew": true,
    "basePrice": 24.99,
    "packs": [
      { "key": "single", "quantity": 1, "price": 24.99 },
      { "key": "pack3", "quantity": 3, "price": 67.47 },
      { "key": "pack5", "quantity": 5, "price": 106.21 },
      { "key": "pack10", "quantity": 10, "price": 199.92 },
      { "key": "all", "quantity": null, "price": 374.85 }
    ]
  }
]
```

> `packs` son los packs de venta que el admin configura por evento. `key` ∈
> `"single" | "pack3" | "pack5" | "pack10" | "all"`; `quantity` es el nº de fotos
> (`null` = todas); `price` es el precio del pack. `basePrice` (precio por foto) se
> deriva del pack `single`.

### 2. Detalle de un evento

```http
GET /events/:id
```

**Respuesta esperada:** mismo objeto que un evento de la lista.

### 3. Fotos de un evento

```http
GET /events/:id/photos
GET /events/:id/photos?bib=4509
GET /events/:id/photos?filter=face
GET /events/:id/photos?filter=favorites
```

**Respuesta esperada:**

```json
[
  {
    "id": "p1",
    "eventId": "maraton-madrid-2024",
    "url": "https://cdn.shots.com/photos/p1.jpg",
    "price": 24.99,
    "bib": "4509",
    "resolution": "Alta Resolución",
    "exclusive": false,
    "featured": true
  }
]
```

### 4. Búsqueda por reconocimiento facial

```http
POST /events/:id/face-search
Content-Type: multipart/form-data

selfie: <archivo de imagen>
```

**Respuesta esperada:** mismo formato que `/events/:id/photos`.

### 5. Compras del usuario

```http
GET /me/purchases
```

Devuelve las fotos compradas por el usuario autenticado. El backend identifica al comprador por su sesión/token (el frontend no envía el email). El frontend agrupa el resultado por `eventId` para mostrar la vista **Mis Compras**.

**Respuesta esperada:**

```json
[
  {
    "id": "pur-1",
    "orderId": "ORD-2024-0312",
    "eventId": "maraton-madrid-2024",
    "photoId": "p1",
    "url": "https://cdn.shots.com/photos/p1-full.jpg",
    "price": 24.99,
    "resolution": "Alta Resolución",
    "bib": "4509",
    "purchasedAt": "2024-11-14T18:32:00Z"
  }
]
```

> `url` debe apuntar a la imagen final comprada (sin marca de agua), apta para descarga.

### 6. Solicitud de cobertura fotográfica

```http
POST /contact-requests
Content-Type: application/json
```

**Body:**

```json
{
  "fullName": "Juan Pérez",
  "eventName": "Maratón Ciudad 2024",
  "email": "juan@ejemplo.com",
  "phone": "+34 600 000 000",
  "eventType": "running",
  "date": "2024-12-01",
  "message": "Necesitamos cobertura completa del evento."
}
```

**Respuesta esperada:**

```json
{ "id": "contact-123" }
```

### 7. Postulación de fotógrafo/staff

```http
POST /staff-applications
Content-Type: application/json
```

**Body:**

```json
{
  "fullName": "Ana Gómez",
  "email": "ana@tuweb.com",
  "city": "Madrid",
  "portfolioUrl": "https://ana.portfolio.com",
  "social": "@anagomez",
  "gear": "Sony A9 II, 400mm f2.8",
  "experience": "Cobertura de maratones desde 2019."
}
```

**Respuesta esperada:**

```json
{ "id": "staff-456" }
```

---

## Recomendaciones para el backend TypeScript

- Separa el servicio de Python como un microservicio interno. El backend TypeScript debe ser la **puerta de entrada** del frontend.
- Maneja CORS si el frontend corre en otro puerto:

```ts
// Ejemplo con Fastify/Express
res.header('Access-Control-Allow-Origin', '*')
res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
res.header('Access-Control-Allow-Headers', 'Content-Type')
```

- Valida los payloads antes de guardar o llamar al servicio Python.
- Para imágenes, devuelve URLs públicas (CDN, S3, CloudFront, etc.). El frontend no debe recibir binarios pesados directamente.

## Flujo sugerido

```txt
Frontend React  -->  Backend TypeScript  -->  Servicio Python (IA facial)
                         |
                         v
                  Base de datos / Storage
```

Con esto el frontend queda limpio, seguro y fácil de mantener.
