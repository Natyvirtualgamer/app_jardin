import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../components/LoginModal.jsx'
import heroImage from '../assets/hero-classroom.png'
import { colors, shadows } from '../theme.js'
import './LandingPage.css'

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '56912345678'
const WHATSAPP_GROUP_URL = import.meta.env.VITE_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/Db9jSyj7IuxI18s0WdAyH4'

const MODULOS = [
  { icon: 'A', titulo: 'Alumnos', texto: 'Matricula, ficha medica y cursos asignados.' },
  { icon: 'C', titulo: 'Cursos', texto: 'Niveles, capacidad, horario y educadora a cargo.' },
  { icon: 'AS', titulo: 'Asistencia', texto: 'Registro diario por alumno y fecha.' },
  { icon: 'AP', titulo: 'Apoderados', texto: 'Cuentas y acceso al portal familiar.' },
  { icon: 'U', titulo: 'Usuarios', texto: 'Personal, educadoras, finanzas, recepcion y administradores.' },
  { icon: 'P', titulo: 'Pagos', texto: 'Mensualidades, descuentos y pagos parciales.' },
]

const CONTACTO_INICIAL = { nombre: '', jardin: '', correo: '', telefono: '', mensaje: '' }

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [contacto, setContacto] = useState(CONTACTO_INICIAL)
  const [contactoAviso, setContactoAviso] = useState('')
  const navigate = useNavigate()

  function enviarWhatsApp(e) {
    e.preventDefault()
    const texto = `Hola, quiero solicitar informacion/demo de App Jardin.
Nombre: ${contacto.nombre}
Jardin/Institucion: ${contacto.jardin}
Correo: ${contacto.correo}
Telefono: ${contacto.telefono}
Mensaje: ${contacto.mensaje || 'Quiero recibir mas informacion.'}`

    if (WHATSAPP_GROUP_URL) {
      const mensajeGrupo = `${texto}

Grupo App Jardin: ${WHATSAPP_GROUP_URL}`
      setContactoAviso('WhatsApp se abrira con el mensaje listo. Selecciona el grupo de App Jardin y presiona enviar.')
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeGrupo)}`, '_blank', 'noopener,noreferrer')
      return
    }

    setContactoAviso('WhatsApp se abrira con el mensaje listo para enviar.')
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="landing-page" style={styles.page}>
      <nav className="landing-nav" style={styles.nav}>
        <button style={styles.brand} onClick={() => scrollTo('inicio')} aria-label="Ir al inicio">
          <span style={styles.logoIcon}>PM</span>
          <span><strong>Preescolar</strong><em>Manager</em></span>
        </button>
        <div className="landing-nav-links" style={styles.navLinks}>
          <button style={styles.navLinkActive} onClick={() => scrollTo('inicio')}>Inicio</button>
          <button style={styles.navLink} onClick={() => scrollTo('funciones')}>Funciones</button>
          <button style={styles.navLink} onClick={() => scrollTo('planes')}>Planes</button>
          <button style={styles.navLink} onClick={() => scrollTo('contacto')}>Contacto</button>
        </div>
        <button className="landing-nav-button" style={styles.navButton} onClick={() => scrollTo('contacto')}>Solicitar demo</button>
      </nav>

      <header id="inicio" className="landing-hero" style={styles.hero}>
        <div style={styles.heroCopy}>
          <p style={styles.kicker}>Sistema de gestion preescolar</p>
          <h1 style={styles.heroTitle}>Gestiona tu jardin infantil en un solo lugar</h1>
          <p style={styles.heroSubtitle}>
            Alumnos, cursos, asistencia, pagos, apoderados y usuarios para centros educativos,
            conectados con tu backend real y datos persistentes.
          </p>
          <div style={styles.heroButtons}>
            <button style={styles.heroButtonPrimary} onClick={() => setShowLogin(true)}>Ingresar al sistema</button>
            <button style={styles.heroButtonOutline} onClick={() => scrollTo('funciones')}>Ver funciones</button>
          </div>
        </div>
        <div className="landing-hero-media-wrap" style={styles.heroMediaWrap}>
          <img src={heroImage} alt="Educadora usando una tablet en sala de jardin infantil" style={styles.heroMedia} />
        </div>
      </header>

      <section id="funciones" style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.kicker}>Funciones</p>
          <h2 style={styles.sectionTitle}>Modulos listos para la demo</h2>
        </div>
        <div className="landing-modulos" style={styles.modulos}>
          {MODULOS.map((modulo) => (
            <article key={modulo.titulo} className="landing-modulo-card" style={styles.moduloCard}>
              <span style={styles.moduloIcon}>{modulo.icon}</span>
              <div>
                <h3 style={styles.moduloTitulo}>{modulo.titulo}</h3>
                <p style={styles.moduloTexto}>{modulo.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" style={styles.band}>
        <div style={styles.planContent}>
          <p style={styles.kicker}>Planes</p>
          <h2 style={styles.sectionTitleLeft}>Una base funcional para crecer</h2>
          <p style={styles.textLine}>Esta version mantiene login, dashboard, CRUDs principales, RDS, ALB, dos EC2 y despliegue por GitHub Actions.</p>
          <button style={styles.heroButtonPrimary} onClick={() => scrollTo('contacto')}>Solicitar demo</button>
        </div>
      </section>

      <section id="contacto" className="landing-contact-section" style={styles.contactSection}>
        <div style={styles.contactCopy}>
          <p style={styles.kicker}>Contacto</p>
          <h2 style={styles.sectionTitleLeft}>Agenda una revision por WhatsApp</h2>
          <p style={styles.textLine}>Completa el formulario y se abrira WhatsApp con el mensaje preparado. Selecciona el grupo de App Jardin y presiona enviar.</p>
        </div>
        <form className="landing-contact-form" onSubmit={enviarWhatsApp} style={styles.contactForm}>
          <Campo label="Nombre" value={contacto.nombre} onChange={(v) => setContacto({ ...contacto, nombre: v })} required />
          <Campo label="Nombre del jardin o institucion" value={contacto.jardin} onChange={(v) => setContacto({ ...contacto, jardin: v })} required />
          <div style={styles.formGrid}>
            <Campo label="Correo" type="email" value={contacto.correo} onChange={(v) => setContacto({ ...contacto, correo: v })} required />
            <Campo label="Telefono" value={contacto.telefono} onChange={(v) => setContacto({ ...contacto, telefono: v })} required />
          </div>
          <div style={styles.field}>
            <label htmlFor="contacto-mensaje" style={styles.label}>Mensaje</label>
            <textarea
              id="contacto-mensaje"
              value={contacto.mensaje}
              onChange={(e) => setContacto({ ...contacto, mensaje: e.target.value })}
              rows={4}
              style={styles.textarea}
            />
          </div>
          {contactoAviso && <p style={styles.contactHint}>{contactoAviso}</p>}
          <button type="submit" style={styles.saveBtn}>Enviar por WhatsApp</button>
        </form>
      </section>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} Preescolar Manager</span>
        <button style={styles.footerLink} onClick={() => setShowLogin(true)}>Ingresar</button>
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

function Campo({ label, value, onChange, type = 'text', required }) {
  const id = `contacto-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={styles.input} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f9ff', color: colors.textDark },
  nav: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 6vw', background: '#fff', borderBottom: `1px solid ${colors.border}`, boxShadow: '0 8px 26px rgba(15,35,75,0.08)', flexWrap: 'wrap' },
  brand: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: colors.primaryDark, cursor: 'pointer', fontSize: '1.05rem', textAlign: 'left' },
  logoIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '15px', background: colors.primary, color: '#fff', fontWeight: '800', boxShadow: shadows.card },
  navLinks: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  navLink: { background: 'transparent', border: 'none', color: colors.textDark, cursor: 'pointer', fontWeight: '700', padding: '0.55rem 0.4rem' },
  navLinkActive: { background: 'transparent', border: 'none', borderBottom: `3px solid ${colors.primary}`, color: colors.primary, cursor: 'pointer', fontWeight: '800', padding: '0.55rem 0.4rem' },
  navButton: { background: colors.primary, color: '#fff', border: 'none', borderRadius: '9px', padding: '0.75rem 1.15rem', fontWeight: '800', cursor: 'pointer', boxShadow: shadows.card },
  hero: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', alignItems: 'center', gap: '2rem', minHeight: '570px', padding: '3rem 6vw', background: '#fff', overflow: 'hidden' },
  heroCopy: { maxWidth: '620px' },
  kicker: { margin: '0 0 0.75rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.78rem' },
  heroTitle: { margin: '0 0 1rem', color: colors.primaryDark, fontSize: 'clamp(2.35rem, 5vw, 4.6rem)', lineHeight: 1.05, fontWeight: 900 },
  heroSubtitle: { margin: '0 0 1.75rem', color: colors.textMuted, fontSize: '1.15rem', lineHeight: 1.55 },
  heroButtons: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  heroButtonPrimary: { background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.9rem 1.3rem', fontWeight: '800', cursor: 'pointer', boxShadow: shadows.card },
  heroButtonOutline: { background: '#fff', color: colors.secondary, border: `1.5px solid ${colors.secondary}`, borderRadius: '10px', padding: '0.9rem 1.3rem', fontWeight: '800', cursor: 'pointer' },
  heroMediaWrap: { minHeight: '360px', height: '52vw', maxHeight: '570px', borderRadius: '42px 0 0 42px', overflow: 'hidden', boxShadow: '0 20px 48px rgba(15,35,75,0.18)' },
  heroMedia: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  section: { padding: '3rem 6vw 4rem' },
  sectionHeader: { textAlign: 'center', marginBottom: '2rem' },
  sectionTitle: { margin: 0, color: colors.primaryDark, fontSize: '2rem' },
  sectionTitleLeft: { margin: '0 0 1rem', color: colors.primaryDark, fontSize: '2rem' },
  modulos: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(250px, 1fr))', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' },
  moduloCard: { display: 'flex', alignItems: 'flex-start', gap: '1rem', background: '#fff', borderRadius: '14px', padding: '1.3rem', boxShadow: shadows.card, border: `1px solid ${colors.border}` },
  moduloIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '58px', height: '58px', borderRadius: '50%', background: colors.primaryLight, color: colors.primaryDark, fontSize: '1rem', fontWeight: 900, flexShrink: 0 },
  moduloTitulo: { margin: '0 0 0.45rem', color: colors.primaryDark },
  moduloTexto: { margin: 0, color: colors.textMuted, lineHeight: 1.5 },
  band: { padding: '3.5rem 6vw', background: '#fff' },
  planContent: { maxWidth: '760px' },
  textLine: { color: colors.textMuted, lineHeight: 1.65, fontSize: '1rem', marginBottom: '1.25rem' },
  contactSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', padding: '4rem 6vw', alignItems: 'start' },
  contactCopy: { maxWidth: '480px' },
  contactForm: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: shadows.card, border: `1px solid ${colors.border}` },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.35rem', color: colors.textDark, fontWeight: '700', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.72rem', border: `1.5px solid ${colors.border}`, borderRadius: '9px', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.72rem', border: `1.5px solid ${colors.border}`, borderRadius: '9px', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  contactHint: { margin: '0 0 1rem', color: colors.textMuted, lineHeight: 1.45, fontWeight: 700 },
  saveBtn: { width: '100%', padding: '0.85rem', background: colors.secondary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 6vw', background: colors.primaryDark, color: '#fff', flexWrap: 'wrap' },
  footerLink: { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '8px', padding: '0.55rem 0.9rem', cursor: 'pointer' },
}
