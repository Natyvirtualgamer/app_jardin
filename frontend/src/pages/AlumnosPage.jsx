// pages/AlumnosPage.jsx — Antes era SOLO LECTURA (un GET y una tabla).
// Ahora agrega crear / editar / dar de baja, usando los endpoints que el
// backend ya tenia listos en routers/alumnos.py (POST, PUT, DELETE).
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const VACIO = {
  nombres: '', apellidos: '', rut: '', fecha_nacimiento: '',
  id_institucion: 1, id_curso: '', alergias: '', medicamentos: '', observaciones: '',
}

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState([])
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null) // null = cerrado, {} = nuevo, {...} = editar
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  function cargarAlumnos() {
    setLoading(true)
    Promise.all([api.get('/alumnos/'), api.get('/cursos/')])
      .then(([alumnosRes, cursosRes]) => {
        setAlumnos(alumnosRes.data)
        setCursos(cursosRes.data)
      })
      .catch(() => setError('Error al cargar alumnos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarAlumnos() }, [])

  function abrirNuevo() {
    setForm({ ...VACIO })
    setEditando({})
  }

  function abrirEditar(alumno) {
    setForm({
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      rut: alumno.rut,
      fecha_nacimiento: alumno.fecha_nacimiento,
      id_institucion: alumno.id_institucion ?? 1,
      id_curso: alumno.id_curso ?? '',
      alergias: alumno.alergias ?? '',
      medicamentos: alumno.medicamentos ?? '',
      observaciones: alumno.observaciones ?? '',
    })
    setEditando(alumno)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      ...form,
      id_curso: form.id_curso === '' ? null : Number(form.id_curso),
      id_institucion: Number(form.id_institucion),
    }
    try {
      if (editando?.id_alumno) {
        await api.put(`/alumnos/${editando.id_alumno}`, payload)
      } else {
        await api.post('/alumnos/', payload)
      }
      setEditando(null)
      cargarAlumnos()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo guardar el alumno')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(alumno) {
    if (!confirm(`¿Dar de baja a ${alumno.nombres} ${alumno.apellidos}?`)) return
    await api.delete(`/alumnos/${alumno.id_alumno}`)
    cargarAlumnos()
  }

  function nombreCurso(idCurso) {
    const curso = cursos.find((c) => c.id_curso === idCurso)
    return curso ? curso.nombre : 'Sin curso asignado'
  }

  return (
    <PanelLayout title="👧 Alumnos">
      <div style={styles.toolbar}>
        <button style={styles.newBtn} onClick={abrirNuevo}>+ Nuevo alumno</button>
      </div>

      {loading && <p>Cargando alumnos...</p>}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>RUT</th>
                <th style={styles.th}>Nombres</th>
                <th style={styles.th}>Apellidos</th>
                <th style={styles.th}>Curso</th>
                <th style={styles.th}>Nacimiento</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.length === 0 && (
                <tr><td style={styles.td} colSpan={7}>Sin alumnos registrados todavía.</td></tr>
              )}
              {alumnos.map((a) => (
                <tr key={a.id_alumno}>
                  <td style={styles.td}>{a.rut}</td>
                  <td style={styles.td}>{a.nombres}</td>
                  <td style={styles.td}>{a.apellidos}</td>
                  <td style={styles.td}>{nombreCurso(a.id_curso)}</td>
                  <td style={styles.td}>{a.fecha_nacimiento}</td>
                  <td style={styles.td}>
                    <span style={a.estado === 'activo' ? styles.badgeOk : styles.badgeOff}>{a.estado}</span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.actionBtn} onClick={() => abrirEditar(a)}>Editar</button>
                    <button style={styles.actionBtnDanger} onClick={() => eliminar(a)}>Dar de baja</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando !== null && (
        <Modal title={editando?.id_alumno ? 'Editar alumno' : 'Nuevo alumno'} onClose={() => setEditando(null)} width="520px">
          <form onSubmit={guardar}>
            <div style={styles.formRow}>
              <Campo label="Nombres" value={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} required />
              <Campo label="Apellidos" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} required />
            </div>
            <div style={styles.formRow}>
              <Campo label="RUT" value={form.rut} onChange={(v) => setForm({ ...form, rut: v })} required placeholder="11111111-1" />
              <Campo label="Fecha nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => setForm({ ...form, fecha_nacimiento: v })} required />
            </div>
            <div style={styles.formRow}>
              <SelectCurso
                value={form.id_curso}
                cursos={cursos}
                onChange={(v) => setForm({ ...form, id_curso: v })}
              />
            </div>
            <Campo label="Alergias" value={form.alergias} onChange={(v) => setForm({ ...form, alergias: v })} />
            <Campo label="Medicamentos" value={form.medicamentos} onChange={(v) => setForm({ ...form, medicamentos: v })} />
            <Campo label="Observaciones" value={form.observaciones} onChange={(v) => setForm({ ...form, observaciones: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required, placeholder }) {
  const id = `alumno-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  )
}

function SelectCurso({ value, cursos, onChange }) {
  return (
    <div style={styles.field}>
      <label htmlFor="alumno-curso" style={styles.label}>Curso</label>
      <select
        id="alumno-curso"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      >
        <option value="">Sin curso asignado</option>
        {cursos.map((curso) => (
          <option key={curso.id_curso} value={curso.id_curso}>
            {curso.nombre}{curso.nivel ? ` - ${curso.nivel}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

const styles = {
  toolbar: { marginBottom: '1.25rem' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
  badgeOk: { background: colors.primaryLight, color: colors.primaryDark, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  badgeOff: { background: '#eceff1', color: colors.textMuted, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  actionBtn: { marginRight: '0.5rem', background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  formRow: { display: 'flex', gap: '1rem' },
  field: { marginBottom: '0.9rem', flex: 1 },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
