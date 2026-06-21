import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { UserMenu } from './UserMenu'

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/eventos', label: 'Catálogo' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/trabaja-con-nosotros', label: 'Trabaja con nosotros' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { count: cartCount } = useCart()

  function closeMobile() {
    setOpen(false)
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface border-b border-primary-container">
      <div className="shots-container flex justify-between items-center h-20 gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <Logo className="h-7 md:h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-6 h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `font-label-bold text-label-bold h-full flex items-center px-1 transition-colors duration-200 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/carrito"
            aria-label="Ver carrito"
            className="relative p-2 text-on-surface hover:text-primary transition-colors"
          >
            <Icon name="shopping_cart" className="text-2xl" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-on-primary font-label-bold text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          <ThemeToggle className="hidden md:flex" />

          <div className="hidden md:flex">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link to="/login" className="shots-btn-primary">
                <Icon name="login" className="text-xl" />
                Ingresar
              </Link>
            )}
          </div>

          <button
            type="button"
            className="md:hidden text-on-surface p-2"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Icon name={open ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-surface border-t border-surface-variant">
          <div className="shots-container flex flex-col py-4 gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `font-label-bold text-label-bold py-3 px-2 ${
                    isActive ? 'text-primary' : 'text-on-surface'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="border-t border-surface-variant my-2" />

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/mi-cuenta"
                  onClick={closeMobile}
                  className="flex items-center gap-3 py-3 px-2 font-label-bold text-label-bold text-on-surface"
                >
                  <Icon name="person" />
                  Mi cuenta
                </NavLink>
                <NavLink
                  to="/mis-compras"
                  onClick={closeMobile}
                  className="flex items-center gap-3 py-3 px-2 font-label-bold text-label-bold text-on-surface"
                >
                  <Icon name="receipt_long" />
                  Mis compras
                </NavLink>
                <MobileLogout onDone={closeMobile} />
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMobile}
                className="shots-btn-primary justify-center mt-2"
              >
                <Icon name="login" />
                Ingresar
              </Link>
            )}

            <div className="flex items-center justify-between mt-3 px-2">
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                Tema
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileLogout({ onDone }: { onDone: () => void }) {
  const { logout } = useAuth()
  return (
    <button
      type="button"
      onClick={() => {
        logout()
        onDone()
      }}
      className="flex items-center gap-3 py-3 px-2 font-label-bold text-label-bold text-primary-container"
    >
      <Icon name="logout" />
      Cerrar sesión
    </button>
  )
}
