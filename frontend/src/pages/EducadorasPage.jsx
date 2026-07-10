import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

export default function EducadorasPage() {
  const [educadoras, setEducadoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    api.get('/auth/educadoras')
      .then((res) => setEducadoras(res.data))
      .catch(() => setError('Error al cargar educadoras'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PanelLayout title="Educadoras">
      <div style={styles.toolbar}>
        {user?.rol === 'administrador' && <button style={styles.newBtn} onClick={() => navigate('/usuarios')}>Gestionar educadoras</button>}
      </div>
      {loading && <p>Cargando educadoras...</p>}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {educadoras.length === 0 && (
                <tr><td style={styles.td} colSpan={3}>Sin educadoras registradas todavia.</td></tr>
              )}
              {educadoras.map((e) => (
                <tr key={e.id_educadora}>
                  <td style={styles.td}>{e.nombre} {e.apellido}</td>
                  <td style={styles.td}>{e.email}</td>
                  <td style={styles.td}>{e.activo ? 'Activo' : 'Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelLayout>
  )
}

const styles = {
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '560px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
}
