// pages/ApoderadoPortal.jsx — Destino para usuarios con rol 'apoderado'.
// A proposito NO reutiliza PanelLayout (ese nav es del personal del jardin:
// Alumnos/Cursos/Asistencia/Pagos — un apoderado no debe ver esos modulos).
// Placeholder honesto: el portal con datos reales de "mis hijos" requiere
// endpoints nuevos con filtro por la relacion alumno_apoderado, que
// quedaron fuera de esta entrega por decision explicita (ver conversacion).
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { colors, shadows } from '../theme.js'

export default function ApoderadoPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.brand}>🌻 Jardín Infantil</span>
        <div style={styles.right}>
          <span style={styles.userInfo}>👤 {user?.nombre}</span>
          <button onClick={() => { logout(); navigate('/') }} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </nav>
      <main style={styles.main}>
        <div style={styles.card}>
          <span style={styles.icon}>👨‍👩‍👧</span>
          <h1 style={styles.title}>¡Bienvenido(a), {user?.nombre}!</h1>
          <p style={styles.text}>
            Tu portal de seguimiento (asistencia, pagos y comunicados de tu hijo/a)
            estará disponible próximamente. Por ahora, cualquier consulta puedes
            hacerla directamente en recepción.
          </p>
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: colors.bgLight },
  nav: {
    background: colors.primary, color: '#fff', padding: '0.85rem 1.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: shadows.card,
  },
  brand: { fontWeight: '700', fontSize: '1.05rem' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { fontSize: '0.85rem', opacity: 0.9 },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  main: { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card: { background: colors.cardBg, borderRadius: '16px', boxShadow: shadows.card, padding: '2.5rem', maxWidth: '480px', textAlign: 'center' },
  icon: { fontSize: '2.5rem', display: 'block', marginBottom: '1rem' },
  title: { color: colors.primaryDark, marginBottom: '0.75rem' },
  text: { color: colors.textMuted, lineHeight: 1.6, margin: 0 },
}
