import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierta', label: 'Abierta' },
  { value: 'respondida', label: 'Respondida' },
  { value: 'cerrada', label: 'Cerrada' },
]

const ESTADO_LABEL = { abierta: 'Abierta', respondida: 'Respondida', cerrada: 'Cerrada' }
const FORM_NUEVA = { id_alumno: '', id_apoderado: '', asunto: '', mensaje: '' }

function limpiarParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))
}

function mensajeError(err, fallback) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || fallback
}

export default function ComunicacionesPage() {
  const { user } = useAuth()
  const [comunicaciones, setComunicaciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [cursos, setCursos] = useState([])
  const [apoderados, setApoderados] = useState([])
  const [filtros, setFiltros] = useState({ id_alumno: '', id_curso: '', id_apoderado: '', estado: '', fecha: '' })
  const [seleccionada, setSeleccionada] = useState(null)
  const [respuesta, setRespuesta] = useState('')
  const [modalNueva, setModalNueva] = useState(false)
  const [formNueva, setFormNueva] = useState(FORM_NUEVA)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const puedeGestionarApoderados = ['administrador', 'direccion', 'recepcion'].includes(user?.rol)

  function cargar() {
    setLoading(true)
    api.get('/comunicaciones', { params: limpiarParams(filtros) })
      .then((res) => {
        setComunicaciones(res.data)
        if (seleccionada) {
          const actualizada = res.data.find((item) => item.id_comunicacion === seleccionada.id_comunicacion)
          setSeleccionada(actualizada || null)
        }
      })
      .catch((err) => setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudieron cargar las comunicaciones') }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([
      api.get('/alumnos/').catch(() => ({ data: [] })),
      api.get('/cursos/').catch(() => ({ data: [] })),
      puedeGestionarApoderados ? api.get('/apoderados/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([alumnosRes, cursosRes, apoderadosRes]) => {
      setAlumnos(alumnosRes.data)
      setCursos(cursosRes.data)
      setApoderados(apoderadosRes.data)
    })
  }, [puedeGestionarApoderados])

  useEffect(() => { cargar() }, [filtros])

  function apoderadosDisponibles() {
    if (!formNueva.id_alumno) return apoderados
    const idAlumno = Number(formNueva.id_alumno)
    return apoderados.filter((apoderado) => (apoderado.alumnos || []).some((alumno) => alumno.id_alumno === idAlumno))
  }

  async function crearComunicacion(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await api.post('/comunicaciones', {
        ...formNueva,
        id_alumno: Number(formNueva.id_alumno),
        id_apoderado: Number(formNueva.id_apoderado),
      })
      setModalNueva(false)
      setFormNueva(FORM_NUEVA)
      setSeleccionada(res.data)
      setMensaje({ tipo: 'ok', texto: 'Comunicación creada correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo crear la comunicación') })
    } finally {
      setGuardando(false)
    }
  }

  async function responder(e) {
    e.preventDefault()
    if (!seleccionada) return
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await api.post(`/comunicaciones/${seleccionada.id_comunicacion}/mensajes`, { mensaje: respuesta })
      setRespuesta('')
      setSeleccionada(res.data)
      setMensaje({ tipo: 'ok', texto: 'Respuesta enviada correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo enviar la respuesta') })
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(estado) {
    if (!seleccionada) return
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await api.put(`/comunicaciones/${seleccionada.id_comunicacion}/estado`, { estado })
      setSeleccionada(res.data)
      setMensaje({ tipo: 'ok', texto: 'Estado actualizado correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo actualizar el estado') })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelLayout title="Comunicaciones">
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Buzón</p>
          <p style={styles.help}>Gestiona conversaciones asociadas a estudiantes y apoderados.</p>
        </div>
        {puedeGestionarApoderados && <button style={styles.primaryBtn} onClick={() => setModalNueva(true)}>+ Nueva comunicación</button>}
      </div>

      <div style={styles.toolbar}>
        <Select label="Curso" value={filtros.id_curso} onChange={(v) => setFiltros({ ...filtros, id_curso: v, id_alumno: '' })}>
          <option value="">Todos los cursos</option>
          {cursos.map((curso) => <option key={curso.id_curso} value={curso.id_curso}>{curso.nombre}</option>)}
        </Select>
        <Select label="Alumno" value={filtros.id_alumno} onChange={(v) => setFiltros({ ...filtros, id_alumno: v })}>
          <option value="">Todos los alumnos</option>
          {alumnos.filter((alumno) => !filtros.id_curso || alumno.id_curso === Number(filtros.id_curso)).map((alumno) => <option key={alumno.id_alumno} value={alumno.id_alumno}>{alumno.nombres} {alumno.apellidos}</option>)}
        </Select>
        {puedeGestionarApoderados && (
          <Select label="Apoderado" value={filtros.id_apoderado} onChange={(v) => setFiltros({ ...filtros, id_apoderado: v })}>
            <option value="">Todos los apoderados</option>
            {apoderados.map((apoderado) => <option key={apoderado.id_apoderado} value={apoderado.id_apoderado}>{apoderado.nombres} {apoderado.apellidos}</option>)}
          </Select>
        )}
        <Select label="Estado" value={filtros.estado} onChange={(v) => setFiltros({ ...filtros, estado: v })}>
          {ESTADOS.map((estado) => <option key={estado.value} value={estado.value}>{estado.label}</option>)}
        </Select>
        <Campo label="Fecha" type="date" value={filtros.fecha} onChange={(v) => setFiltros({ ...filtros, fecha: v })} />
      </div>

      {mensaje && <p style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>{mensaje.texto}</p>}

      <div style={styles.layout}>
        <section style={styles.listPanel}>
          {loading && <p>Cargando comunicaciones...</p>}
          {!loading && comunicaciones.length === 0 && <p style={styles.help}>Sin comunicaciones para los filtros seleccionados.</p>}
          {comunicaciones.map((comunicacion) => (
            <button key={comunicacion.id_comunicacion} style={seleccionada?.id_comunicacion === comunicacion.id_comunicacion ? styles.threadCardActive : styles.threadCard} onClick={() => setSeleccionada(comunicacion)}>
              <span style={styles.threadSubject}>{comunicacion.asunto}</span>
              <span style={styles.threadMeta}>{comunicacion.alumno} · {comunicacion.apoderado}</span>
              <span style={styles.threadMeta}>{new Date(comunicacion.fecha_actualizacion || comunicacion.fecha_creacion).toLocaleDateString('es-CL')}</span>
              <span style={styles.badge(comunicacion.estado)}>{ESTADO_LABEL[comunicacion.estado] || comunicacion.estado}</span>
            </button>
          ))}
        </section>

        <section style={styles.detailPanel}>
          {!seleccionada && <p style={styles.help}>Selecciona una conversación para ver el hilo.</p>}
          {seleccionada && (
            <>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={styles.detailTitle}>{seleccionada.asunto}</h2>
                  <p style={styles.help}>{seleccionada.alumno} · Apoderado: {seleccionada.apoderado}</p>
                </div>
                <span style={styles.badge(seleccionada.estado)}>{ESTADO_LABEL[seleccionada.estado] || seleccionada.estado}</span>
              </div>

              <div style={styles.stateActions}>
                <button disabled={guardando} style={styles.actionBtn} onClick={() => cambiarEstado('abierta')}>Reabrir</button>
                <button disabled={guardando} style={styles.actionBtn} onClick={() => cambiarEstado('cerrada')}>Cerrar</button>
              </div>

              <div style={styles.messages}>
                {seleccionada.mensajes.map((mensaje) => (
                  <div key={mensaje.id_mensaje} style={mensaje.rol_autor === 'apoderado' ? styles.messageFamily : styles.messageStaff}>
                    <strong>{mensaje.rol_autor === 'apoderado' ? 'Familia' : mensaje.autor}</strong>
                    <p style={styles.messageText}>{mensaje.mensaje}</p>
                    <span style={styles.threadMeta}>{new Date(mensaje.fecha_envio).toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>

              {seleccionada.estado !== 'cerrada' && (
                <form onSubmit={responder} style={styles.replyForm}>
                  <label htmlFor="comunicacion-respuesta" style={styles.label}>Responder</label>
                  <textarea id="comunicacion-respuesta" rows={4} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} required style={styles.textarea} />
                  <button type="submit" disabled={guardando} style={styles.primaryBtn}>{guardando ? 'Enviando...' : 'Enviar respuesta'}</button>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      {modalNueva && (
        <Modal title="Nueva comunicación" onClose={() => setModalNueva(false)} width="560px">
          <form onSubmit={crearComunicacion}>
            <Select label="Alumno" value={formNueva.id_alumno} onChange={(v) => setFormNueva({ ...formNueva, id_alumno: v, id_apoderado: '' })} required>
              <option value="">Selecciona un alumno</option>
              {alumnos.map((alumno) => <option key={alumno.id_alumno} value={alumno.id_alumno}>{alumno.nombres} {alumno.apellidos}</option>)}
            </Select>
            <Select label="Apoderado" value={formNueva.id_apoderado} onChange={(v) => setFormNueva({ ...formNueva, id_apoderado: v })} required>
              <option value="">Selecciona un apoderado</option>
              {apoderadosDisponibles().map((apoderado) => <option key={apoderado.id_apoderado} value={apoderado.id_apoderado}>{apoderado.nombres} {apoderado.apellidos}</option>)}
            </Select>
            <Campo label="Asunto" value={formNueva.asunto} onChange={(v) => setFormNueva({ ...formNueva, asunto: v })} required />
            <label htmlFor="comunicacion-mensaje" style={styles.label}>Mensaje</label>
            <textarea id="comunicacion-mensaje" rows={4} value={formNueva.mensaje} onChange={(e) => setFormNueva({ ...formNueva, mensaje: e.target.value })} required style={styles.textarea} />
            <button type="submit" disabled={guardando || !formNueva.id_alumno || !formNueva.id_apoderado} style={{ ...styles.primaryBtn, width: '100%', marginTop: '0.75rem' }}>{guardando ? 'Guardando...' : 'Crear comunicación'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required }) {
  const id = `comunicacion-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={styles.input} />
    </div>
  )
}

function Select({ label, value, onChange, children, required }) {
  const id = `comunicacion-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={styles.input}>{children}</select>
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  kicker: { margin: '0 0 0.25rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.75rem' },
  help: { color: colors.textMuted, fontSize: '0.88rem', lineHeight: 1.5, margin: 0 },
  toolbar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card, marginBottom: '1rem' },
  layout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' },
  listPanel: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '0.8rem', boxShadow: shadows.card },
  detailPanel: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card, minHeight: '360px' },
  threadCard: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', textAlign: 'left', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '0.8rem', marginBottom: '0.6rem', cursor: 'pointer' },
  threadCardActive: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', textAlign: 'left', background: colors.primaryLight, border: `1px solid ${colors.primary}`, borderRadius: '12px', padding: '0.8rem', marginBottom: '0.6rem', cursor: 'pointer' },
  threadSubject: { color: colors.primaryDark, fontWeight: '800' },
  threadMeta: { color: colors.textMuted, fontSize: '0.78rem', lineHeight: 1.4 },
  detailHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.8rem', marginBottom: '0.8rem', flexWrap: 'wrap' },
  detailTitle: { color: colors.primaryDark, fontSize: '1.25rem', margin: '0 0 0.3rem' },
  stateActions: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  messages: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  messageFamily: { alignSelf: 'flex-start', maxWidth: '82%', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '12px 12px 12px 2px', padding: '0.75rem' },
  messageStaff: { alignSelf: 'flex-end', maxWidth: '82%', background: colors.primaryLight, border: `1px solid ${colors.border}`, borderRadius: '12px 12px 2px 12px', padding: '0.75rem' },
  messageText: { margin: '0.35rem 0', color: colors.textDark, lineHeight: 1.45, fontSize: '0.9rem' },
  replyForm: { borderTop: `1px solid ${colors.border}`, marginTop: '1rem', paddingTop: '1rem' },
  field: { minWidth: 0 },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '700' },
  input: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' },
  textarea: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff', resize: 'vertical', fontFamily: 'inherit' },
  primaryBtn: { background: colors.primary, color: '#fff', border: `1px solid ${colors.primary}`, padding: '0.65rem 1rem', borderRadius: '9px', fontWeight: '800', cursor: 'pointer' },
  actionBtn: { background: '#fff', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  badge: (estado) => ({
    background: estado === 'cerrada' ? '#eceff1' : estado === 'respondida' ? '#e8f7ef' : colors.primaryLight,
    color: estado === 'cerrada' ? colors.textMuted : estado === 'respondida' ? colors.success : colors.primaryDark,
    padding: '0.22rem 0.6rem', borderRadius: '999px', fontWeight: '800', fontSize: '0.78rem',
  }),
  ok: { color: colors.success, background: '#e8f7ef', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bfe8d1' },
  error: { color: colors.danger, background: colors.dangerLight, padding: '0.75rem 1rem', borderRadius: '10px', border: `1px solid ${colors.dangerLight}` },
}
