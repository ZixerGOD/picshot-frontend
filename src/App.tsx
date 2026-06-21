import { ScrollToTop } from './components/layout/ScrollToTop'
import { CookieBanner } from './components/layout/CookieBanner'
import { CartProvider } from './contexts/CartContext'
import { AdminProvider } from './contexts/AdminContext'
import { AppRoutes } from './routes'

/**
 * Shell raíz: monta providers globales (carrito + admin) y delega el
 * árbol de rutas a `routes/AppRoutes`. ThemeProvider y AuthProvider
 * envuelven a App desde main.tsx.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <ScrollToTop />
      <CartProvider>
        <AdminProvider>
          <AppRoutes />
          <CookieBanner />
        </AdminProvider>
      </CartProvider>
    </div>
  )
}
