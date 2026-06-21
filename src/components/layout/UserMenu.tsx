import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../hooks/useAuth'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const firstName = user.name?.split(' ')[0] ?? 'Cuenta'
  const initial = (firstName[0] ?? 'U').toUpperCase()

  function close() {
    setOpen(false)
  }

  function handleLogout() {
    close()
    logout()
    navigate('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-2 py-1 text-on-surface hover:text-primary transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold">
          {initial}
        </span>
        <span className="hidden sm:inline font-label-bold text-label-bold">
          {firstName}
        </span>
        <Icon
          name="expand_more"
          className={`text-base transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-variant shadow-2xl z-50"
        >
          <div className="px-4 py-3 border-b border-surface-variant">
            <p className="font-label-bold text-label-bold text-on-surface truncate">
              {user.name}
            </p>
            <p className="font-caption text-caption text-on-surface-variant truncate">
              {user.email}
            </p>
          </div>
          <Link
            to="/mi-cuenta"
            role="menuitem"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-body-md text-body-md"
          >
            <Icon name="person" />
            Mi cuenta
          </Link>
          <Link
            to="/mis-compras"
            role="menuitem"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-body-md text-body-md"
          >
            <Icon name="receipt_long" />
            Mis compras
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-primary-container transition-colors font-body-md text-body-md border-t border-surface-variant"
          >
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
