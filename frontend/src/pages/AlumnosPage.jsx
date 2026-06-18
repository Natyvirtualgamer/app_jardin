import { useEffect, useState } from 'react'
import api from '../services/api.js'

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/alumnos/')
      .then(res => setAlumnos(res.data))
      .catch(() => setError('Error al cargar alumnos'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ padding: '2rem' }}>Cargando alumnos...</p>
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>{error}</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👧 Alumnos</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#e8f5e9' }}>
            <th style={th}>RUT</th>
            <th style={th}>Nombres</th>
            <th style={th}>Apellidos</th>
            <th style={th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map(a => (
            <tr key={a.id_alumno}>
              <td style={td}>{a.rut}</td>
              <td style={td}>{a.nombres}</td>
              <td style={td}>{a.apellidos}</td>
              <td style={td}>{a.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#2e7d32', borderBottom: '2px solid #c8e6c9' }
const td = { padding: '0.7rem 1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }
