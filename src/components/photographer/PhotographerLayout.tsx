import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { usePhotographer } from '../../hooks/usePhotographer'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/fotografo', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/fotografo/fotos', label: 'Mis Fotos', icon: 'photo_library' },
  { to: '/fotografo/ganancias', label: 'Ganancias', icon: 'payments' },
]

export function PhotographerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { photographerName } = usePhotographer()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-surface border-r border-surface-variant fixed h-full z-30">
        <div className="p-6 border-b border-surface-variant">
          <button type="button" onClick={() => navigate('/fotografo')} className="flex items-center">
            <Logo className="h-7" />
          </button>
          <p className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mt-2">
            Panel de Fotógrafo
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`
              }
            >
              <Icon name={item.icon} className="text-xl" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-variant">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low">
            <div className="w-10 h-10 bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold uppercase">
              {photographerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-label-bold text-label-bold text-on-surface truncate">
                {photographerName}
              </div>
              <div className="font-caption text-caption text-on-surface-variant truncate">
                Fotógrafo
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <ThemeToggle className="flex-1 justify-center" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-surface-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors font-label-bold text-label-bold uppercase"
            >
              <Icon name="logout" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-surface-variant z-40 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate('/fotografo')} className="flex items-center">
          <Logo className="h-7" />
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-on-surface p-2"
            aria-label="Abrir menú"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background z-30 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`
                }
              >
                <Icon name={item.icon} className="text-xl" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 border border-surface-variant text-on-surface-variant font-label-bold text-label-bold uppercase"
          >
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
