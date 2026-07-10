import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const ESTADO_ASISTENCIA = {
  presente: 'Presente',
  ausente: 'Ausente',
  atraso: 'Atraso',
  retiro_anticipado: 'Retiro anticipado',
}

const ESTADO_PAGO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' }

function mensajeError(err, fallback) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || fallback
}

function dinero(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CL')}`
}

export default function ApoderadoPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [detalles, setDetalles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      setError('')
      try {
        const alumnosRes = await api.get('/portal/mis-alumnos')
        setAlumnos(alumnosRes.data)
        const pares = await Promise.all(alumnosRes.data.map(async (alumno) => {
          const [asistenciaRes, pagosRes] = await Promise.all([
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/asistencia`),
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/pagos`),
          ])
          return [alumno.id_alumno, { asistencia: asistenciaRes.data, pagos: pagosRes.data }]
        }))
        setDetalles(Object.fromEntries(pares))
      } catch (err) {
        setError(mensajeError(err, 'No se pudo cargar el portal de apoderado'))
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.brand}><span style={styles.logoMark}>PM</span> Portal Apoderado</span>
        <div style={styles.right}>
          <span style={styles.userInfo}>👤 {user?.nombre}</span>
          <button onClick={() => { logout(); navigate('/') }} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.hero}>
          <p style={styles.kicker}>Seguimiento familiar</p>
          <h1 style={styles.title}>Bienvenido(a), {user?.nombre}</h1>
          <p style={styles.text}>Aquí puedes revisar únicamente la información de los estudiantes vinculados a tu cuenta.</p>
        </section>

        {loading && <p>Cargando información...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && alumnos.length === 0 && (
          <div style={styles.emptyCard}>
            <span style={styles.icon}>👨‍👩‍👧</span>
            <h2 style={styles.cardTitle}>Sin estudiantes asociados</h2>
            <p style={styles.text}>Aún no tienes estudiantes asociados. Contacta al jardín para solicitar la vinculación.</p>
          </div>
        )}

        {!loading && !error && alumnos.length > 0 && (
          <div style={styles.grid}>
            {alumnos.map((alumno) => {
              const info = detalles[alumno.id_alumno] || { asistencia: [], pagos: [] }
              return (
                <article key={alumno.id_alumno} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.avatar}>{alumno.nombres.charAt(0)}{alumno.apellidos.charAt(0)}</span>
                    <div>
                      <h2 style={styles.cardTitle}>{alumno.nombres} {alumno.apellidos}</h2>
                      <p style={styles.meta}>RUT {alumno.rut}</p>
                      <p style={styles.meta}>Nacimiento {alumno.fecha_nacimiento}</p>
                    </div>
                  </div>

                  <div style={styles.infoBox}>
                    <strong>Curso</strong>
                    <span>{alumno.curso || 'Sin curso asignado'}</span>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Datos de salud</h3>
                    <p style={styles.meta}>Alergias: {alumno.alergias || 'Sin registro'}</p>
                    <p style={styles.meta}>Medicamentos: {alumno.medicamentos || 'Sin registro'}</p>
                    <p style={styles.meta}>Observaciones: {alumno.observaciones || 'Sin observaciones'}</p>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Asistencia</h3>
                    {info.asistencia.length === 0 && <p style={styles.meta}>Sin registros de asistencia.</p>}
                    {info.asistencia.slice(0, 5).map((registro) => (
                      <div key={registro.id_asistencia} style={styles.rowLine}>
                        <span>{registro.fecha}</span>
                        <strong>{ESTADO_ASISTENCIA[registro.estado] || registro.estado}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Mensualidades y pagos</h3>
                    {info.pagos.length === 0 && <p style={styles.meta}>Sin mensualidades registradas.</p>}
                    {info.pagos.map((mensualidad) => (
                      <div key={mensualidad.id_mensualidad} style={styles.paymentBox}>
                        <div style={styles.rowLine}>
                          <span>{mensualidad.periodo}</span>
                          <strong>{ESTADO_PAGO[mensualidad.estado] || mensualidad.estado}</strong>
                        </div>
                        <p style={styles.meta}>Monto: {dinero(mensualidad.monto_total)} · Descuento: {dinero(mensualidad.descuento)}</p>
                        {mensualidad.pagos.length === 0 && <p style={styles.meta}>Sin pagos registrados para este periodo.</p>}
                        {mensualidad.pagos.map((pago) => (
                          <p key={pago.id_pago} style={styles.meta}>Pago {dinero(pago.monto)} por {pago.metodo_pago}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #eef7ff 0%, #f8fcff 45%, #ffffff 100%)' },
  nav: { background: '#fff', color: colors.textDark, padding: '0.9rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 8px 24px rgba(15, 35, 75, 0.08)', borderBottom: `1px solid ${colors.border}` },
  brand: { display: 'inline-flex', alignItems: 'center', gap: '0.65rem', fontWeight: '800', fontSize: '1.05rem', color: colors.primaryDark },
  logoMark: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '12px', background: colors.primary, color: '#fff', fontSize: '0.78rem', boxShadow: shadows.card },
  right: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  userInfo: { fontSize: '0.85rem', color: colors.textMuted },
  logoutBtn: { background: colors.primary, color: '#fff', border: `1px solid ${colors.primary}`, padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  main: { padding: '2rem', maxWidth: '1120px', margin: '0 auto' },
  hero: { background: '#fff', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: shadows.card, border: `1px solid ${colors.border}` },
  kicker: { margin: '0 0 0.4rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.75rem' },
  title: { color: colors.primaryDark, margin: '0 0 0.5rem', fontSize: '1.7rem' },
  text: { color: colors.textMuted, lineHeight: 1.6, margin: 0 },
  error: { color: colors.danger, background: colors.dangerLight, padding: '0.75rem 1rem', borderRadius: '8px' },
  emptyCard: { background: colors.cardBg, borderRadius: '16px', boxShadow: shadows.card, padding: '2.5rem', maxWidth: '560px', textAlign: 'center', margin: '0 auto' },
  icon: { fontSize: '2.5rem', display: 'block', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' },
  card: { background: colors.cardBg, borderRadius: '16px', boxShadow: shadows.card, border: `1px solid ${colors.border}`, padding: '1.25rem' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  avatar: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: colors.primaryLight, color: colors.primaryDark, fontWeight: '900' },
  cardTitle: { color: colors.primaryDark, margin: '0 0 0.35rem', fontSize: '1.15rem' },
  meta: { display: 'block', color: colors.textMuted, fontSize: '0.85rem', margin: '0.2rem 0', lineHeight: 1.45 },
  infoBox: { display: 'flex', justifyContent: 'space-between', gap: '1rem', background: colors.primaryLight, color: colors.primaryDark, borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem', flexWrap: 'wrap' },
  section: { borderTop: `1px solid ${colors.border}`, paddingTop: '0.9rem', marginTop: '0.9rem' },
  sectionTitle: { color: colors.primaryDark, margin: '0 0 0.6rem', fontSize: '0.98rem' },
  rowLine: { display: 'flex', justifyContent: 'space-between', gap: '1rem', color: colors.textDark, fontSize: '0.85rem', marginBottom: '0.35rem' },
  paymentBox: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.7rem', marginBottom: '0.6rem' },
}
