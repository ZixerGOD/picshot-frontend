# Estructura `src/`

Mapa rápido de cómo está organizado el código y dónde poner cada cosa nueva.

```
src/
├── App.tsx              # Shell: monta providers globales y delega a AppRoutes
├── main.tsx             # Entry: BrowserRouter, ThemeProvider, AuthProvider, <App />
├── index.css            # Tokens, layers Tailwind, utilidades shots-*
│
├── routes/              # Árbol de rutas separado de App.tsx
│   ├── AppRoutes.tsx    # Routes/Route con lazy load para admin/photog/legal
│   ├── PublicLayout.tsx # Wrapper Navbar + children
│   └── index.ts         # Barrel
│
├── pages/               # Páginas (1 archivo por ruta), agrupadas por área
│   ├── public/          # Home, Eventos, Galería, Contacto, Trabaja con nosotros
│   ├── auth/            # Login, Registro, Forgot/Reset, Verify, SetPassword, Unsubscribe
│   ├── account/         # Mi Cuenta, Mis Compras, Detalle de Compra
│   ├── shop/            # Carrito, Checkout, CheckoutResult
│   ├── admin/           # Dashboard, Eventos, Fotos, Fotógrafos, Cupones, Ventas, Órdenes, Métricas
│   ├── photographer/    # Dashboard, Mis Fotos, Ganancias
│   └── legal/           # Términos, Privacidad, Cookies, Política biométrica + LegalLayout
│
├── components/          # Componentes reusables, por dominio
│   ├── ui/              # Primitivos: Button, Input, Select, Icon, Logo, ThemeToggle
│   ├── layout/          # Navbar, Footer, CookieBanner, ScrollToTop, UserMenu
│   ├── auth/            # AuthLayout, RequireAuth
│   ├── events/          # EventCard, PhotoCard, SelfieSearchModal, CartToast,
│   │                    # BiometricConsentModal, EventAIDisclaimerModal
│   ├── admin/           # AdminLayout, AdminTable, StatsCard, SimpleBarChart,
│   │                    # PackEditor, QrPosterModal
│   └── photographer/    # PhotographerLayout
│
├── contexts/            # Providers React (lógica/estado de dominio)
│   ├── AuthProvider.tsx
│   ├── CartContext.tsx
│   ├── AdminContext.tsx
│   ├── PhotographerContext.tsx
│   └── ThemeProvider.tsx
│
├── hooks/               # Hooks de consumo (1 por contexto)
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useAdmin.ts
│   ├── usePhotographer.ts
│   └── useTheme.ts
│
└── lib/                 # Lógica de dominio sin React
    ├── api/             # Cliente HTTP + módulos por recurso
    │   ├── client.ts    # fetch base, token (set/get/expira), USE_MOCKS
    │   ├── auth.ts      # login, register, forgot/reset, verify
    │   ├── events.ts    # getEvents, getEventById, getEventPhotos
    │   ├── face.ts      # searchPhotosByFace + FaceSearchError
    │   ├── purchases.ts # getMyPurchases
    │   ├── contact.ts   # submitContactRequest, submitStaffApplication
    │   └── index.ts     # Barrel — los consumidores importan desde 'lib/api'
    │
    ├── types/           # Tipos del dominio
    │   ├── events.ts    # EventItem, EventStatus
    │   ├── packs.ts     # PackKey, PhotoPack
    │   ├── photos.ts    # Photo, Purchase, PhotoStatus, etc.
    │   ├── cart.ts      # CartItem, CartPack, CartCoupon, CartTotals
    │   ├── orders.ts    # Order, OrderStatus, PayphoneTransaction
    │   ├── auth.ts      # AuthUser, AuthSession, PASSWORD_POLICY
    │   ├── people.ts    # AdminUser, Photographer, BankInfo
    │   ├── commerce.ts  # Coupon, Sale, PAYPHONE_FEE_RATIO
    │   ├── analytics.ts # AnalyticsData, DashboardStats
    │   ├── forms.ts     # ContactRequest, StaffApplication
    │   └── index.ts     # Barrel
    │
    ├── mocks/           # Datos de prueba; cada archivo por dominio
    │   ├── admin-user.ts
    │   ├── events.ts
    │   ├── photographers.ts
    │   ├── coupons.ts
    │   ├── photos.ts
    │   ├── sales.ts
    │   ├── auth.ts
    │   ├── purchases.ts
    │   ├── analytics.ts
    │   ├── stats.ts
    │   ├── utils.ts
    │   └── index.ts     # Barrel
    │
    ├── checkout.ts      # Estado de órdenes en localStorage + simulatePayphone
    ├── packs.ts         # Catálogo + resolución de packs vs carrito
    ├── downloads.ts     # generateSignedDownload, retentionDateFrom, daysUntil
    ├── auth-tokens.ts   # Tokens en memoria (verify, reset, invite)
    ├── format.ts        # formatPrice, formatDate, formatDateTime
    └── images.ts        # img(slug, w, h) helper para mocks
```

## Dónde poner cosas nuevas

| Cuando agregues… | Va en… |
| --- | --- |
| Una nueva ruta pública | `pages/public/` + `routes/AppRoutes.tsx` |
| Una nueva ruta admin | `pages/admin/` + nested `<Route>` en AppRoutes (sigue siendo lazy) |
| Un endpoint REST nuevo | módulo correspondiente en `lib/api/` o uno nuevo + re-export en `lib/api/index.ts` |
| Un tipo de dominio | archivo correspondiente en `lib/types/` |
| Datos de prueba para QA | archivo correspondiente en `lib/mocks/` |
| Componente compartido cross-área | `components/ui/` (primitivo) o nueva carpeta de dominio |
| Lógica de negocio sin React | `lib/` (archivo nuevo si es un dominio propio) |

## Convenciones

- **Imports relativos**: las páginas viven en `pages/<area>/`, así que importan con `../../components/...`, `../../lib/...`, etc.
- **Barrels (`index.ts`)**: solo en `lib/api`, `lib/types`, `lib/mocks` y `routes`. No agregamos barrels en `components/` ni `pages/`: el costo de mantener el index supera el beneficio cuando hay decenas de archivos.
- **Lazy loading**: rutas de paneles internos (admin, fotógrafo) y páginas legales se cargan bajo demanda desde `routes/AppRoutes.tsx` con `React.lazy + Suspense`. Las páginas públicas y de auth viajan en el bundle inicial.
- **Mocks vs API**: `lib/api/*` decide en cada función si usa la rama mock (`USE_MOCKS`) o llama al backend. Los consumidores nunca tocan `lib/mocks` directo; lo hacen vía el módulo de API correspondiente.
