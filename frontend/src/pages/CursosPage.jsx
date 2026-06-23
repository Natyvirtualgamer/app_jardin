// pages/CursosPage.jsx — Antes la tarjeta "Cursos" del dashboard no tenia
// ruta (App.jsx no la definia) y el backend devolvia {"items": []} fijo.
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const VACIO = { id_institucion: 1, id_educadora: '', nombre: '', nivel: '', capacidad_max: 20, horario: '' }

export default function CursosPage() {
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    api.get('/cursos/')
      .then((res) => setCursos(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() { setForm({ ...VACIO }); setEditando({}) }
  function abrirEditar(c) {
    setForm({
      id_institucion: 1, id_educadora: '',
      nombre: c.nombre, nivel: c.nivel ?? '', capacidad_max: c.capacidad_max, horario: c.horario ?? '',
    })
    setEditando(c)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      ...form,
      id_institucion: Number(form.id_institucion),
      id_educadora: form.id_educadora === '' ? null : Number(form.id_educadora),
      capacidad_max: Number(form.capacidad_max),
    }
    try {
      if (editando?.id_curso) await api.put(`/cursos/${editando.id_curso}`, payload)
      else await api.post('/cursos/', payload)
      setEditando(null)
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo guardar el curso')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(c) {
    if (!confirm(`¿Desactivar el curso "${c.nombre}"?`)) return
    await api.delete(`/cursos/${c.id_curso}`)
    cargar()
  }

  return (
    <PanelLayout title="📚 Cursos">
      <div style={styles.toolbar}>
        <button style={styles.newBtn} onClick={abrirNuevo}>+ Nuevo curso</button>
      </div>

      {loading ? <p>Cargando cursos...</p> : (
        <div style={styles.grid}>
          {cursos.length === 0 && <p>Sin cursos registrados todavía.</p>}
          {cursos.map((c) => (
            <div key={c.id_curso} style={styles.card}>
              <h3 style={styles.cardTitle}>{c.nombre}</h3>
              <p style={styles.cardMeta}>{c.nivel ?? 'Nivel sin definir'} · Capacidad {c.capacidad_max}</p>
              <p style={styles.cardMeta}>Sin educadora asignada</p>
              <p style={styles.cardMeta}>{c.horario ?? 'Horario sin definir'}</p>
              <div style={styles.cardActions}>
                <button style={styles.actionBtn} onClick={() => abrirEditar(c)}>Editar</button>
                <button style={styles.actionBtnDanger} onClick={() => eliminar(c)}>Desactivar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando !== null && (
        <Modal title={editando?.id_curso ? 'Editar curso' : 'Nuevo curso'} onClose={() => setEditando(null)}>
          <form onSubmit={guardar}>
            <Campo label="Nombre del curso" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required placeholder="Sala Cuna Mayor A" />
            <Campo label="Nivel" value={form.nivel} onChange={(v) => setForm({ ...form, nivel: v })} placeholder="Sala cuna / Medio / Transición" />
            <Campo label="Capacidad máxima" type="number" value={form.capacidad_max} onChange={(v) => setForm({ ...form, capacidad_max: v })} required />
            <Campo label="Horario" value={form.horario} onChange={(v) => setForm({ ...form, horario: v })} placeholder="Lunes a viernes 08:30 - 16:30" />
            <SelectEducadora
              value={form.id_educadora}
              onChange={(v) => setForm({ ...form, id_educadora: v })}
            />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required, placeholder }) {
  const id = `curso-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} style={styles.input} />
    </div>
  )
}

function SelectEducadora({ value, onChange }) {
  return (
    <div style={styles.field}>
      <label htmlFor="curso-educadora" style={styles.label}>Educadora a cargo</label>
      <select
        id="curso-educadora"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      >
        <option value="">Sin educadora asignada</option>
      </select>
    </div>
  )
}

const styles = {
  toolbar: { marginBottom: '1.25rem' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' },
  card: { background: colors.cardBg, borderRadius: '12px', padding: '1.25rem', boxShadow: shadows.card },
  cardTitle: { margin: '0 0 0.4rem', color: colors.primaryDark },
  cardMeta: { margin: '0 0 0.3rem', color: colors.textMuted, fontSize: '0.85rem' },
  cardActions: { marginTop: '0.9rem', display: 'flex', gap: '0.5rem' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  field: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
