import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import { colors, shadows } from '../theme.js'

export default function ApoderadosPage() {
  const [apoderados, setApoderados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/apoderados/')
      .then((res) => setApoderados(Array.isArray(res.data) ? res.data : res.data.items ?? []))
      .catch(() => setError('Error al cargar apoderados'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PanelLayout title="Apoderados">
      {loading && <p>Cargando apoderados...</p>}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Telefono</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {apoderados.length === 0 && (
                <tr><td style={styles.td} colSpan={4}>Sin apoderados registrados todavia.</td></tr>
              )}
              {apoderados.map((a) => (
                <tr key={a.email ?? a.rut ?? `${a.nombre}-${a.apellido}`}>
                  <td style={styles.td}>{[a.nombre, a.apellido].filter(Boolean).join(' ') || 'Sin nombre'}</td>
                  <td style={styles.td}>{a.email ?? 'Sin email'}</td>
                  <td style={styles.td}>{a.telefono ?? 'Sin telefono'}</td>
                  <td style={styles.td}>{a.activo === false ? 'Inactivo' : 'Activo'}</td>
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
