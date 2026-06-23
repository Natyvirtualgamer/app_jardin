// components/LoginModal.jsx — v2: agrega pestañas Personal/Apoderado,
// registro de apoderado y solicitud de recuperación de contraseña.
//
// IMPORTANTE de seguridad: la pestaña elegida (staff/apoderado) es solo
// cosmetica — el menu real tras iniciar sesion se decide por el campo
// `rol` que devuelve el backend (linea "onSuccess(rol)" mas abajo), nunca
// por lo que el usuario clickeo en el modal. Asi evitamos que alguien
// "elija" ser administrador desde el navegador.
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import Modal from './Modal.jsx'
import { colors } from '../theme.js'

const VISTAS = { LOGIN: 'login', RECUPERAR: 'recuperar', REGISTRO: 'registro' }

export default function LoginModal({ onClose, onSuccess }) {
  const [vista, setVista] = useState(VISTAS.LOGIN)
  const [tab, setTab] = useState('staff') // 'staff' | 'apoderado' — solo cambia copy/links

  return (
    <Modal title={titulo(vista)} onClose={onClose}>
      {vista === VISTAS.LOGIN && (
        <LoginForm tab={tab} setTab={setTab} onSuccess={onSuccess} irARecuperar={() => setVista(VISTAS.RECUPERAR)} irARegistro={() => setVista(VISTAS.REGISTRO)} />
      )}
      {vista === VISTAS.RECUPERAR && <RecuperarForm volver={() => setVista(VISTAS.LOGIN)} />}
      {vista === VISTAS.REGISTRO && <RegistroForm volver={() => setVista(VISTAS.LOGIN)} />}
    </Modal>
  )
}

function titulo(vista) {
  if (vista === VISTAS.RECUPERAR) return '🔑 Recuperar contraseña'
  if (vista === VISTAS.REGISTRO) return '📝 Crear cuenta de apoderado'
  return '🌻 Ingreso al Sistema'
}

// ── Login ──────────────────────────────────────────────────────────────

function LoginForm({ tab, setTab, onSuccess, irARecuperar, irARegistro }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const rol = await login(email, password)
      onSuccess(rol)
    } catch {
      setError('Correo o contraseña incorrectos. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div style={styles.tabs}>
        <button type="button" onClick={() => setTab('staff')} style={tab === 'staff' ? styles.tabActive : styles.tab}>
          👩‍🏫 Personal del Jardín
        </button>
        <button type="button" onClick={() => setTab('apoderado')} style={tab === 'apoderado' ? styles.tabActive : styles.tab}>
          👨‍👩‍👧 Soy Apoderado
        </button>
      </div>
      <p style={styles.subtitle}>
        {tab === 'staff'
          ? 'Acceso para administradores, educadoras y personal del jardín.'
          : 'Acceso al portal de seguimiento para padres y apoderados.'}
      </p>
      <form onSubmit={handleSubmit}>
        <Campo label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="usuario@jardin.cl" required autoFocus />
        <Campo label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div style={styles.links}>
        <button type="button" onClick={irARecuperar} style={styles.linkBtn}>¿Olvidaste tu contraseña?</button>
        {tab === 'apoderado' && (
          <button type="button" onClick={irARegistro} style={styles.linkBtn}>¿No tienes cuenta? Regístrate</button>
        )}
      </div>
    </>
  )
}

// ── Recuperar contraseña ─────────────────────────────────────────────
// No hay SMTP configurado en este MVP — el backend registra la solicitud
// para seguimiento manual del administrador (ver routers/auth.py).

function RecuperarForm({ volver }) {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/recuperar', { email })
      setMensaje(res.data.message)
    } catch {
      setMensaje('No se pudo procesar la solicitud. Intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  if (mensaje) {
    return (
      <div>
        <p style={styles.subtitle}>{mensaje}</p>
        <button type="button" onClick={volver} style={styles.button}>Volver al inicio de sesión</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={styles.subtitle}>Ingresa tu correo y el administrador procesará tu solicitud de acceso.</p>
      <Campo label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="usuario@jardin.cl" required autoFocus />
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
      <button type="button" onClick={volver} style={styles.linkBtnBlock}>‹ Volver al inicio de sesión</button>
    </form>
  )
}

// ── Registro (solo apoderados) ───────────────────────────────────────

const VACIO_REGISTRO = { nombre: '', apellido: '', rut: '', email: '', password: '', confirmar: '' }

function RegistroForm({ volver }) {
  const [form, setForm] = useState(VACIO_REGISTRO)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(campo) {
    return (valor) => setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/registro', {
        nombre: form.nombre, apellido: form.apellido, rut: form.rut,
        email: form.email, password: form.password,
      })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div>
        <p style={styles.subtitle}>Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.</p>
        <button type="button" onClick={volver} style={styles.button}>Iniciar sesión ahora</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={styles.subtitle}>Solo para padres y apoderados. El personal del jardín se registra a través del administrador.</p>
      <Campo label="Nombres" value={form.nombre} onChange={set('nombre')} required />
      <Campo label="Apellidos" value={form.apellido} onChange={set('apellido')} required />
      <Campo label="RUT" value={form.rut} onChange={set('rut')} placeholder="11111111-1" required />
      <Campo label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
      <Campo label="Contraseña" type="password" value={form.password} onChange={set('password')} required />
      <Campo label="Confirmar contraseña" type="password" value={form.confirmar} onChange={set('confirmar')} required />
      {error && <p style={styles.error}>{error}</p>}
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
      <button type="button" onClick={volver} style={styles.linkBtnBlock}>‹ Volver al inicio de sesión</button>
    </form>
  )
}

// ── Campo reutilizable ────────────────────────────────────────────────

function Campo({ label, value, onChange, type = 'text', required, placeholder, autoFocus }) {
  const id = `campo-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
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
        autoFocus={autoFocus}
        style={styles.input}
      />
    </div>
  )
}

const styles = {
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' },
  tab: { flex: 1, padding: '0.6rem 0.5rem', borderRadius: '8px', border: `1.5px solid ${colors.border}`, background: '#fff', color: colors.textMuted, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  tabActive: { flex: 1, padding: '0.6rem 0.5rem', borderRadius: '8px', border: `1.5px solid ${colors.primary}`, background: colors.primaryLight, color: colors.primaryDark, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: '0.88rem', marginTop: 0, marginBottom: '1.1rem', lineHeight: 1.5 },
  field: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.35rem', color: colors.textDark, fontWeight: '500', fontSize: '0.88rem' },
  input: { width: '100%', padding: '0.65rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box' },
  error: { color: colors.danger, fontSize: '0.85rem', marginBottom: '1rem' },
  button: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', fontWeight: '600' },
  links: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.1rem', alignItems: 'center' },
  linkBtn: { background: 'none', border: 'none', color: colors.primary, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' },
  linkBtnBlock: { display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', color: colors.primary, fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.8rem', textDecoration: 'underline' },
}
