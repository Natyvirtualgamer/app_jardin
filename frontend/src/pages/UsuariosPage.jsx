// pages/UsuariosPage.jsx — SOLO visible/accesible para rol 'administrador'
// (ver App.jsx -> AdminRoute y PanelLayout.jsx -> NAV_ITEMS). La API ya
// bloquea esto con require_roles("administrador") aunque alguien fuerce
// la URL; esto es la capa de UX, no la capa de seguridad real.
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

function generarPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [resetUsuario, setResetUsuario] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeOk, setMensajeOk] = useState('')

  function cargar() {
    setLoading(true)
    api.get('/auth/usuarios').then((res) => setUsuarios(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const filtrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.apellido} ${u.email} ${u.rol}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  function abrirReset(usuario) {
    setResetUsuario(usuario)
    setNuevaPassword(generarPassword())
    setMensajeOk('')
  }

  async function confirmarReset(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post(`/auth/usuarios/${resetUsuario.id_usuario}/resetear-password`, { nueva_password: nuevaPassword })
      setMensajeOk(`Contraseña restablecida para ${resetUsuario.email}. Compártela de forma segura — no quedará visible después de cerrar esta ventana.`)
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo restablecer la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelLayout title="🔑 Usuarios">
      <div style={styles.toolbar}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o rol..."
          style={styles.search}
        />
      </div>

      {loading ? <p>Cargando usuarios...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={styles.td} colSpan={5}>Sin resultados.</td></tr>
              )}
              {filtrados.map((u) => (
                <tr key={u.id_usuario}>
                  <td style={styles.td}>{u.nombre} {u.apellido}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}><span style={styles.badge}>{u.rol}</span></td>
                  <td style={styles.td}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtn} onClick={() => abrirReset(u)}>Restablecer contraseña</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetUsuario && (
        <Modal title={`Restablecer contraseña — ${resetUsuario.nombre} ${resetUsuario.apellido}`} onClose={() => setResetUsuario(null)}>
          {mensajeOk ? (
            <div>
              <p style={styles.help}>{mensajeOk}</p>
              <p style={styles.passwordBox}>{nuevaPassword}</p>
              <button onClick={() => setResetUsuario(null)} style={styles.saveBtn}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={confirmarReset}>
              <p style={styles.help}>
                Úsala solo cuando el apoderado o personal confirme su identidad (por teléfono o en recepción).
                No hay envío automático de correo — debes compartir esta contraseña tú mismo, una sola vez.
              </p>
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
                  🔄 Generar
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

const styles = {
  toolbar: { marginBottom: '1.25rem' },
  search: { width: '100%', maxWidth: '360px', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
  badge: { background: colors.primaryLight, color: colors.primaryDark, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  help: { color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  passwordRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  input: { flex: 1, padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.95rem', fontFamily: 'monospace', boxSizing: 'border-box' },
  genBtn: { background: colors.primaryLight, border: `1px solid ${colors.primary}`, color: colors.primaryDark, borderRadius: '7px', padding: '0 0.8rem', cursor: 'pointer', fontSize: '0.85rem' },
  passwordBox: { fontFamily: 'monospace', fontSize: '1.1rem', background: colors.primaryLight, padding: '0.8rem', borderRadius: '8px', textAlign: 'center', letterSpacing: '1px', marginBottom: '1rem' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
}
