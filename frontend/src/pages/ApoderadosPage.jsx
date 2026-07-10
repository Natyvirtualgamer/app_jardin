import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const VACIO = { nombres: '', apellidos: '', rut: '', email: '', telefono: '', direccion: '', parentesco: '' }

function mensajeError(err, fallback) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || fallback
}

export default function ApoderadosPage() {
  const [apoderados, setApoderados] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [vinculando, setVinculando] = useState(null)
  const [formVinculo, setFormVinculo] = useState({ id_alumno: '', es_principal: false, puede_retirar: false })
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    setError('')
    Promise.all([api.get('/apoderados/'), api.get('/alumnos/')])
      .then(([apoderadosRes, alumnosRes]) => {
        setApoderados(apoderadosRes.data)
        setAlumnos(alumnosRes.data)
      })
      .catch((err) => setError(mensajeError(err, 'Error al cargar apoderados')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtrados = apoderados.filter((a) => {
    const alumnosTexto = (a.alumnos || []).map((alumno) => `${alumno.nombres} ${alumno.apellidos} ${alumno.rut}`).join(' ')
    const texto = `${a.nombres} ${a.apellidos} ${a.email} ${a.rut} ${a.telefono || ''} ${alumnosTexto}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  function abrirNuevo() {
    setForm({ ...VACIO })
    setEditando({})
    setError('')
  }

  function abrirEditar(apoderado) {
    setForm({
      nombres: apoderado.nombres,
      apellidos: apoderado.apellidos,
      rut: apoderado.rut,
      email: apoderado.email,
      telefono: apoderado.telefono || '',
      direccion: apoderado.direccion || '',
      parentesco: apoderado.parentesco || '',
    })
    setEditando(apoderado)
    setError('')
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        ...form,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        parentesco: form.parentesco || null,
      }
      if (editando?.id_apoderado) await api.put(`/apoderados/${editando.id_apoderado}`, payload)
      else await api.post('/apoderados/', payload)
      setEditando(null)
      cargar()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el apoderado'))
    } finally {
      setGuardando(false)
    }
  }

  function abrirVincular(apoderado) {
    setVinculando(apoderado)
    setFormVinculo({ id_alumno: '', es_principal: false, puede_retirar: false })
    setError('')
  }

  async function vincularAlumno(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await api.post(`/apoderados/${vinculando.id_apoderado}/alumnos`, {
        id_alumno: Number(formVinculo.id_alumno),
        es_principal: formVinculo.es_principal,
        puede_retirar: formVinculo.puede_retirar,
      })
      setVinculando(null)
      cargar()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo vincular el alumno'))
    } finally {
      setGuardando(false)
    }
  }

  async function desvincular(apoderado, alumno) {
    if (!confirm(`¿Desvincular a ${alumno.nombres} ${alumno.apellidos} de ${apoderado.nombres} ${apoderado.apellidos}?`)) return
    setError('')
    try {
      await api.delete(`/apoderados/${apoderado.id_apoderado}/alumnos/${alumno.id_alumno}`)
      cargar()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo desvincular el alumno'))
    }
  }

  function alumnosDisponibles(apoderado) {
    const asociados = new Set((apoderado?.alumnos || []).map((alumno) => alumno.id_alumno))
    return alumnos.filter((alumno) => !asociados.has(alumno.id_alumno))
  }

  return (
    <PanelLayout title="Apoderados">
      <div style={styles.toolbar}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RUT, correo o alumno..."
          style={styles.search}
        />
        <button style={styles.newBtn} onClick={abrirNuevo}>+ Nuevo apoderado</button>
      </div>

      {loading && <p>Cargando apoderados...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Apoderado</th>
                <th style={styles.th}>Contacto</th>
                <th style={styles.th}>Alumnos asociados</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={styles.td} colSpan={4}>Sin apoderados registrados todavía.</td></tr>
              )}
              {filtrados.map((a) => (
                <tr key={a.id_apoderado}>
                  <td style={styles.td}>
                    <strong>{a.nombres} {a.apellidos}</strong>
                    <span style={styles.subText}>RUT {a.rut}</span>
                    {a.parentesco && <span style={styles.subText}>{a.parentesco}</span>}
                  </td>
                  <td style={styles.td}>
                    <span>{a.email}</span>
                    <span style={styles.subText}>{a.telefono || 'Sin teléfono'}</span>
                  </td>
                  <td style={styles.td}>
                    {(a.alumnos || []).length === 0 && <span style={styles.subText}>Sin alumnos vinculados</span>}
                    <div style={styles.chips}>
                      {(a.alumnos || []).map((alumno) => (
                        <span key={alumno.id_alumno} style={styles.chip}>
                          {alumno.nombres} {alumno.apellidos} · {alumno.rut}
                          <button style={styles.chipBtn} onClick={() => desvincular(a, alumno)} title="Desvincular alumno">×</button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.actionBtn} onClick={() => abrirEditar(a)}>Editar</button>
                      <button style={styles.actionBtn} onClick={() => abrirVincular(a)}>Asociar alumno</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando !== null && (
        <Modal title={editando?.id_apoderado ? 'Editar apoderado' : 'Nuevo apoderado'} onClose={() => setEditando(null)} width="560px">
          <form onSubmit={guardar}>
            <div style={styles.formRow}>
              <Campo label="Nombres" value={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} required />
              <Campo label="Apellidos" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} required />
            </div>
            <div style={styles.formRow}>
              <Campo label="RUT" value={form.rut} onChange={(v) => setForm({ ...form, rut: v })} required placeholder="11111111-1" />
              <Campo label="Correo" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </div>
            <div style={styles.formRow}>
              <Campo label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
              <Campo label="Parentesco" value={form.parentesco} onChange={(v) => setForm({ ...form, parentesco: v })} placeholder="Madre, padre, tutor..." />
            </div>
            <Campo label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </Modal>
      )}

      {vinculando && (
        <Modal title={`Asociar alumno a ${vinculando.nombres} ${vinculando.apellidos}`} onClose={() => setVinculando(null)} width="520px">
          <form onSubmit={vincularAlumno}>
            <div style={styles.field}>
              <label htmlFor="apoderado-alumno" style={styles.label}>Alumno</label>
              <select
                id="apoderado-alumno"
                value={formVinculo.id_alumno}
                onChange={(e) => setFormVinculo({ ...formVinculo, id_alumno: e.target.value })}
                required
                style={styles.input}
              >
                <option value="" disabled>Selecciona un alumno por nombre o RUT</option>
                {alumnosDisponibles(vinculando).map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>{alumno.nombres} {alumno.apellidos} - {alumno.rut}</option>
                ))}
              </select>
              {alumnosDisponibles(vinculando).length === 0 && <p style={styles.help}>No hay alumnos disponibles para vincular.</p>}
            </div>
            <label style={styles.checkRow}>
              <input type="checkbox" checked={formVinculo.es_principal} onChange={(e) => setFormVinculo({ ...formVinculo, es_principal: e.target.checked })} />
              Apoderado principal
            </label>
            <label style={styles.checkRow}>
              <input type="checkbox" checked={formVinculo.puede_retirar} onChange={(e) => setFormVinculo({ ...formVinculo, puede_retirar: e.target.checked })} />
              Puede retirar al alumno
            </label>
            <button type="submit" disabled={guardando || !formVinculo.id_alumno} style={styles.saveBtn}>{guardando ? 'Vinculando...' : 'Vincular alumno'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required, placeholder }) {
  const id = `apoderado-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} style={styles.input} />
    </div>
  )
}

const styles = {
  toolbar: { display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap' },
  search: { width: '100%', maxWidth: '390px', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  error: { color: colors.danger, background: colors.dangerLight, padding: '0.75rem 1rem', borderRadius: '8px' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '860px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.8rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', verticalAlign: 'top' },
  subText: { display: 'block', color: colors.textMuted, fontSize: '0.82rem', marginTop: '0.25rem' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: colors.primaryLight, color: colors.primaryDark, padding: '0.25rem 0.45rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  chipBtn: { border: 'none', background: 'transparent', color: colors.danger, cursor: 'pointer', fontWeight: '800', fontSize: '1rem', lineHeight: 1 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  field: { marginBottom: '0.9rem', flex: 1, minWidth: '210px' },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  help: { color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.5, margin: '0.5rem 0 0' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', color: colors.textDark, fontSize: '0.9rem' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
