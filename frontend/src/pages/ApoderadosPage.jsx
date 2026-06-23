import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import { colors, shadows } from '../theme.js'

export default function ApoderadosPage() {
  const [apoderados, setApoderados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/auth/usuarios')
      .then((res) => setApoderados(res.data.filter((u) => u.rol === 'apoderado')))
      .catch(() => setError('Error al cargar apoderados'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PanelLayout title="Apoderados">
      <div style={styles.toolbar}>
        <button style={styles.newBtn} onClick={() => navigate('/usuarios')}>Gestionar apoderados</button>
      </div>
      {loading && <p>Cargando apoderados...</p>}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>RUT</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {apoderados.length === 0 && (
                <tr><td style={styles.td} colSpan={4}>Sin apoderados registrados todavia.</td></tr>
              )}
              {apoderados.map((a) => (
                <tr key={a.id_usuario}>
                  <td style={styles.td}>{a.nombre} {a.apellido}</td>
                  <td style={styles.td}>{a.rut ?? 'Sin RUT'}</td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>{a.activo ? 'Activo' : 'Inactivo'}</td>
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
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '640px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
}
