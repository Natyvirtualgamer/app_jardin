import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './PanelLayout.css'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icon: '🏠', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/alumnos', label: 'Alumnos', icon: '👧', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/cursos', label: 'Cursos', icon: '📚', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/asistencia', label: 'Asistencia', icon: '📅', roles: ['administrador', 'direccion', 'educadora', 'recepcion'] },
  { path: '/pagos', label: 'Pagos', icon: '💰', roles: ['administrador', 'direccion', 'finanzas'] },
  { path: '/comunicaciones', label: 'Comunicaciones', icon: '✉️', roles: ['administrador', 'direccion', 'educadora', 'recepcion'] },
  { path: '/minutas', label: 'Minuta', icon: '🍽️', roles: ['administrador', 'direccion', 'educadora', 'recepcion'] },
  { path: '/apoderados', label: 'Apoderados', icon: '👥', roles: ['administrador', 'direccion', 'recepcion'] },
  { path: '/educadoras', label: 'Educadoras', icon: '🍎', roles: ['administrador', 'direccion', 'recepcion'] },
  { path: '/usuarios', label: 'Usuarios', icon: '🔑', roles: ['administrador'] },
]

export default function PanelLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol))
  const homePath = user?.rol === 'apoderado' ? '/portal' : '/dashboard'

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  function irA(path) {
    navigate(path)
    setMenuOpen(false)
  }

  function cerrarSesion() {
    logout()
    navigate('/')
  }

  return (
    <div className="panel-shell">
      <nav className="panel-nav">
        <button className="panel-brand" onClick={() => irA(homePath)} aria-label="Ir al inicio">
          <span className="panel-logo">PM</span>
          <span>Preescolar <em>Manager</em></span>
        </button>

        <div className="panel-links" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => irA(item.path)} className={location.pathname === item.path ? 'panel-link active' : 'panel-link'}>
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="panel-right">
          <span className="panel-user">👤 {user?.nombre} <em>({user?.rol})</em></span>
          <button onClick={cerrarSesion} className="panel-logout">Cerrar sesión</button>
        </div>

        <button className="panel-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}>
          ☰ Menú
        </button>
      </nav>

      {menuOpen && <button className="panel-overlay" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}
      <aside className={menuOpen ? 'panel-drawer open' : 'panel-drawer'} aria-hidden={!menuOpen}>
        <div className="panel-drawer-header">
          <span className="panel-drawer-title">Menú</span>
          <button className="panel-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">×</button>
        </div>
        <span className="panel-user drawer">👤 {user?.nombre} <em>({user?.rol})</em></span>
        <div className="panel-drawer-links">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => irA(item.path)} className={location.pathname === item.path ? 'panel-drawer-link active' : 'panel-drawer-link'}>
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </button>
          ))}
          <button onClick={cerrarSesion} className="panel-drawer-logout">Cerrar sesión</button>
        </div>
      </aside>

      <main className="panel-main">
        {title && <h1 className="panel-title">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
