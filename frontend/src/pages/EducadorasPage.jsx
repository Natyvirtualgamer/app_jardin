import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import { colors, shadows } from '../theme.js'

export default function EducadorasPage() {
  const [educadoras, setEducadoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/auth/usuarios')
      .then((res) => setEducadoras(res.data.filter((u) => u.rol === 'educadora')))
      .catch(() => setError('Error al cargar educadoras'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PanelLayout title="Educadoras">
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
                <tr key={e.email}>
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
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
}
