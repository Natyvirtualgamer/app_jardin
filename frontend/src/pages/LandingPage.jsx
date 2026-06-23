// pages/LandingPage.jsx — Rediseño v2 inspirado en el layout de referencia
// del usuario (nav con secciones, hero split con ilustracion, tarjetas con
// icono en circulo). La ilustracion es un SVG propio (no una foto de stock)
// para no depender de licencias de imagen ni de hosting externo.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../components/LoginModal.jsx'
import { colors, shadows } from '../theme.js'

const MODULOS = [
  { icon: '👧', bg: '#e8f5e9', titulo: 'Alumnos', texto: 'Matrícula, ficha médica y seguimiento de cada niño.' },
  { icon: '📅', bg: '#e3f2fd', titulo: 'Asistencia', texto: 'Registro diario de llegada, salida e inasistencias.' },
  { icon: '💰', bg: '#fff3e0', titulo: 'Pagos', texto: 'Mensualidades, becas y control de cobranza.' },
  { icon: '📚', bg: '#f3e5f5', titulo: 'Cursos', texto: 'Organización por nivel, sala y educadora a cargo.' },
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.brand}>🌻 Jardín Infantil <em>Crecer Feliz</em></span>
        <div style={styles.navLinks}>
          <button style={styles.navLink} onClick={() => scrollTo('inicio')}>Inicio</button>
          <button style={styles.navLink} onClick={() => scrollTo('funciones')}>Funciones</button>
          <button style={styles.navLink} onClick={() => scrollTo('contacto')}>Contacto</button>
        </div>
        <button style={styles.navButton} onClick={() => setShowLogin(true)}>Iniciar Sesión</button>
      </nav>

      <header id="inicio" style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.heroTitle}>Gestiona tu jardín infantil en un solo lugar</h1>
          <p style={styles.heroSubtitle}>
            Matrícula, asistencia, pagos y cursos para jardines infantiles,
            salas cuna y centros preescolares — todo en una sola plataforma.
          </p>
          <div style={styles.heroButtons}>
            <button style={styles.heroButtonPrimary} onClick={() => setShowLogin(true)}>
              Iniciar Sesión →
            </button>
            <button style={styles.heroButtonOutline} onClick={() => scrollTo('funciones')}>
              Ver funciones
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <HeroIllustration />
        </div>
      </header>

      <section id="funciones" style={styles.section}>
        <h2 style={styles.sectionTitle}>Todo lo que necesita tu equipo</h2>
        <div style={styles.modulos}>
          {MODULOS.map((m) => (
            <div key={m.titulo} style={styles.moduloCard}>
              <span style={{ ...styles.moduloIconWrap, background: m.bg }}>{m.icon}</span>
              <h3 style={styles.moduloTitulo}>{m.titulo}</h3>
              <p style={styles.moduloTexto}>{m.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contacto" style={styles.contacto}>
        <h2 style={styles.sectionTitle}>Contacto</h2>
        <div style={styles.contactoCard}>
          <p>📍 Av. Alemania 0671, Temuco, Región de La Araucanía</p>
          <p>📞 +56 9 1234 5678</p>
          <p>✉️ contacto@jardincrecerfeliz.cl</p>
          <p>🕗 Lunes a viernes, 08:00 — 18:30</p>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Jardín Infantil Crecer Feliz — Sistema de Gestión Preescolar</p>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(rol) => {
            setShowLogin(false)
            navigate(rol === 'apoderado' ? '/portal' : '/dashboard')
          }}
        />
      )}
    </div>
  )
}

function HeroIllustration() {
  // Ilustracion propia en SVG (estante con bloques + planta) — evita usar
  // fotos de stock con derechos ajenos.
  return (
    <svg viewBox="0 0 420 340" width="100%" height="100%" role="img" aria-label="Ilustración de sala de jardín infantil">
      <rect x="20" y="40" width="380" height="260" rx="20" fill={colors.primaryLight} />
      <rect x="60" y="190" width="300" height="14" rx="7" fill={colors.primary} />
      <rect x="80" y="120" width="60" height="60" rx="10" fill={colors.secondary} />
      <rect x="160" y="100" width="60" height="80" rx="10" fill={colors.accent} />
      <rect x="240" y="135" width="60" height="45" rx="10" fill={colors.primary} />
      <circle cx="330" cy="90" r="28" fill={colors.secondary} opacity="0.7" />
      <path d="M70 300 q15 -40 30 0" stroke={colors.primary} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="260" r="18" fill={colors.primary} />
      <path d="M340 300 q15 -40 30 0" stroke={colors.primaryDark} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="370" cy="260" r="14" fill={colors.primaryDark} />
    </svg>
  )
}

const styles = {
  page: { minHeight: '100vh', background: colors.bgLight, display: 'flex', flexDirection: 'column' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
    padding: '1rem 2rem', background: colors.cardBg, boxShadow: shadows.card, flexWrap: 'wrap',
  },
  brand: { fontSize: '1.15rem', fontWeight: '700', color: colors.primaryDark, whiteSpace: 'nowrap' },
  navLinks: { display: 'flex', gap: '1.5rem' },
  navLink: { background: 'none', border: 'none', color: colors.textDark, fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' },
  navButton: {
    background: colors.primary, color: '#fff', border: 'none', padding: '0.6rem 1.3rem',
    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
  },
  hero: {
    display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap',
    maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem 3rem', width: '100%', boxSizing: 'border-box',
  },
  heroText: { flex: '1 1 380px', minWidth: '300px' },
  heroTitle: { fontSize: '2.1rem', color: colors.primaryDark, marginBottom: '1rem', lineHeight: 1.25 },
  heroSubtitle: { fontSize: '1rem', color: colors.textMuted, marginBottom: '1.75rem', lineHeight: 1.6 },
  heroButtons: { display: 'flex', gap: '0.9rem', flexWrap: 'wrap' },
  heroButtonPrimary: {
    background: colors.primary, color: '#fff', border: 'none', padding: '0.85rem 1.6rem',
    borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', boxShadow: shadows.card,
  },
  heroButtonOutline: {
    background: 'transparent', color: colors.primary, border: `1.5px solid ${colors.primary}`,
    padding: '0.85rem 1.6rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
  },
  heroImage: { flex: '1 1 320px', minWidth: '280px', maxWidth: '420px' },
  section: { maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem 4rem', width: '100%', boxSizing: 'border-box' },
  sectionTitle: { textAlign: 'center', color: colors.primaryDark, fontSize: '1.6rem', marginBottom: '2rem' },
  modulos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  moduloCard: { background: colors.cardBg, borderRadius: '14px', padding: '1.75rem 1.5rem', boxShadow: shadows.card, textAlign: 'center' },
  moduloIconWrap: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px',
    borderRadius: '50%', fontSize: '1.6rem', marginBottom: '0.9rem',
  },
  moduloTitulo: { color: colors.primaryDark, margin: '0 0 0.5rem', fontSize: '1.1rem' },
  moduloTexto: { color: colors.textMuted, fontSize: '0.9rem', lineHeight: 1.5, margin: 0 },
  contacto: { background: colors.cardBg, padding: '3rem 1.5rem', borderTop: `1px solid ${colors.border}` },
  contactoCard: {
    maxWidth: '460px', margin: '0 auto', textAlign: 'center', color: colors.textDark,
    lineHeight: 2, fontSize: '0.95rem',
  },
  footer: { textAlign: 'center', padding: '1.5rem', color: colors.textMuted, fontSize: '0.85rem', borderTop: `1px solid ${colors.border}` },
}
