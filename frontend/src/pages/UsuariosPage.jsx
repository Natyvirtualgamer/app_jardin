import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const VACIO = { nombre: '', apellido: '', rut: '', email: '', rol: 'apoderado', password: '', activo: true }

function generarPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [resetUsuario, setResetUsuario] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeOk, setMensajeOk] = useState('')

  function cargar() {
    setLoading(true)
    Promise.all([api.get('/auth/usuarios'), api.get('/auth/roles')])
      .then(([usuariosRes, rolesRes]) => {
        setUsuarios(usuariosRes.data)
        setRoles(rolesRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.apellido} ${u.email} ${u.rut} ${u.rol}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  function abrirNuevo() {
    setForm({ ...VACIO, password: generarPassword(), rol: roles[0]?.nombre ?? 'apoderado' })
    setEditando({})
    setMensajeOk('')
  }

  function abrirEditar(usuario) {
    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rut: usuario.rut ?? '',
      email: usuario.email,
      rol: usuario.rol,
      password: '',
      activo: usuario.activo,
    })
    setEditando(usuario)
    setMensajeOk('')
  }

  function abrirReset(usuario) {
    setResetUsuario(usuario)
    setNuevaPassword(generarPassword())
    setMensajeOk('')
  }

  async function guardarUsuario(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      if (editando?.id_usuario) {
        await api.put(`/auth/usuarios/${editando.id_usuario}`, {
          nombre: form.nombre,
          apellido: form.apellido,
          rut: form.rut,
          email: form.email,
          rol: form.rol,
          activo: form.activo,
        })
      } else {
        await api.post('/auth/usuarios', {
          nombre: form.nombre,
          apellido: form.apellido,
          rut: form.rut,
          email: form.email,
          rol: form.rol,
          password: form.password,
        })
      }
      setEditando(null)
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo guardar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(usuario) {
    if (!confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`)) return
    await api.delete(`/auth/usuarios/${usuario.id_usuario}`)
    cargar()
  }

  async function confirmarReset(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post(`/auth/usuarios/${resetUsuario.id_usuario}/resetear-password`, { nueva_password: nuevaPassword })
      setMensajeOk(`Contraseña restablecida para ${resetUsuario.email}. Compártela de forma segura; no quedará visible después de cerrar esta ventana.`)
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo restablecer la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelLayout title="Usuarios y personal">
      <div style={styles.toolbar}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RUT, correo o rol..."
          style={styles.search}
        />
        <button style={styles.newBtn} onClick={abrirNuevo}>+ Nuevo usuario</button>
      </div>

      {loading ? <p>Cargando usuarios...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>RUT</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={styles.td} colSpan={6}>Sin resultados.</td></tr>
              )}
              {filtrados.map((u) => (
                <tr key={u.id_usuario}>
                  <td style={styles.td}>{u.nombre} {u.apellido}</td>
                  <td style={styles.td}>{u.rut ?? 'Sin RUT'}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}><span style={styles.badge}>{u.rol}</span></td>
                  <td style={styles.td}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.actionBtn} onClick={() => abrirEditar(u)}>Editar</button>
                      <button style={styles.actionBtn} onClick={() => abrirReset(u)}>Restablecer contraseña</button>
                      {u.activo && <button style={styles.actionBtnDanger} onClick={() => desactivar(u)}>Desactivar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando !== null && (
        <Modal title={editando?.id_usuario ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setEditando(null)} width="560px">
          <form onSubmit={guardarUsuario}>
            <div style={styles.formRow}>
              <Campo label="Nombres" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
              <Campo label="Apellidos" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} required />
            </div>
            <div style={styles.formRow}>
              <Campo label="RUT" value={form.rut} onChange={(v) => setForm({ ...form, rut: v })} required placeholder="11111111-1" />
              <Campo label="Correo" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </div>
            <div style={styles.field}>
              <label htmlFor="usuario-rol" style={styles.label}>Rol</label>
              <select id="usuario-rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} style={styles.input}>
                {roles.map((rol) => <option key={rol.nombre} value={rol.nombre}>{rol.nombre}</option>)}
              </select>
            </div>
            {!editando?.id_usuario && (
              <div style={styles.field}>
                <label htmlFor="usuario-password" style={styles.label}>Contraseña inicial</label>
                <div style={styles.passwordRow}>
                  <input
                    id="usuario-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={8}
                    required
                    style={styles.input}
                  />
                  <button type="button" onClick={() => setForm({ ...form, password: generarPassword() })} style={styles.genBtn}>
                    Generar
                  </button>
                </div>
                <p style={styles.help}>Entrega esta contraseña inicial por un canal seguro. Luego puedes restablecerla desde este mismo módulo.</p>
              </div>
            )}
            {editando?.id_usuario && (
              <label style={styles.checkRow}>
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Usuario activo
              </label>
            )}
            <button type="submit" disabled={guardando} style={styles.saveBtn}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {resetUsuario && (
        <Modal title={`Restablecer contraseña - ${resetUsuario.nombre} ${resetUsuario.apellido}`} onClose={() => setResetUsuario(null)}>
          {mensajeOk ? (
            <div>
              <p style={styles.help}>{mensajeOk}</p>
              <p style={styles.passwordBox}>{nuevaPassword}</p>
              <button onClick={() => setResetUsuario(null)} style={styles.saveBtn}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={confirmarReset}>
              <p style={styles.help}>No hay envío automático de correo. Comparte esta contraseña manualmente y solo con la persona correcta.</p>
              <label style={styles.label}>Nueva contraseña</label>
              <div style={styles.passwordRow}>
                <input
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  minLength={8}
                  required
                  style={styles.input}
                />
                <button type="button" onClick={() => setNuevaPassword(generarPassword())} style={styles.genBtn}>
                  Generar
                </button>
              </div>
              <button type="submit" disabled={guardando} style={styles.saveBtn}>
                {guardando ? 'Restableciendo...' : 'Confirmar y restablecer'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required, placeholder }) {
  const id = `usuario-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
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

const styles = {
  toolbar: { display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap' },
  search: { width: '100%', maxWidth: '380px', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '780px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', verticalAlign: 'top' },
  badge: { background: colors.primaryLight, color: colors.primaryDark, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  field: { marginBottom: '0.9rem', flex: 1, minWidth: '210px' },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  passwordRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' },
  genBtn: { background: colors.primaryLight, border: `1px solid ${colors.primary}`, color: colors.primaryDark, borderRadius: '7px', padding: '0 0.8rem', cursor: 'pointer', fontSize: '0.85rem' },
  help: { color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 1rem', color: colors.textDark, fontSize: '0.9rem' },
  passwordBox: { fontFamily: 'monospace', fontSize: '1.1rem', background: colors.primaryLight, padding: '0.8rem', borderRadius: '8px', textAlign: 'center', letterSpacing: '1px', marginBottom: '1rem' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
}
