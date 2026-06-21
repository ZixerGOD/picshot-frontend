# SHOTS — Frontend

Frontend navegable de la plataforma de fotografía deportiva **SHOTS**. Construido con React, TypeScript, Vite y Tailwind CSS.

## Stack

- **React 19** + **TypeScript**
- **Vite**
- **React Router**
- **Tailwind CSS 3**
- **Material Symbols** (iconografía de Google Fonts)
- **Fetch API** para llamadas REST

## Requisitos

- Node.js >= 18
- npm o yarn

## Instalación

```bash
cd frontend
npm install
```

## Scripts

```bash
# Levantar entorno de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build local
npm run preview
```

## Estructura

```txt
src/
  components/
    layout/        # Navbar, Footer
    ui/            # Botones, inputs, badges, iconos
    events/        # EventCard, PhotoCard
  pages/           # Home, Catálogo, Galería, Contacto, Trabaja con nosotros
  lib/
    api.ts         # Capa de llamadas al backend (con mocks integrados)
    mocks.ts       # Datos temporales para probar la UI
    types.ts       # Tipos compartidos
    images.ts      # Helper de imágenes placeholder
  styles/
    global.css     # Tokens y clases utilitarias globales
```

## Modo mock

Si la variable `VITE_API_URL` no está definida, el frontend funciona con datos locales. Esto permite navegar todas las pantallas mientras el backend sigue en desarrollo.

```bash
# Modo mock (sin backend)
npm run dev
```

## Conectar con el backend

1. Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Edita `VITE_API_URL` con la URL de tu API REST:

```env
VITE_API_URL=http://localhost:3000/api
```

3. Asegúrate de que el backend exponga los endpoints documentados en `BACKEND_INTEGRATION.md`.

4. Reinicia el servidor de desarrollo.

## Notas

- Las imágenes actuales son placeholders de `picsum.photos`. Reemplázalas por el CDN o bucket real cuando el backend esté listo.
- Los formularios de contacto y staff tienen feedback visual inmediato; en modo mock simulan un envío con delay.
- La búsqueda por selfie usa un `input type="file"` y simula el escaneo visual; luego conecta con el endpoint de reconocimiento facial.
