import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

const baseNavItems = [
  { to: '/', label: 'Inicio' },
  { to: '/eventos', label: 'Catálogo' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/trabaja-con-nosotros', label: 'Trabaja con nosotros' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { count: cartCount } = useCart()
  const navigate = useNavigate()

  const navItems = isAuthenticated
    ? [
        ...baseNavItems.slice(0, 2),
        { to: '/mis-compras', label: 'Mis Compras' },
        { to: '/mi-cuenta', label: 'Mi Cuenta' },
        ...baseNavItems.slice(2),
      ]
    : baseNavItems

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface border-b border-primary-container">
      <div className="shots-container flex justify-between items-center h-20">
        <Link to="/" className="flex items-center">
          <Logo className="h-7 md:h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-8 h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `font-label-bold text-label-bold h-full flex items-center px-2 transition-colors duration-200 ${
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

        <div className="flex items-center gap-4">
          <Link
            to="/carrito"
            aria-label="Ver carrito"
            className="relative text-on-surface hover:text-primary transition-colors"
          >
            <Icon name="shopping_cart" className="text-2xl" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-on-primary font-label-bold text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
          <ThemeToggle className="hidden md:flex" />
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="flex items-center gap-2 font-label-bold text-label-bold text-on-surface">
                <Icon name="account_circle" className="text-xl text-primary" />
                {user?.name?.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 font-label-bold text-label-bold uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name="logout" className="text-lg" />
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:inline-flex shots-btn-primary">
              <Icon name="login" className="text-xl" />
              Ingresar
            </Link>
          )}
          <ThemeToggle className="md:hidden" />
          <button
            type="button"
            className="md:hidden text-on-surface p-2"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
          >
            <Icon name={open ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-surface border-t border-surface-variant">
          <div className="shots-container flex flex-col py-4 gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-label-bold text-label-bold py-2 ${
                    isActive ? 'text-primary' : 'text-on-surface'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="shots-btn-secondary justify-center mt-2"
              >
                <Icon name="logout" />
                Cerrar sesión ({user?.name?.split(' ')[0]})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="shots-btn-primary justify-center mt-2"
              >
                <Icon name="login" />
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
