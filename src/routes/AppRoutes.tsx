import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import { RequireAuth } from '../components/auth/RequireAuth'

import { HomePage } from '../pages/public/HomePage'
import { EventsPage } from '../pages/public/EventsPage'
import { EventGalleryPage } from '../pages/public/EventGalleryPage'
import { ContactPage } from '../pages/public/ContactPage'
import { WorkWithUsPage } from '../pages/public/WorkWithUsPage'

import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage'
import { SetPasswordPage } from '../pages/auth/SetPasswordPage'
import { UnsubscribePage } from '../pages/auth/UnsubscribePage'

import { AccountPage } from '../pages/account/AccountPage'
import { MyPurchasesPage } from '../pages/account/MyPurchasesPage'
import { PurchaseDetailPage } from '../pages/account/PurchaseDetailPage'

import { CartPage } from '../pages/shop/CartPage'
import { CheckoutPage } from '../pages/shop/CheckoutPage'
import { CheckoutResultPage } from '../pages/shop/CheckoutResultPage'

import { PublicLayout } from './PublicLayout'

// ===== Carga diferida =====
// Estas rutas las visita una minoría de usuarios; al separarlas el bundle
// inicial baja y los assets se descargan recién cuando se necesitan.

const TermsPage = lazy(() =>
  import('../pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })),
)
const PrivacyPage = lazy(() =>
  import('../pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const CookiesPage = lazy(() =>
  import('../pages/legal/CookiesPage').then((m) => ({ default: m.CookiesPage })),
)
const BiometricPolicyPage = lazy(() =>
  import('../pages/legal/BiometricPolicyPage').then((m) => ({
    default: m.BiometricPolicyPage,
  })),
)

const AdminLayout = lazy(() =>
  import('../components/admin/AdminLayout').then((m) => ({
    default: m.AdminLayout,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminEventsPage = lazy(() =>
  import('../pages/admin/AdminEventsPage').then((m) => ({
    default: m.AdminEventsPage,
  })),
)
const AdminEventCreatePage = lazy(() =>
  import('../pages/admin/AdminEventCreatePage').then((m) => ({
    default: m.AdminEventCreatePage,
  })),
)
const AdminEventDetailPage = lazy(() =>
  import('../pages/admin/AdminEventDetailPage').then((m) => ({
    default: m.AdminEventDetailPage,
  })),
)
const AdminPhotosPage = lazy(() =>
  import('../pages/admin/AdminPhotosPage').then((m) => ({
    default: m.AdminPhotosPage,
  })),
)
const AdminPhotographersPage = lazy(() =>
  import('../pages/admin/AdminPhotographersPage').then((m) => ({
    default: m.AdminPhotographersPage,
  })),
)
const AdminCouponsPage = lazy(() =>
  import('../pages/admin/AdminCouponsPage').then((m) => ({
    default: m.AdminCouponsPage,
  })),
)
const AdminSalesPage = lazy(() =>
  import('../pages/admin/AdminSalesPage').then((m) => ({
    default: m.AdminSalesPage,
  })),
)
const AdminMetricsPage = lazy(() =>
  import('../pages/admin/AdminMetricsPage').then((m) => ({
    default: m.AdminMetricsPage,
  })),
)
const AdminOrdersPage = lazy(() =>
  import('../pages/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
)

const PhotographerLayout = lazy(() =>
  import('../components/photographer/PhotographerLayout').then((m) => ({
    default: m.PhotographerLayout,
  })),
)
const PhotographerProvider = lazy(() =>
  import('../contexts/PhotographerContext').then((m) => ({
    default: m.PhotographerProvider,
  })),
)
const PhotographerDashboardPage = lazy(() =>
  import('../pages/photographer/PhotographerDashboardPage').then((m) => ({
    default: m.PhotographerDashboardPage,
  })),
)
const PhotographerPhotosPage = lazy(() =>
  import('../pages/photographer/PhotographerPhotosPage').then((m) => ({
    default: m.PhotographerPhotosPage,
  })),
)
const PhotographerEarningsPage = lazy(() =>
  import('../pages/photographer/PhotographerEarningsPage').then((m) => ({
    default: m.PhotographerEarningsPage,
  })),
)

function RouteSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
      <div className="border-2 border-primary/40 border-t-primary rounded-full w-10 h-10 animate-spin" />
    </div>
  )
}

/**
 * Árbol completo de rutas de la app. Las rutas legales, admin y
 * fotógrafo se cargan bajo demanda con React.lazy para no engordar el
 * bundle inicial del usuario público.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteSpinner />}>
      <Routes>
        {/* Públicas */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/eventos"
          element={
            <PublicLayout>
              <EventsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/eventos/:eventId"
          element={
            <PublicLayout>
              <EventGalleryPage />
            </PublicLayout>
          }
        />
        <Route
          path="/contacto"
          element={
            <PublicLayout>
              <ContactPage />
            </PublicLayout>
          }
        />
        <Route
          path="/trabaja-con-nosotros"
          element={
            <PublicLayout>
              <WorkWithUsPage />
            </PublicLayout>
          }
        />

        {/* Auth (sin Navbar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/cancelar-suscripcion" element={<UnsubscribePage />} />

        {/* Legales (lazy) */}
        <Route
          path="/terminos"
          element={
            <PublicLayout>
              <TermsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/privacidad"
          element={
            <PublicLayout>
              <PrivacyPage />
            </PublicLayout>
          }
        />
        <Route
          path="/cookies"
          element={
            <PublicLayout>
              <CookiesPage />
            </PublicLayout>
          }
        />
        <Route
          path="/politica-biometrica"
          element={
            <PublicLayout>
              <BiometricPolicyPage />
            </PublicLayout>
          }
        />

        {/* Compra (requiere auth + email verificado para carrito y checkout) */}
        <Route
          path="/carrito"
          element={
            <RequireAuth requireVerifiedEmail>
              <PublicLayout>
                <CartPage />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth requireVerifiedEmail>
              <PublicLayout>
                <CheckoutPage />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <RequireAuth>
              <PublicLayout>
                <CheckoutResultPage variant="success" />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/checkout/error"
          element={
            <RequireAuth>
              <PublicLayout>
                <CheckoutResultPage variant="error" />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/checkout/pending"
          element={
            <RequireAuth>
              <PublicLayout>
                <CheckoutResultPage variant="pending" />
              </PublicLayout>
            </RequireAuth>
          }
        />

        {/* Cuenta del usuario */}
        <Route
          path="/mi-cuenta"
          element={
            <RequireAuth>
              <PublicLayout>
                <AccountPage />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/mis-compras"
          element={
            <RequireAuth>
              <PublicLayout>
                <MyPurchasesPage />
              </PublicLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/mis-compras/:orderId"
          element={
            <RequireAuth>
              <PublicLayout>
                <PurchaseDetailPage />
              </PublicLayout>
            </RequireAuth>
          }
        />

        {/* Panel admin (lazy) */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="eventos" element={<AdminEventsPage />} />
          <Route path="eventos/nuevo" element={<AdminEventCreatePage />} />
          <Route path="eventos/:eventId" element={<AdminEventDetailPage />} />
          <Route path="fotos" element={<AdminPhotosPage />} />
          <Route path="fotografos" element={<AdminPhotographersPage />} />
          <Route path="cupones" element={<AdminCouponsPage />} />
          <Route path="ordenes" element={<AdminOrdersPage />} />
          <Route path="ventas" element={<AdminSalesPage />} />
          <Route path="metricas" element={<AdminMetricsPage />} />
        </Route>

        {/* Panel fotógrafo (lazy) */}
        <Route
          path="/fotografo"
          element={
            <RequireAuth role="photographer">
              <PhotographerProvider>
                <PhotographerLayout />
              </PhotographerProvider>
            </RequireAuth>
          }
        >
          <Route index element={<PhotographerDashboardPage />} />
          <Route path="fotos" element={<PhotographerPhotosPage />} />
          <Route path="ganancias" element={<PhotographerEarningsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
