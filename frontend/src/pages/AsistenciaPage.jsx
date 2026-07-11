import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const ESTADOS = ['presente', 'ausente', 'atraso', 'retiro_anticipado']
const ETIQUETA_ESTADO = {
  presente: 'Presente',
  ausente: 'Ausente',
  atraso: 'Atraso',
  retiro_anticipado: 'Retiro anticipado',
  justificado: 'Justificado',
}

function hoy() { return new Date().toISOString().slice(0, 10) }
function mesActual() { return new Date().toISOString().slice(0, 7) }

function limpiarParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))
}

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(hoy())
  const [mes, setMes] = useState(mesActual())
  const [idCurso, setIdCurso] = useState('')
  const [registros, setRegistros] = useState([])
  const [resumenRegistros, setResumenRegistros] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({ id_alumno: '', estado: 'presente', observacion: '' })
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    Promise.all([
      api.get('/asistencia/', { params: limpiarParams({ fecha, id_curso: idCurso }) }),
      api.get('/asistencia/', { params: limpiarParams({ mes, id_curso: idCurso }) }),
    ])
      .then(([diaRes, mesRes]) => {
        setRegistros(diaRes.data)
        setResumenRegistros(mesRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([api.get('/alumnos/'), api.get('/cursos/')]).then(([alumnosRes, cursosRes]) => {
      setAlumnos(alumnosRes.data)
      setCursos(cursosRes.data)
    })
  }, [])

  useEffect(() => { cargar() }, [fecha, mes, idCurso])

  const alumnosFiltrados = alumnos.filter((alumno) => !idCurso || alumno.id_curso === Number(idCurso))
  const total = resumenRegistros.length
  const presentes = resumenRegistros.filter((registro) => registro.estado === 'presente').length
  const ausentes = resumenRegistros.filter((registro) => registro.estado === 'ausente').length
  const atrasados = resumenRegistros.filter((registro) => registro.estado === 'atraso').length
  const justificados = resumenRegistros.filter((registro) => registro.estado === 'justificado').length
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0

  function nombreAlumno(id) {
    const alumno = alumnos.find((x) => x.id_alumno === id)
    return alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Alumno sin nombre disponible'
  }

  function porcentajeAlumno(alumno) {
    const registrosAlumno = resumenRegistros.filter((registro) => registro.id_alumno === alumno.id_alumno)
    if (registrosAlumno.length === 0) return 'Sin registros'
    const presentesAlumno = registrosAlumno.filter((registro) => registro.estado === 'presente').length
    return `${Math.round((presentesAlumno / registrosAlumno.length) * 100)}% asistencia`
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/asistencia/', { ...form, id_alumno: Number(form.id_alumno), fecha })
      setAbierto(false)
      setForm({ id_alumno: '', estado: 'presente', observacion: '' })
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo registrar la asistencia')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(registro) {
    if (!confirm('¿Eliminar este registro de asistencia?')) return
    await api.delete(`/asistencia/${registro.id_asistencia}`)
    cargar()
  }

  return (
    <PanelLayout title="📅 Asistencia">
      <div style={styles.toolbar}>
        <div style={styles.field}>
          <label htmlFor="asistencia-curso" style={styles.label}>Curso</label>
          <select id="asistencia-curso" value={idCurso} onChange={(e) => setIdCurso(e.target.value)} style={styles.input}>
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => <option key={curso.id_curso} value={curso.id_curso}>{curso.nombre}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label htmlFor="asistencia-fecha" style={styles.label}>Día</label>
          <input id="asistencia-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label htmlFor="asistencia-mes" style={styles.label}>Mes resumen</label>
          <input id="asistencia-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={styles.input} />
        </div>
        <button style={styles.newBtn} onClick={() => setAbierto(true)}>+ Registrar asistencia</button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Presentes" value={presentes} />
        <StatCard label="Ausentes" value={ausentes} />
        <StatCard label="Atrasados" value={atrasados} />
        <StatCard label="Justificados" value={justificados} />
        <StatCard label="Asistencia general" value={`${porcentaje}%`} />
      </div>

      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Alumnos del curso</h2>
            <p style={styles.help}>{idCurso ? 'Resumen mensual por alumno.' : 'Selecciona un curso para revisar un grupo específico.'}</p>
          </div>
        </div>
        <div style={styles.studentGrid}>
          {alumnosFiltrados.length === 0 && <p style={styles.help}>No hay alumnos para este filtro.</p>}
          {alumnosFiltrados.map((alumno) => (
            <div key={alumno.id_alumno} style={styles.studentCard}>
              <strong>{alumno.nombres} {alumno.apellidos}</strong>
              <span>{porcentajeAlumno(alumno)}</span>
            </div>
          ))}
        </div>
      </section>

      {loading ? <p>Cargando registros...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Alumno</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Observación</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 && (
                <tr><td style={styles.td} colSpan={4}>Sin registros para esta fecha.</td></tr>
              )}
              {registros.map((registro) => (
                <tr key={registro.id_asistencia}>
                  <td style={styles.td}>{nombreAlumno(registro.id_alumno)}</td>
                  <td style={styles.td}><span style={styles.badge(registro.estado)}>{ETIQUETA_ESTADO[registro.estado] ?? registro.estado}</span></td>
                  <td style={styles.td}>{registro.observacion ?? 'Sin observación'}</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtnDanger} onClick={() => eliminar(registro)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abierto && (
        <Modal title="Registrar asistencia" onClose={() => setAbierto(false)}>
          <form onSubmit={guardar}>
            <div style={styles.fieldModal}>
              <label htmlFor="asistencia-alumno" style={styles.label}>Alumno</label>
              <select id="asistencia-alumno" value={form.id_alumno} onChange={(e) => setForm({ ...form, id_alumno: e.target.value })} required style={styles.input}>
                <option value="" disabled>Selecciona un alumno</option>
                {alumnosFiltrados.map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>{alumno.nombres} {alumno.apellidos}</option>
                ))}
              </select>
            </div>
            <div style={styles.fieldModal}>
              <label htmlFor="asistencia-estado" style={styles.label}>Estado</label>
              <select id="asistencia-estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} style={styles.input}>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>)}
              </select>
            </div>
            <div style={styles.fieldModal}>
              <label htmlFor="asistencia-observacion" style={styles.label}>Observación (opcional)</label>
              <input id="asistencia-observacion" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} style={styles.input} />
            </div>
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const styles = {
  toolbar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end', gap: '1rem', marginBottom: '1.25rem', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', height: '42px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1rem' },
  statCard: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card, display: 'flex', flexDirection: 'column', gap: '0.35rem', color: colors.textMuted, fontSize: '0.85rem' },
  sectionCard: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card, marginBottom: '1rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' },
  sectionTitle: { margin: '0 0 0.25rem', color: colors.primaryDark, fontSize: '1.1rem' },
  help: { color: colors.textMuted, fontSize: '0.86rem', margin: 0, lineHeight: 1.45 },
  studentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.7rem' },
  studentCard: { display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.75rem', color: colors.textMuted, fontSize: '0.84rem' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '680px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
  badge: (estado) => ({
    background: estado === 'presente' ? '#e8f7ef' : estado === 'ausente' ? colors.dangerLight : colors.primaryLight,
    color: estado === 'presente' ? colors.success : estado === 'ausente' ? colors.danger : colors.primaryDark,
    padding: '0.22rem 0.6rem', borderRadius: '999px', fontWeight: '800', fontSize: '0.78rem',
  }),
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  field: { minWidth: 0 },
  fieldModal: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
