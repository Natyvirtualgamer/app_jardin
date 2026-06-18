import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h2 style={styles.navTitle}>🌻 Jardín Infantil</h2>
        <div style={styles.navRight}>
          <span style={styles.userInfo}>👤 {user?.nombre} | <em>{user?.rol}</em></span>
          <button onClick={logout} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </nav>
      <main style={styles.main}>
        <h1 style={styles.title}>Dashboard Administrativo</h1>
        <div style={styles.grid}>
          {[
            { icon: '👧', label: 'Alumnos', valor: '—', link: '/alumnos', color: '#e8f5e9' },
            { icon: '📅', label: 'Asistencia hoy', valor: '—', link: '/asistencia', color: '#e3f2fd' },
            { icon: '💰', label: 'Pagos pendientes', valor: '—', link: '/pagos', color: '#fff3e0' },
            { icon: '📚', label: 'Cursos activos', valor: '—', link: '/cursos', color: '#f3e5f5' },
          ].map(card => (
            <div
              key={card.label}
              style={{ ...styles.card, background: card.color }}
              onClick={() => navigate(card.link)}
            >
              <span style={styles.cardIcon}>{card.icon}</span>
              <h3 style={styles.cardLabel}>{card.label}</h3>
              <p style={styles.cardValor}>{card.valor}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#fafafa' },
  nav: { background: '#2e7d32', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navTitle: { margin: 0, fontSize: '1.3rem' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { fontSize: '0.9rem', opacity: 0.9 },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  main: { padding: '2rem' },
  title: { color: '#2e7d32', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
  card: { padding: '1.5rem', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  cardIcon: { fontSize: '2rem', display: 'block', marginBottom: '0.5rem' },
  cardLabel: { margin: '0 0 0.5rem', color: '#333', fontSize: '0.9rem' },
  cardValor: { margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#2e7d32' },
}
