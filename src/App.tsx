import { ScrollToTop } from './components/layout/ScrollToTop'
import { CookieBanner } from './components/layout/CookieBanner'
import { ToastViewport } from './components/ui/ToastViewport'
import { CartProvider } from './contexts/CartContext'
import { AdminProvider } from './contexts/AdminContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppRoutes } from './routes'

/**
 * Shell raíz: monta providers globales (toast + carrito + admin) y
 * delega el árbol de rutas a `routes/AppRoutes`. ThemeProvider y
 * AuthProvider envuelven a App desde main.tsx.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <ScrollToTop />
      <ToastProvider>
        <CartProvider>
          <AdminProvider>
            <AppRoutes />
            <CookieBanner />
            <ToastViewport />
          </AdminProvider>
        </CartProvider>
      </ToastProvider>
    </div>
  )
}
