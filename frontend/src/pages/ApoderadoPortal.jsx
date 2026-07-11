import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'info', label: 'Información del alumno' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'comunicaciones', label: 'Comunicaciones' },
  { key: 'minuta', label: 'Minuta' },
]

const DIAS_MINUTA = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
]

const ESTADO_ASISTENCIA = {
  presente: 'Presente',
  ausente: 'Ausente',
  atraso: 'Atraso',
  retiro_anticipado: 'Retiro anticipado',
}

const ESTADO_PAGO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' }
const ESTADO_COMUNICACION = { abierta: 'Abierta', respondida: 'Respondida', cerrada: 'Cerrada' }

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
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [activeTab, setActiveTab] = useState('resumen')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevaComunicacion, setNuevaComunicacion] = useState(false)
  const [formComunicacion, setFormComunicacion] = useState({ asunto: '', mensaje: '' })
  const [respuestas, setRespuestas] = useState({})
  const [guardandoComunicacion, setGuardandoComunicacion] = useState(false)

  async function cargarComunicacionesAlumno(idAlumno) {
    const comunicacionesRes = await api.get(`/portal/mis-alumnos/${idAlumno}/comunicaciones`)
    setDetalles((prev) => ({
      ...prev,
      [idAlumno]: { ...(prev[idAlumno] || { asistencia: [], pagos: [], minuta: [] }), comunicaciones: comunicacionesRes.data },
    }))
  }

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      setError('')
      try {
        const alumnosRes = await api.get('/portal/mis-alumnos')
        const listaAlumnos = alumnosRes.data
        setAlumnos(listaAlumnos)
        if (listaAlumnos.length > 0) setSelectedAlumnoId(String(listaAlumnos[0].id_alumno))

        const pares = await Promise.all(listaAlumnos.map(async (alumno) => {
          const [asistenciaRes, pagosRes, comunicacionesRes, minutaRes] = await Promise.all([
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/asistencia`),
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/pagos`),
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/comunicaciones`),
            api.get(`/portal/mis-alumnos/${alumno.id_alumno}/minuta`),
          ])
          return [alumno.id_alumno, { asistencia: asistenciaRes.data, pagos: pagosRes.data, comunicaciones: comunicacionesRes.data, minuta: minutaRes.data }]
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

  const alumnoSeleccionado = alumnos.find((alumno) => String(alumno.id_alumno) === selectedAlumnoId)
  const info = alumnoSeleccionado ? detalles[alumnoSeleccionado.id_alumno] || { asistencia: [], pagos: [], comunicaciones: [], minuta: [] } : { asistencia: [], pagos: [], comunicaciones: [], minuta: [] }
  const asistenciaReciente = info.asistencia.slice(0, 5)
  const pendientes = info.pagos.filter((m) => m.estado !== 'pagado').length

  async function crearComunicacion(e) {
    e.preventDefault()
    if (!alumnoSeleccionado) return
    setGuardandoComunicacion(true)
    setError('')
    try {
      await api.post(`/portal/mis-alumnos/${alumnoSeleccionado.id_alumno}/comunicaciones`, formComunicacion)
      setFormComunicacion({ asunto: '', mensaje: '' })
      setNuevaComunicacion(false)
      await cargarComunicacionesAlumno(alumnoSeleccionado.id_alumno)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la comunicación'))
    } finally {
      setGuardandoComunicacion(false)
    }
  }

  async function responderComunicacion(e, comunicacion) {
    e.preventDefault()
    if (!alumnoSeleccionado) return
    setGuardandoComunicacion(true)
    setError('')
    try {
      await api.post(`/portal/comunicaciones/${comunicacion.id_comunicacion}/mensajes`, { mensaje: respuestas[comunicacion.id_comunicacion] || '' })
      setRespuestas((prev) => ({ ...prev, [comunicacion.id_comunicacion]: '' }))
      await cargarComunicacionesAlumno(alumnoSeleccionado.id_alumno)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo enviar el mensaje'))
    } finally {
      setGuardandoComunicacion(false)
    }
  }

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
          <p style={styles.text}>Revisa solo la información de los estudiantes vinculados a tu cuenta.</p>
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

        {!loading && !error && alumnoSeleccionado && (
          <section style={styles.portalCard}>
            <div style={styles.studentHeader}>
              <div style={styles.cardHeader}>
                <span style={styles.avatar}>{alumnoSeleccionado.nombres.charAt(0)}{alumnoSeleccionado.apellidos.charAt(0)}</span>
                <div>
                  <h2 style={styles.cardTitle}>{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</h2>
                  <p style={styles.meta}>RUT {alumnoSeleccionado.rut}</p>
                  <p style={styles.meta}>Curso: {alumnoSeleccionado.curso || 'Sin curso asignado'}</p>
                </div>
              </div>

              {alumnos.length > 1 && (
                <div style={styles.selectorWrap}>
                  <label htmlFor="portal-alumno" style={styles.label}>Estudiante</label>
                  <select id="portal-alumno" value={selectedAlumnoId} onChange={(e) => { setSelectedAlumnoId(e.target.value); setActiveTab('resumen') }} style={styles.select}>
                    {alumnos.map((alumno) => (
                      <option key={alumno.id_alumno} value={alumno.id_alumno}>{alumno.nombres} {alumno.apellidos}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={styles.tabs}>
              {TABS.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={activeTab === tab.key ? styles.tabActive : styles.tab}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'resumen' && (
              <div style={styles.grid}>
                <ResumenCard title="Curso" value={alumnoSeleccionado.curso || 'Sin curso asignado'} />
                <ResumenCard title="Asistencia reciente" value={asistenciaReciente[0] ? `${asistenciaReciente[0].fecha} · ${ESTADO_ASISTENCIA[asistenciaReciente[0].estado] || asistenciaReciente[0].estado}` : 'Sin registros'} />
                <ResumenCard title="Pagos pendientes" value={pendientes === 0 ? 'Sin pendientes' : `${pendientes} pendiente(s)`} />
              </div>
            )}

            {activeTab === 'info' && (
              <div style={styles.sectionGrid}>
                <InfoLine label="Nombre" value={`${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}`} />
                <InfoLine label="RUT" value={alumnoSeleccionado.rut} />
                <InfoLine label="Fecha de nacimiento" value={alumnoSeleccionado.fecha_nacimiento} />
                <InfoLine label="Estado" value={alumnoSeleccionado.estado} />
                <InfoLine label="Curso" value={alumnoSeleccionado.curso || 'Sin curso asignado'} />
                <InfoLine label="Alergias" value={alumnoSeleccionado.alergias || 'Sin registro'} />
                <InfoLine label="Medicamentos" value={alumnoSeleccionado.medicamentos || 'Sin registro'} />
                <InfoLine label="Observaciones" value={alumnoSeleccionado.observaciones || 'Sin observaciones'} />
              </div>
            )}

            {activeTab === 'asistencia' && (
              <div style={styles.section}>
                {info.asistencia.length === 0 && <p style={styles.meta}>Sin registros de asistencia.</p>}
                {info.asistencia.map((registro) => (
                  <div key={registro.id_asistencia} style={styles.rowLine}>
                    <span>{registro.fecha}</span>
                    <strong>{ESTADO_ASISTENCIA[registro.estado] || registro.estado}</strong>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pagos' && (
              <div style={styles.section}>
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
            )}

            {activeTab === 'comunicaciones' && (
              <div style={styles.section}>
                <div style={styles.commHeader}>
                  <div>
                    <h3 style={styles.sectionTitle}>Comunicaciones</h3>
                    <p style={styles.meta}>Conversaciones asociadas a este estudiante.</p>
                  </div>
                  <button style={styles.primaryBtn} onClick={() => setNuevaComunicacion((actual) => !actual)}>
                    {nuevaComunicacion ? 'Cerrar formulario' : '+ Nueva comunicación'}
                  </button>
                </div>

                {nuevaComunicacion && (
                  <form onSubmit={crearComunicacion} style={styles.commForm}>
                    <label style={styles.label} htmlFor="portal-com-asunto">Asunto</label>
                    <input id="portal-com-asunto" value={formComunicacion.asunto} onChange={(e) => setFormComunicacion({ ...formComunicacion, asunto: e.target.value })} required style={styles.input} />
                    <label style={styles.label} htmlFor="portal-com-mensaje">Mensaje</label>
                    <textarea id="portal-com-mensaje" value={formComunicacion.mensaje} onChange={(e) => setFormComunicacion({ ...formComunicacion, mensaje: e.target.value })} required rows={4} style={styles.textarea} />
                    <button type="submit" disabled={guardandoComunicacion} style={styles.primaryBtn}>{guardandoComunicacion ? 'Enviando...' : 'Enviar comunicación'}</button>
                  </form>
                )}

                {info.comunicaciones.length === 0 && <p style={styles.meta}>Aún no existen comunicaciones registradas para este estudiante.</p>}
                {info.comunicaciones.map((comunicacion) => (
                  <article key={comunicacion.id_comunicacion} style={styles.thread}>
                    <div style={styles.threadTitleRow}>
                      <div>
                        <h4 style={styles.threadTitle}>{comunicacion.asunto}</h4>
                        <p style={styles.meta}>Actualizada el {new Date(comunicacion.fecha_actualizacion || comunicacion.fecha_creacion).toLocaleDateString('es-CL')}</p>
                      </div>
                      <span style={styles.commBadge(comunicacion.estado)}>{ESTADO_COMUNICACION[comunicacion.estado] || comunicacion.estado}</span>
                    </div>
                    <div style={styles.messages}>
                      {comunicacion.mensajes.map((mensaje) => (
                        <div key={mensaje.id_mensaje} style={mensaje.rol_autor === 'apoderado' ? styles.messageOwn : styles.messageStaff}>
                          <strong>{mensaje.rol_autor === 'apoderado' ? 'Familia' : mensaje.autor}</strong>
                          <p style={styles.messageText}>{mensaje.mensaje}</p>
                          <span style={styles.meta}>{new Date(mensaje.fecha_envio).toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                    {comunicacion.estado !== 'cerrada' && (
                      <form onSubmit={(e) => responderComunicacion(e, comunicacion)} style={styles.replyForm}>
                        <textarea value={respuestas[comunicacion.id_comunicacion] || ''} onChange={(e) => setRespuestas({ ...respuestas, [comunicacion.id_comunicacion]: e.target.value })} required rows={3} placeholder="Escribe una respuesta..." style={styles.textarea} />
                        <button type="submit" disabled={guardandoComunicacion} style={styles.actionBtn}>Responder</button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            )}

            {activeTab === 'minuta' && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Minuta semanal</h3>
                <p style={styles.meta}>Menú informado para el curso del estudiante.</p>
                <div style={styles.menuGrid}>
                  {DIAS_MINUTA.map((dia) => {
                    const minuta = info.minuta.find((item) => item.dia_semana === dia.id)
                    return (
                      <article key={dia.id} style={styles.menuCard}>
                        <h4 style={styles.threadTitle}>{dia.label}</h4>
                        <MenuLine label="Desayuno" value={minuta?.desayuno} />
                        <MenuLine label="Almuerzo" value={minuta?.almuerzo} />
                        <MenuLine label="Colación" value={minuta?.colacion} />
                        {minuta?.observaciones && <MenuLine label="Observaciones" value={minuta.observaciones} />}
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function ResumenCard({ title, value }) {
  return (
    <div style={styles.summaryCard}>
      <span style={styles.summaryTitle}>{title}</span>
      <strong style={styles.summaryValue}>{value}</strong>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div style={styles.infoLine}>
      <span style={styles.summaryTitle}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  )
}

function MenuLine({ label, value }) {
  return (
    <div style={styles.menuLine}>
      <span>{label}</span>
      <strong>{value || 'Sin registro'}</strong>
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
  portalCard: { background: colors.cardBg, borderRadius: '16px', boxShadow: shadows.card, border: `1px solid ${colors.border}`, padding: '1.25rem' },
  studentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: colors.primaryLight, color: colors.primaryDark, fontWeight: '900' },
  cardTitle: { color: colors.primaryDark, margin: '0 0 0.35rem', fontSize: '1.15rem' },
  meta: { display: 'block', color: colors.textMuted, fontSize: '0.85rem', margin: '0.2rem 0', lineHeight: 1.45 },
  selectorWrap: { minWidth: '240px' },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '600' },
  select: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', background: '#fff', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap', borderTop: `1px solid ${colors.border}`, paddingTop: '1rem', marginBottom: '1rem' },
  tab: { background: '#fff', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.5rem 0.8rem', borderRadius: '999px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  tabActive: { background: colors.primaryLight, border: `1px solid ${colors.primary}`, color: colors.primaryDark, padding: '0.5rem 0.8rem', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  summaryCard: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1rem' },
  summaryTitle: { display: 'block', color: colors.textMuted, fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: '700' },
  summaryValue: { color: colors.primaryDark, fontSize: '0.95rem' },
  sectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.8rem' },
  infoLine: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.8rem' },
  infoValue: { color: colors.textDark, fontSize: '0.9rem' },
  section: { borderTop: `1px solid ${colors.border}`, paddingTop: '0.9rem', marginTop: '0.9rem' },
  sectionTitle: { color: colors.primaryDark, margin: '0 0 0.6rem', fontSize: '0.98rem' },
  rowLine: { display: 'flex', justifyContent: 'space-between', gap: '1rem', color: colors.textDark, fontSize: '0.88rem', padding: '0.55rem 0', borderBottom: `1px solid ${colors.border}` },
  paymentBox: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.7rem', marginBottom: '0.6rem' },
  emptyTab: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1.2rem' },
  primaryBtn: { background: colors.primary, color: '#fff', border: `1px solid ${colors.primary}`, padding: '0.55rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  actionBtn: { background: '#fff', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '0.5rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  input: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', background: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '0.8rem' },
  textarea: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', background: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  commHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  commForm: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  thread: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', marginBottom: '1rem' },
  threadTitleRow: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.8rem', marginBottom: '0.8rem' },
  threadTitle: { color: colors.primaryDark, margin: '0 0 0.25rem', fontSize: '1rem' },
  commBadge: (estado) => ({
    background: estado === 'cerrada' ? '#eceff1' : estado === 'respondida' ? '#e8f7ef' : colors.primaryLight,
    color: estado === 'cerrada' ? colors.textMuted : estado === 'respondida' ? colors.success : colors.primaryDark,
    padding: '0.25rem 0.65rem', borderRadius: '999px', fontWeight: '800', fontSize: '0.78rem',
  }),
  messages: { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  messageOwn: { alignSelf: 'flex-end', maxWidth: '82%', background: colors.primaryLight, color: colors.textDark, borderRadius: '12px 12px 2px 12px', padding: '0.7rem', border: `1px solid ${colors.border}` },
  messageStaff: { alignSelf: 'flex-start', maxWidth: '82%', background: '#f8fbff', color: colors.textDark, borderRadius: '12px 12px 12px 2px', padding: '0.7rem', border: `1px solid ${colors.border}` },
  messageText: { margin: '0.35rem 0', color: colors.textDark, lineHeight: 1.45, fontSize: '0.9rem' },
  replyForm: { display: 'flex', gap: '0.6rem', alignItems: 'flex-end', marginTop: '0.9rem', flexWrap: 'wrap' },
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginTop: '1rem' },
  menuCard: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '0.85rem' },
  menuLine: { display: 'flex', flexDirection: 'column', gap: '0.2rem', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '9px', padding: '0.55rem', marginBottom: '0.45rem', color: colors.textMuted, fontSize: '0.8rem' },
}
