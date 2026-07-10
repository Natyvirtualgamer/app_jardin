import { useNavigate } from 'react-router-dom'
import PanelLayout from '../components/PanelLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const BASE_CARDS = [
  { icon: '👧', label: 'Alumnos', link: '/alumnos', text: 'Matricula y fichas', color: '#eaf2ff', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { icon: '📚', label: 'Cursos', link: '/cursos', text: 'Niveles y cupos', color: '#fff7df', roles: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'] },
  { icon: '📅', label: 'Asistencia', link: '/asistencia', text: 'Registro diario', color: '#e8f4ff', roles: ['administrador', 'direccion', 'educadora', 'recepcion'] },
  { icon: '💰', label: 'Pagos', link: '/pagos', text: 'Mensualidades', color: '#fff0df', roles: ['administrador', 'direccion', 'finanzas'] },
  { icon: '👥', label: 'Apoderados', link: '/apoderados', text: 'Familias y accesos', color: '#e9f8f1', roles: ['administrador', 'direccion', 'recepcion'] },
  { icon: '🍎', label: 'Educadoras', link: '/educadoras', text: 'Personal pedagogico', color: '#fce9f1', roles: ['administrador', 'direccion', 'recepcion'] },
  { icon: '🔑', label: 'Usuarios', link: '/usuarios', text: 'CRUD de personal', color: '#eef0ff', roles: ['administrador'] },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cards = BASE_CARDS.filter((card) => card.roles.includes(user?.rol))

  return (
    <PanelLayout title="Panel de gestión">
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Administración</p>
          <h2 style={styles.heroTitle}>Gestiona la operación diaria desde un solo menú</h2>
          <p style={styles.heroText}>Accede a los módulos reales del proyecto: alumnos, apoderados, cursos, asistencia, pagos y usuarios del personal.</p>
        </div>
        {user?.rol === 'administrador' && (
          <button style={styles.primaryBtn} onClick={() => navigate('/usuarios')}>Crear usuario o personal</button>
        )}
      </section>

      <div style={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.label}
            style={{ ...styles.card, background: card.color }}
            onClick={() => navigate(card.link)}
          >
            <span style={styles.cardIcon}>{card.icon}</span>
            <span>
              <strong style={styles.cardLabel}>{card.label}</strong>
              <small style={styles.cardText}>{card.text}</small>
            </span>
          </button>
        ))}
      </div>
    </PanelLayout>
  )
}

const styles = {
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', background: '#fff', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: shadows.card, border: `1px solid ${colors.border}`, flexWrap: 'wrap' },
  kicker: { margin: '0 0 0.4rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.75rem' },
  heroTitle: { margin: '0 0 0.45rem', color: colors.primaryDark, fontSize: '1.6rem' },
  heroText: { margin: 0, color: colors.textMuted, lineHeight: 1.5, maxWidth: '680px' },
  primaryBtn: { background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.8rem 1rem', fontWeight: '800', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  card: { display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', border: `1px solid ${colors.border}`, padding: '1.15rem', borderRadius: '14px', cursor: 'pointer', boxShadow: shadows.card },
  cardIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: '#fff', fontSize: '1.45rem', flexShrink: 0 },
  cardLabel: { display: 'block', color: colors.primaryDark, fontSize: '1rem', marginBottom: '0.25rem' },
  cardText: { display: 'block', color: colors.textMuted, fontSize: '0.82rem' },
}
