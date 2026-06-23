// components/PanelLayout.jsx — Nav compartido por Dashboard/Alumnos/Cursos/
// Asistencia/Pagos. Antes cada pagina dibujaba su propio <nav>; esto evita
// duplicar el header en 5 archivos y deja una sola fuente de verdad para
// los links del panel.
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icon: '🏠' },
  { path: '/alumnos', label: 'Alumnos', icon: '👧' },
  { path: '/apoderados', label: 'Apoderados', icon: '👥' },
  { path: '/cursos', label: 'Cursos', icon: '📚' },
  { path: '/asistencia', label: 'Asistencia', icon: '📅' },
  { path: '/pagos', label: 'Pagos', icon: '💰' },
]

const NAV_ITEM_EDUCADORAS = { path: '/educadoras', label: 'Educadoras', icon: '🍎' }
const NAV_ITEM_ADMIN = { path: '/usuarios', label: 'Usuarios', icon: '🔑' }

export default function PanelLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = user?.rol === 'administrador' ? [...NAV_ITEMS, NAV_ITEM_EDUCADORAS, NAV_ITEM_ADMIN] : NAV_ITEMS

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.brand} onClick={() => navigate('/dashboard')}>
          🌻 Jardín Infantil
        </span>
        <div style={styles.links}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.link,
                ...(location.pathname === item.path ? styles.linkActive : {}),
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div style={styles.right}>
          <span style={styles.userInfo}>👤 {user?.nombre} <em>({user?.rol})</em></span>
          <button onClick={() => { logout(); navigate('/') }} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        {title && <h1 style={styles.title}>{title}</h1>}
        {children}
      </main>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: colors.bgLight },
  nav: {
    background: colors.primary, color: '#fff', padding: '0.85rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
    boxShadow: shadows.card,
  },
  brand: { fontWeight: '700', cursor: 'pointer', fontSize: '1.05rem' },
  links: { display: 'flex', gap: '0.4rem', flex: 1, flexWrap: 'wrap' },
  link: {
    background: 'transparent', border: 'none', color: '#fff', opacity: 0.85,
    padding: '0.45rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem',
  },
  linkActive: { background: 'rgba(255,255,255,0.2)', opacity: 1, fontWeight: '600' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { fontSize: '0.85rem', opacity: 0.9 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)',
    padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title: { color: colors.primaryDark, marginBottom: '1.5rem' },
}
