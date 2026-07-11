// pages/AlumnosPage.jsx — Antes era SOLO LECTURA (un GET y una tabla).
// Ahora agrega crear / editar / dar de baja, usando los endpoints que el
// backend ya tenia listos en routers/alumnos.py (POST, PUT, DELETE).
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const VACIO = {
  nombres: '', apellidos: '', rut: '', fecha_nacimiento: '',
  id_institucion: 1, id_curso: '', alergias: '', medicamentos: '', observaciones: '',
}

export default function AlumnosPage() {
  const { user } = useAuth()
  const [alumnos, setAlumnos] = useState([])
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null) // null = cerrado, {} = nuevo, {...} = editar
  const [ficha, setFicha] = useState(null)
  const [fichaLoading, setFichaLoading] = useState(false)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const puedeEscribir = ['administrador', 'direccion', 'recepcion'].includes(user?.rol)
  const puedeVerApoderados = ['administrador', 'direccion', 'recepcion'].includes(user?.rol)
  const puedeVerAsistencia = ['administrador', 'direccion', 'educadora', 'recepcion'].includes(user?.rol)
  const puedeVerPagos = ['administrador', 'direccion', 'finanzas'].includes(user?.rol)

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

  async function abrirFicha(alumno) {
    setFicha({ alumno, apoderados: [], asistencia: [], mensualidades: [] })
    setFichaLoading(true)
    const apoderadosReq = puedeVerApoderados ? api.get('/apoderados/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    const asistenciaReq = puedeVerAsistencia ? api.get('/asistencia/', { params: { id_alumno: alumno.id_alumno } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    const pagosReq = puedeVerPagos ? api.get('/pagos/mensualidades', { params: { id_alumno: alumno.id_alumno } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })

    try {
      const [apoderadosRes, asistenciaRes, pagosRes] = await Promise.all([apoderadosReq, asistenciaReq, pagosReq])
      const apoderadosAlumno = apoderadosRes.data.filter((apoderado) =>
        (apoderado.alumnos || []).some((a) => a.id_alumno === alumno.id_alumno)
      )
      setFicha({
        alumno,
        apoderados: apoderadosAlumno,
        asistencia: asistenciaRes.data,
        mensualidades: pagosRes.data,
      })
    } finally {
      setFichaLoading(false)
    }
  }

  function nombreCurso(idCurso) {
    const curso = cursos.find((c) => c.id_curso === idCurso)
    return curso ? curso.nombre : 'Sin curso asignado'
  }

  return (
    <PanelLayout title="👧 Alumnos">
      <div style={styles.toolbar}>
        {puedeEscribir && <button style={styles.newBtn} onClick={abrirNuevo}>+ Nuevo alumno</button>}
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
                    <button style={styles.actionBtn} onClick={() => abrirFicha(a)}>Ver ficha</button>
                    {puedeEscribir && <button style={styles.actionBtn} onClick={() => abrirEditar(a)}>Editar</button>}
                    {puedeEscribir && <button style={styles.actionBtnDanger} onClick={() => eliminar(a)}>Dar de baja</button>}
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

      {ficha && (
        <Modal title="Ficha del alumno" onClose={() => setFicha(null)} width="760px">
          {fichaLoading ? <p>Cargando ficha...</p> : (
            <FichaAlumno
              ficha={ficha}
              curso={nombreCurso(ficha.alumno.id_curso)}
              puedeEditar={puedeEscribir}
              puedeVerApoderados={puedeVerApoderados}
              puedeVerAsistencia={puedeVerAsistencia}
              puedeVerPagos={puedeVerPagos}
              onEditar={() => { setFicha(null); abrirEditar(ficha.alumno) }}
            />
          )}
        </Modal>
      )}
    </PanelLayout>
  )
}

function FichaAlumno({ ficha, curso, puedeEditar, puedeVerApoderados, puedeVerAsistencia, puedeVerPagos, onEditar }) {
  const { alumno, apoderados, asistencia, mensualidades } = ficha
  return (
    <div>
      <div style={styles.fichaHeader}>
        <div>
          <h2 style={styles.fichaTitle}>{alumno.nombres} {alumno.apellidos}</h2>
          <p style={styles.subText}>RUT {alumno.rut} · Nacimiento {alumno.fecha_nacimiento}</p>
          <p style={styles.subText}>Estado: {alumno.estado} · Curso: {curso}</p>
        </div>
        {puedeEditar && <button style={styles.actionBtn} onClick={onEditar}>Editar ficha</button>}
      </div>

      <div style={styles.detailGrid}>
        <InfoBox label="Alergias" value={alumno.alergias || 'Sin registro'} />
        <InfoBox label="Medicamentos" value={alumno.medicamentos || 'Sin registro'} />
        <InfoBox label="Observaciones" value={alumno.observaciones || 'Sin observaciones'} />
      </div>

      <section style={styles.fichaSection}>
        <h3 style={styles.sectionTitle}>Apoderados vinculados</h3>
        {!puedeVerApoderados && <p style={styles.subText}>Información disponible para administración, dirección y recepción.</p>}
        {puedeVerApoderados && apoderados.length === 0 && <p style={styles.subText}>Sin apoderados vinculados.</p>}
        {puedeVerApoderados && apoderados.map((apoderado) => (
          <div key={apoderado.id_apoderado} style={styles.listLine}>
            <strong>{apoderado.nombres} {apoderado.apellidos}</strong>
            <span>{apoderado.email} · {apoderado.telefono || 'Sin teléfono'}</span>
          </div>
        ))}
      </section>

      <section style={styles.fichaSection}>
        <h3 style={styles.sectionTitle}>Asistencia reciente</h3>
        {!puedeVerAsistencia && <p style={styles.subText}>Información no disponible para este rol.</p>}
        {puedeVerAsistencia && asistencia.length === 0 && <p style={styles.subText}>Sin registros de asistencia.</p>}
        {puedeVerAsistencia && asistencia.slice(0, 5).map((registro) => (
          <div key={registro.id_asistencia} style={styles.listLineInline}>
            <span>{registro.fecha}</span>
            <strong>{registro.estado}</strong>
          </div>
        ))}
      </section>

      <section style={styles.fichaSection}>
        <h3 style={styles.sectionTitle}>Mensualidades y pagos</h3>
        {!puedeVerPagos && <p style={styles.subText}>Información disponible para administración, dirección y finanzas.</p>}
        {puedeVerPagos && mensualidades.length === 0 && <p style={styles.subText}>Sin mensualidades registradas.</p>}
        {puedeVerPagos && mensualidades.map((mensualidad) => (
          <div key={mensualidad.id_mensualidad} style={styles.listLineInline}>
            <span>{mensualidad.periodo} · ${Number(mensualidad.monto_total).toLocaleString('es-CL')}</span>
            <strong>{mensualidad.estado}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
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
  fichaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  fichaTitle: { color: colors.primaryDark, margin: '0 0 0.35rem', fontSize: '1.3rem' },
  subText: { color: colors.textMuted, fontSize: '0.86rem', margin: '0.25rem 0', lineHeight: 1.45 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem', marginBottom: '1rem' },
  infoBox: { background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.8rem' },
  infoLabel: { display: 'block', color: colors.textMuted, fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' },
  infoValue: { color: colors.textDark, fontSize: '0.9rem' },
  fichaSection: { borderTop: `1px solid ${colors.border}`, paddingTop: '0.9rem', marginTop: '0.9rem' },
  sectionTitle: { color: colors.primaryDark, margin: '0 0 0.6rem', fontSize: '1rem' },
  listLine: { display: 'flex', flexDirection: 'column', gap: '0.2rem', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.7rem', marginBottom: '0.5rem', fontSize: '0.88rem' },
  listLineInline: { display: 'flex', justifyContent: 'space-between', gap: '1rem', background: '#f8fbff', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.7rem', marginBottom: '0.5rem', fontSize: '0.88rem', flexWrap: 'wrap' },
}
