import { Routes, Route } from 'react-router-dom'

import { RequireAuth } from '../components/auth/RequireAuth'
import { AdminLayout } from '../components/admin/AdminLayout'
import { PhotographerLayout } from '../components/photographer/PhotographerLayout'
import { PhotographerProvider } from '../contexts/PhotographerContext'

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

import { TermsPage } from '../pages/legal/TermsPage'
import { PrivacyPage } from '../pages/legal/PrivacyPage'
import { CookiesPage } from '../pages/legal/CookiesPage'
import { BiometricPolicyPage } from '../pages/legal/BiometricPolicyPage'

import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminEventsPage } from '../pages/admin/AdminEventsPage'
import { AdminEventCreatePage } from '../pages/admin/AdminEventCreatePage'
import { AdminEventDetailPage } from '../pages/admin/AdminEventDetailPage'
import { AdminPhotosPage } from '../pages/admin/AdminPhotosPage'
import { AdminPhotographersPage } from '../pages/admin/AdminPhotographersPage'
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage'
import { AdminSalesPage } from '../pages/admin/AdminSalesPage'
import { AdminMetricsPage } from '../pages/admin/AdminMetricsPage'
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage'

import { PhotographerDashboardPage } from '../pages/photographer/PhotographerDashboardPage'
import { PhotographerPhotosPage } from '../pages/photographer/PhotographerPhotosPage'
import { PhotographerEarningsPage } from '../pages/photographer/PhotographerEarningsPage'

import { PublicLayout } from './PublicLayout'

/**
 * Árbol completo de rutas de la app. Se monta dentro de los providers
 * globales en App.tsx; aquí solo importan páginas y wrappers.
 */
export function AppRoutes() {
  return (
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

      {/* Legales */}
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

      {/* Panel admin */}
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

      {/* Panel fotógrafo */}
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
  )
}
