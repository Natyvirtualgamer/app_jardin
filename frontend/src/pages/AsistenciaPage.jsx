// pages/AsistenciaPage.jsx — Antes la tarjeta "Asistencia hoy" del dashboard
// no tenia ruta propia y el backend devolvia {"items": []} fijo.
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const ESTADOS = ['presente', 'ausente', 'atraso', 'retiro_anticipado']
const ETIQUETA_ESTADO = {
  presente: 'Presente', ausente: 'Ausente', atraso: 'Atraso', retiro_anticipado: 'Retiro anticipado',
}

function hoy() { return new Date().toISOString().slice(0, 10) }

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(hoy())
  const [registros, setRegistros] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({ id_alumno: '', estado: 'presente', observacion: '' })
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    api.get('/asistencia/', { params: { fecha } })
      .then((res) => setRegistros(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/alumnos/').then((res) => setAlumnos(res.data))
  }, [])

  useEffect(() => { cargar() }, [fecha])

  function nombreAlumno(id) {
    const a = alumnos.find((x) => x.id_alumno === id)
    return a ? `${a.nombres} ${a.apellidos}` : `Alumno #${id}`
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

  async function eliminar(r) {
    if (!confirm('¿Eliminar este registro de asistencia?')) return
    await api.delete(`/asistencia/${r.id_asistencia}`)
    cargar()
  }

  return (
    <PanelLayout title="📅 Asistencia">
      <div style={styles.toolbar}>
        <div style={styles.field}>
          <label style={styles.label}>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} />
        </div>
        <button style={styles.newBtn} onClick={() => setAbierto(true)}>+ Registrar asistencia</button>
      </div>

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
              {registros.map((r) => (
                <tr key={r.id_asistencia}>
                  <td style={styles.td}>{nombreAlumno(r.id_alumno)}</td>
                  <td style={styles.td}>{ETIQUETA_ESTADO[r.estado] ?? r.estado}</td>
                  <td style={styles.td}>{r.observacion ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtnDanger} onClick={() => eliminar(r)}>Eliminar</button>
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
            <div style={styles.field}>
              <label style={styles.label}>Alumno</label>
              <select
                value={form.id_alumno}
                onChange={(e) => setForm({ ...form, id_alumno: e.target.value })}
                required
                style={styles.input}
              >
                <option value="" disabled>Selecciona un alumno</option>
                {alumnos.map((a) => (
                  <option key={a.id_alumno} value={a.id_alumno}>{a.nombres} {a.apellidos}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                style={styles.input}
              >
                {ESTADOS.map((s) => <option key={s} value={s}>{ETIQUETA_ESTADO[s]}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Observación (opcional)</label>
              <input
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                style={styles.input}
              />
            </div>
            <button type="submit" disabled={guardando} style={styles.saveBtn}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

const styles = {
  toolbar: { display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1.25rem' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', height: '42px' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  field: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
