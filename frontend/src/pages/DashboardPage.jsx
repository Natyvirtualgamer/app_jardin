// pages/DashboardPage.jsx — Ahora usa PanelLayout (nav compartido) en vez
// de dibujar su propio <nav>. Las tarjetas siguen llevando a /alumnos,
// /cursos, /asistencia, /pagos — rutas que antes no existian en App.jsx.
import { useNavigate } from 'react-router-dom'
import PanelLayout from '../components/PanelLayout.jsx'
import { colors, shadows } from '../theme.js'

const CARDS = [
  { icon: '👧', label: 'Alumnos', link: '/alumnos', color: colors.primaryLight },
  { icon: '📅', label: 'Asistencia', link: '/asistencia', color: '#e3f2fd' },
  { icon: '💰', label: 'Pagos', link: '/pagos', color: '#fff3e0' },
  { icon: '📚', label: 'Cursos', link: '/cursos', color: '#f3e5f5' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <PanelLayout title="Panel de Gestión">
      <div style={styles.grid}>
        {CARDS.map((card) => (
          <div
            key={card.label}
            style={{ ...styles.card, background: card.color }}
            onClick={() => navigate(card.link)}
          >
            <span style={styles.cardIcon}>{card.icon}</span>
            <h3 style={styles.cardLabel}>{card.label}</h3>
            <p style={styles.cardCta}>Ir al módulo →</p>
          </div>
        ))}
      </div>
    </PanelLayout>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
  card: { padding: '1.5rem', borderRadius: '12px', cursor: 'pointer', boxShadow: shadows.card },
  cardIcon: { fontSize: '2rem', display: 'block', marginBottom: '0.5rem' },
  cardLabel: { margin: '0 0 0.5rem', color: colors.textDark, fontSize: '1.05rem' },
  cardCta: { margin: 0, fontSize: '0.85rem', color: colors.primaryDark, fontWeight: '600' },
}
