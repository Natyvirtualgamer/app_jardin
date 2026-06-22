// components/Modal.jsx — Overlay genérico reutilizado por LoginModal y los
// formularios de Alumnos/Cursos/Asistencia/Pagos. Evita duplicar el
// markup de overlay+card en cada página que necesita un formulario emergente.
import { colors, shadows } from '../theme.js'

export default function Modal({ title, onClose, children, width = '420px' }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.card, width }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">✕</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(38,50,56,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  card: {
    background: colors.cardBg, borderRadius: '14px', boxShadow: shadows.modal,
    maxHeight: '90vh', overflowY: 'auto',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.25rem 1.5rem 0.75rem', borderBottom: `1px solid ${colors.border}`,
  },
  title: { margin: 0, color: colors.primaryDark, fontSize: '1.25rem' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer',
    color: colors.textMuted, lineHeight: 1,
  },
  body: { padding: '1.25rem 1.5rem 1.5rem' },
}
