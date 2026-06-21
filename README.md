# Picshot — Frontend

Frontend navegable de la plataforma de fotografía deportiva **Picshot**. Construido con React, TypeScript, Vite y Tailwind CSS.

## Stack

- **React 19** + **TypeScript**
- **Vite**
- **React Router**
- **Tailwind CSS 3**
- **Material Symbols** (iconografía local)
- **Fetch API** para llamadas REST

## Requisitos

- **Node.js >= 20**
- **pnpm 11** (gestor de paquetes oficial del proyecto)

> Este proyecto usa **pnpm** como gestor único. No mezcles con `npm` ni `yarn`: el `engine-strict` del `.npmrc` y el campo `packageManager` de `package.json` bloquean otros gestores.

### Instalar pnpm

Si no tienes pnpm, actívalo con corepack (incluido en Node 20):

```bash
corepack enable
corepack prepare pnpm@11 --activate
```

O instálalo de forma global:

```bash
npm install -g pnpm@11
```

## Instalación

```bash
pnpm install
```

## Scripts

```bash
# Levantar entorno de desarrollo
pnpm dev

# Build de producción
pnpm build

# Previsualizar build local
pnpm preview

# Linter
pnpm lint
```

## Estructura

```txt
src/
  components/
    layout/        # Navbar, Footer, CookieBanner, UserMenu
    ui/            # Botones, inputs, badges, iconos
    events/        # EventCard, PhotoCard, SelfieSearchModal, CartToast
    auth/          # RequireAuth, AuthLayout
    admin/         # AdminLayout, AdminTable, PackEditor, QrPosterModal
    photographer/  # PhotographerLayout, StatsCard
  pages/           # públicas, auth, admin/*, photographer/*, legal/*
  contexts/        # AuthProvider, CartProvider, AdminContext, PhotographerContext, ThemeProvider
  hooks/           # useAuth, useCart, useAdmin, usePhotographer, useTheme
  lib/
    api.ts         # Capa de llamadas al backend (con mocks integrados)
    mocks.ts       # Datos temporales para probar la UI
    types.ts       # Tipos compartidos
    checkout.ts    # Estado de órdenes y simulación Payphone
    packs.ts       # Catálogo y resolución de paquetes
    downloads.ts   # Helpers de signed URLs y retención
    auth-tokens.ts # Tokens de verificación/reset en memoria
    format.ts      # Formato de precio y fechas (locale es-EC)
    images.ts      # Helper de imágenes placeholder
  index.css        # Tokens, layers y clases utilitarias globales
```

## Modo mock

Si la variable `VITE_API_URL` no está definida, el frontend funciona con datos locales. Esto permite navegar todas las pantallas mientras el backend sigue en desarrollo.

```bash
# Modo mock (sin backend)
pnpm dev
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
- La búsqueda por selfie captura desde la cámara (`getUserMedia`) con fallback a subir un archivo; luego conecta con el endpoint de reconocimiento facial.
