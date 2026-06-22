// pages/LandingPage.jsx — Reemplaza al antiguo flujo donde "/" caia
// directo en el formulario de login. Esta es la portada PUBLICA del
// jardin infantil; el acceso administrativo se abre como modal.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../components/LoginModal.jsx'
import { colors, shadows } from '../theme.js'

const MODULOS = [
  { icon: '👧', titulo: 'Alumnos', texto: 'Matrícula, ficha médica y seguimiento de cada niño.' },
  { icon: '📅', titulo: 'Asistencia', texto: 'Registro diario de llegada, salida e inasistencias.' },
  { icon: '💰', titulo: 'Pagos', texto: 'Mensualidades, becas y control de cobranza.' },
  { icon: '📚', titulo: 'Cursos', texto: 'Organización por nivel, sala y educadora a cargo.' },
]

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.brand}>🌻 Jardín Infantil <em>Crecer Feliz</em></span>
        <button style={styles.navButton} onClick={() => setShowLogin(true)}>
          Iniciar Sesión
        </button>
      </nav>

      <header style={styles.hero}>
        <h1 style={styles.heroTitle}>Gestión integral para tu jardín infantil</h1>
        <p style={styles.heroSubtitle}>
          Matrícula, asistencia, pagos y cursos en un solo sistema, pensado para
          jardines infantiles, salas cuna y centros preescolares.
        </p>
        <button style={styles.heroButton} onClick={() => setShowLogin(true)}>
          Acceder al panel administrativo →
        </button>
      </header>

      <section style={styles.modulos}>
        {MODULOS.map((m) => (
          <div key={m.titulo} style={styles.moduloCard}>
            <span style={styles.moduloIcon}>{m.icon}</span>
            <h3 style={styles.moduloTitulo}>{m.titulo}</h3>
            <p style={styles.moduloTexto}>{m.texto}</p>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Jardín Infantil Crecer Feliz — Sistema de Gestión Preescolar</p>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false)
            navigate('/dashboard')
          }}
        />
      )}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: colors.bgLight, display: 'flex', flexDirection: 'column' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: colors.cardBg, boxShadow: shadows.card,
  },
  brand: { fontSize: '1.2rem', fontWeight: '700', color: colors.primaryDark },
  navButton: {
    background: colors.primary, color: '#fff', border: 'none', padding: '0.6rem 1.3rem',
    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
  },
  hero: {
    textAlign: 'center', padding: '4rem 1.5rem 3rem', maxWidth: '720px',
    margin: '0 auto',
  },
  heroTitle: { fontSize: '2.2rem', color: colors.primaryDark, marginBottom: '1rem', lineHeight: 1.25 },
  heroSubtitle: { fontSize: '1.05rem', color: colors.textMuted, marginBottom: '2rem', lineHeight: 1.6 },
  heroButton: {
    background: colors.accent, color: '#fff', border: 'none', padding: '0.9rem 1.8rem',
    borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
    boxShadow: shadows.card,
  },
  modulos: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem', maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 4rem', width: '100%',
    boxSizing: 'border-box',
  },
  moduloCard: {
    background: colors.cardBg, borderRadius: '14px', padding: '1.75rem 1.5rem',
    boxShadow: shadows.card, textAlign: 'center',
  },
  moduloIcon: { fontSize: '2.2rem', display: 'block', marginBottom: '0.75rem' },
  moduloTitulo: { color: colors.primaryDark, margin: '0 0 0.5rem', fontSize: '1.1rem' },
  moduloTexto: { color: colors.textMuted, fontSize: '0.9rem', lineHeight: 1.5, margin: 0 },
  footer: {
    textAlign: 'center', padding: '1.5rem', color: colors.textMuted,
    fontSize: '0.85rem', borderTop: `1px solid ${colors.border}`,
  },
}
