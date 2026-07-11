import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const DIAS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
]

const FORM = { desayuno: '', almuerzo: '', colacion: '', observaciones: '' }

function lunesActual() {
  const fecha = new Date()
  const dia = fecha.getDay() || 7
  fecha.setDate(fecha.getDate() - dia + 1)
  return fecha.toISOString().slice(0, 10)
}

function mensajeError(err, fallback) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || fallback
}

export default function MinutasPage() {
  const [cursos, setCursos] = useState([])
  const [idCurso, setIdCurso] = useState('')
  const [semanaInicio, setSemanaInicio] = useState(lunesActual())
  const [minutas, setMinutas] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM)
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  function cargar() {
    if (!idCurso) {
      setMinutas([])
      return
    }
    setLoading(true)
    api.get('/minutas', { params: { id_curso: idCurso, semana_inicio: semanaInicio } })
      .then((res) => setMinutas(res.data))
      .catch((err) => setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo cargar la minuta') }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/cursos/').then((res) => {
      setCursos(res.data)
      if (res.data.length > 0) setIdCurso(String(res.data[0].id_curso))
    })
  }, [])

  useEffect(() => { cargar() }, [idCurso, semanaInicio])

  function abrir(dia, minuta) {
    setEditando({ dia, minuta })
    setForm(minuta ? {
      desayuno: minuta.desayuno || '',
      almuerzo: minuta.almuerzo || '',
      colacion: minuta.colacion || '',
      observaciones: minuta.observaciones || '',
    } : FORM)
    setMensaje(null)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    const payload = {
      id_curso: Number(idCurso),
      semana_inicio: semanaInicio,
      dia_semana: editando.dia.id,
      desayuno: form.desayuno || null,
      almuerzo: form.almuerzo || null,
      colacion: form.colacion || null,
      observaciones: form.observaciones || null,
    }
    try {
      if (editando.minuta?.id_minuta) await api.put(`/minutas/${editando.minuta.id_minuta}`, payload)
      else await api.post('/minutas', payload)
      setEditando(null)
      setMensaje({ tipo: 'ok', texto: 'Minuta guardada correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo guardar la minuta') })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(minuta) {
    if (!confirm('¿Eliminar la minuta de este día?')) return
    try {
      await api.delete(`/minutas/${minuta.id_minuta}`)
      setMensaje({ tipo: 'ok', texto: 'Minuta eliminada correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo eliminar la minuta') })
    }
  }

  return (
    <PanelLayout title="Minuta semanal">
      <div style={styles.toolbar}>
        <div style={styles.field}>
          <label htmlFor="minuta-curso" style={styles.label}>Curso</label>
          <select id="minuta-curso" value={idCurso} onChange={(e) => setIdCurso(e.target.value)} style={styles.input}>
            {cursos.map((curso) => <option key={curso.id_curso} value={curso.id_curso}>{curso.nombre}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label htmlFor="minuta-semana" style={styles.label}>Semana desde lunes</label>
          <input id="minuta-semana" type="date" value={semanaInicio} onChange={(e) => setSemanaInicio(e.target.value)} style={styles.input} />
        </div>
      </div>

      {mensaje && <p style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>{mensaje.texto}</p>}
      {loading && <p>Cargando minuta...</p>}

      <div style={styles.grid}>
        {DIAS.map((dia) => {
          const minuta = minutas.find((item) => item.dia_semana === dia.id)
          return (
            <article key={dia.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>{dia.label}</h2>
                <button style={styles.actionBtn} onClick={() => abrir(dia, minuta)}>{minuta ? 'Editar' : 'Agregar'}</button>
              </div>
              <Info label="Desayuno" value={minuta?.desayuno} />
              <Info label="Almuerzo" value={minuta?.almuerzo} />
              <Info label="Colación" value={minuta?.colacion} />
              <Info label="Observaciones" value={minuta?.observaciones} />
              {minuta && <button style={styles.deleteBtn} onClick={() => eliminar(minuta)}>Eliminar</button>}
            </article>
          )
        })}
      </div>

      {editando && (
        <Modal title={`${editando.minuta ? 'Editar' : 'Agregar'} minuta - ${editando.dia.label}`} onClose={() => setEditando(null)} width="520px">
          <form onSubmit={guardar}>
            <Campo label="Desayuno" value={form.desayuno} onChange={(v) => setForm({ ...form, desayuno: v })} />
            <Campo label="Almuerzo" value={form.almuerzo} onChange={(v) => setForm({ ...form, almuerzo: v })} />
            <Campo label="Colación" value={form.colacion} onChange={(v) => setForm({ ...form, colacion: v })} />
            <Campo label="Observaciones" value={form.observaciones} onChange={(v) => setForm({ ...form, observaciones: v })} />
            <button type="submit" disabled={guardando || !idCurso} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar minuta'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Info({ label, value }) {
  return (
    <div style={styles.infoLine}>
      <span>{label}</span>
      <strong>{value || 'Sin registro'}</strong>
    </div>
  )
}

function Campo({ label, value, onChange }) {
  const id = `minuta-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.fieldModal}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={2} style={styles.textarea} />
    </div>
  )
}

const styles = {
  toolbar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card, marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' },
  card: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '1rem', boxShadow: shadows.card },
  cardHeader: { display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'center', marginBottom: '0.8rem' },
  cardTitle: { margin: 0, color: colors.primaryDark, fontSize: '1.1rem' },
  infoLine: { display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.65rem', marginBottom: '0.55rem', color: colors.textMuted, fontSize: '0.82rem' },
  actionBtn: { background: '#fff', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  deleteBtn: { background: 'none', color: colors.danger, border: `1px solid ${colors.danger}`, padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', width: '100%', marginTop: '0.4rem' },
  field: { minWidth: 0 },
  fieldModal: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '700' },
  input: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' },
  textarea: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff', resize: 'vertical', fontFamily: 'inherit' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  ok: { color: colors.success, background: '#e8f7ef', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bfe8d1' },
  error: { color: colors.danger, background: colors.dangerLight, padding: '0.75rem 1rem', borderRadius: '10px', border: `1px solid ${colors.dangerLight}` },
}
