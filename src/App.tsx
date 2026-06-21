import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { CookieBanner } from './components/layout/CookieBanner'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { EventsPage } from './pages/EventsPage'
import { EventGalleryPage } from './pages/EventGalleryPage'
import { ContactPage } from './pages/ContactPage'
import { WorkWithUsPage } from './pages/WorkWithUsPage'
import { MyPurchasesPage } from './pages/MyPurchasesPage'
import { PurchaseDetailPage } from './pages/PurchaseDetailPage'
import { AccountPage } from './pages/AccountPage'
import { LoginPage } from './pages/LoginPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CheckoutResultPage } from './pages/CheckoutResultPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { SetPasswordPage } from './pages/SetPasswordPage'
import { TermsPage } from './pages/legal/TermsPage'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { CookiesPage } from './pages/legal/CookiesPage'
import { BiometricPolicyPage } from './pages/legal/BiometricPolicyPage'
import { RequireAuth } from './components/auth/RequireAuth'
import { CartProvider } from './contexts/CartContext'
import { AdminProvider } from './contexts/AdminContext'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminEventCreatePage } from './pages/admin/AdminEventCreatePage'
import { AdminEventDetailPage } from './pages/admin/AdminEventDetailPage'
import { AdminPhotosPage } from './pages/admin/AdminPhotosPage'
import { AdminPhotographersPage } from './pages/admin/AdminPhotographersPage'
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage'
import { AdminSalesPage } from './pages/admin/AdminSalesPage'
import { AdminMetricsPage } from './pages/admin/AdminMetricsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { PhotographerProvider } from './contexts/PhotographerContext'
import { PhotographerLayout } from './components/photographer/PhotographerLayout'
import { PhotographerDashboardPage } from './pages/photographer/PhotographerDashboardPage'
import { PhotographerPhotosPage } from './pages/photographer/PhotographerPhotosPage'
import { PhotographerEarningsPage } from './pages/photographer/PhotographerEarningsPage'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
     <ScrollToTop />
     <CartProvider>
      <AdminProvider>
        <Routes>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verificar-email" element={<VerifyEmailPage />} />
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
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route
            path="/carrito"
            element={
              <PublicLayout>
                <CartPage />
              </PublicLayout>
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
        <CookieBanner />
      </AdminProvider>
     </CartProvider>
    </div>
  )
}
