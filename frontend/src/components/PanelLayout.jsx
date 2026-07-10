// components/PanelLayout.jsx — Nav compartido por Dashboard/Alumnos/Cursos/
// Asistencia/Pagos. Antes cada pagina dibujaba su propio <nav>; esto evita
// duplicar el header en 5 archivos y deja una sola fuente de verdad para
// los links del panel.
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icon: '🏠', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/alumnos', label: 'Alumnos', icon: '👧', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/cursos', label: 'Cursos', icon: '📚', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { path: '/asistencia', label: 'Asistencia', icon: '📅', roles: ['administrador', 'direccion', 'educadora', 'recepcion'] },
  { path: '/pagos', label: 'Pagos', icon: '💰', roles: ['administrador', 'direccion', 'finanzas'] },
  { path: '/apoderados', label: 'Apoderados', icon: '👥', roles: ['administrador', 'direccion', 'recepcion'] },
  { path: '/educadoras', label: 'Educadoras', icon: '🍎', roles: ['administrador', 'direccion', 'recepcion'] },
  { path: '/usuarios', label: 'Usuarios', icon: '🔑', roles: ['administrador'] },
]

export default function PanelLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol))
  const homePath = user?.rol === 'apoderado' ? '/portal' : '/dashboard'

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.brand} onClick={() => navigate(homePath)}>
          <span style={styles.logoMark}>PM</span>
          <span>Preescolar <em>Manager</em></span>
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
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #eef7ff 0%, #f8fcff 45%, #ffffff 100%)' },
  nav: {
    background: '#ffffff', color: colors.textDark, padding: '0.9rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
    boxShadow: '0 8px 24px rgba(15, 35, 75, 0.08)',
    borderBottom: `1px solid ${colors.border}`,
  },
  brand: { display: 'inline-flex', alignItems: 'center', gap: '0.65rem', fontWeight: '800', cursor: 'pointer', fontSize: '1.05rem', color: colors.primaryDark },
  logoMark: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '12px', background: colors.primary, color: '#fff', fontSize: '0.78rem', boxShadow: shadows.card },
  links: { display: 'flex', gap: '0.4rem', flex: 1, flexWrap: 'wrap' },
  link: {
    background: 'transparent', border: 'none', color: colors.textDark, opacity: 0.82,
    padding: '0.45rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem',
  },
  linkActive: { background: colors.primaryLight, color: colors.primaryDark, opacity: 1, fontWeight: '700' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { fontSize: '0.85rem', opacity: 0.9, color: colors.textMuted },
  logoutBtn: {
    background: colors.primary, color: '#fff', border: `1px solid ${colors.primary}`,
    padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title: { color: colors.primaryDark, marginBottom: '1.5rem' },
}
