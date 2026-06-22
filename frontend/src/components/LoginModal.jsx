// components/LoginModal.jsx — Reemplaza a la antigua pagina LoginPage.jsx.
// Se abre como overlay desde LandingPage al presionar "Iniciar Sesion".
// Al autenticar correctamente, llama a onSuccess() (la pagina padre navega).
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'
import { colors } from '../theme.js'

export default function LoginModal({ onClose, onSuccess }) {
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
      await login(email, password)
      onSuccess()
    } catch {
      setError('Correo o contraseña incorrectos. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="🌻 Ingreso al Sistema" onClose={onClose}>
      <p style={styles.subtitle}>Acceso para administradores, educadoras y personal del jardín.</p>
      <form onSubmit={handleSubmit}>
        <div style={styles.field}>
          <label style={styles.label}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="usuario@jardin.cl"
            autoFocus
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </Modal>
  )
}

const styles = {
  subtitle: { color: colors.textMuted, fontSize: '0.9rem', marginTop: 0, marginBottom: '1.25rem' },
  field: { marginBottom: '1.1rem' },
  label: { display: 'block', marginBottom: '0.4rem', color: colors.textDark, fontWeight: '500', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.7rem', border: `1.5px solid ${colors.border}`, borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' },
  error: { color: colors.danger, fontSize: '0.85rem', marginBottom: '1rem' },
  button: { width: '100%', padding: '0.8rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' },
}
