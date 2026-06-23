// pages/PagosPage.jsx — Antes la tarjeta "Pagos pendientes" del dashboard
// no tenia ruta propia y el backend devolvia {"items": []} fijo. Usa los
// modelos Mensualidad y Pago que ya existian en models/pago.py.
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { colors, shadows } from '../theme.js'

const ETIQUETA_ESTADO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' }

export default function PagosPage() {
  const [mensualidades, setMensualidades] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalPago, setModalPago] = useState(null) // mensualidad seleccionada
  const [formMensualidad, setFormMensualidad] = useState({ id_alumno: '', periodo: '', monto_total: '', descuento: 0, beca: false, fecha_vencimiento: '' })
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo', comprobante_ref: '' })
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    api.get('/pagos/mensualidades').then((res) => setMensualidades(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    api.get('/alumnos/').then((res) => setAlumnos(res.data))
  }, [])

  function nombreAlumno(id) {
    const a = alumnos.find((x) => x.id_alumno === id)
    return a ? `${a.nombres} ${a.apellidos}` : `Alumno #${id}`
  }

  async function crearMensualidad(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/pagos/mensualidades', {
        ...formMensualidad,
        id_alumno: Number(formMensualidad.id_alumno),
        monto_total: Number(formMensualidad.monto_total),
        descuento: Number(formMensualidad.descuento || 0),
        fecha_vencimiento: formMensualidad.fecha_vencimiento || null,
      })
      setModalNueva(false)
      setFormMensualidad({ id_alumno: '', periodo: '', monto_total: '', descuento: 0, beca: false, fecha_vencimiento: '' })
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo crear la mensualidad')
    } finally {
      setGuardando(false)
    }
  }

  async function registrarPago(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/pagos/', {
        id_mensualidad: modalPago.id_mensualidad,
        monto: Number(formPago.monto),
        metodo_pago: formPago.metodo_pago,
        comprobante_ref: formPago.comprobante_ref || null,
      })
      setModalPago(null)
      setFormPago({ monto: '', metodo_pago: 'efectivo', comprobante_ref: '' })
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'No se pudo registrar el pago')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PanelLayout title="💰 Pagos">
      <div style={styles.toolbar}>
        <button style={styles.newBtn} onClick={() => setModalNueva(true)}>+ Nueva mensualidad</button>
      </div>

      {loading ? <p>Cargando mensualidades...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Alumno</th>
                <th style={styles.th}>Periodo</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensualidades.length === 0 && (
                <tr><td style={styles.td} colSpan={5}>Sin mensualidades registradas todavía.</td></tr>
              )}
              {mensualidades.map((m) => (
                <tr key={m.id_mensualidad}>
                  <td style={styles.td}>{nombreAlumno(m.id_alumno)}</td>
                  <td style={styles.td}>{m.periodo}</td>
                  <td style={styles.td}>${Number(m.monto_total).toLocaleString('es-CL')}</td>
                  <td style={styles.td}>
                    <span style={m.estado === 'pagado' ? styles.badgeOk : styles.badgePend}>{ETIQUETA_ESTADO[m.estado] ?? m.estado}</span>
                  </td>
                  <td style={styles.td}>
                    {m.estado !== 'pagado' && (
                      <button style={styles.actionBtn} onClick={() => setModalPago(m)}>Registrar pago</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalNueva && (
        <Modal title="Nueva mensualidad" onClose={() => setModalNueva(false)}>
          <form onSubmit={crearMensualidad}>
            <div style={styles.field}>
              <label htmlFor="pago-alumno" style={styles.label}>Alumno</label>
              <select id="pago-alumno" value={formMensualidad.id_alumno} onChange={(e) => setFormMensualidad({ ...formMensualidad, id_alumno: e.target.value })} required style={styles.input}>
                <option value="" disabled>Selecciona un alumno</option>
                {alumnos.map((a) => <option key={a.id_alumno} value={a.id_alumno}>{a.nombres} {a.apellidos}</option>)}
              </select>
            </div>
            <Campo label="Periodo (AAAA-MM)" value={formMensualidad.periodo} onChange={(v) => setFormMensualidad({ ...formMensualidad, periodo: v })} required placeholder="2026-06" />
            <Campo label="Monto total" type="number" value={formMensualidad.monto_total} onChange={(v) => setFormMensualidad({ ...formMensualidad, monto_total: v })} required />
            <Campo label="Descuento" type="number" value={formMensualidad.descuento} onChange={(v) => setFormMensualidad({ ...formMensualidad, descuento: v })} />
            <Campo label="Fecha vencimiento" type="date" value={formMensualidad.fecha_vencimiento} onChange={(v) => setFormMensualidad({ ...formMensualidad, fecha_vencimiento: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </Modal>
      )}

      {modalPago && (
        <Modal title={`Registrar pago — ${nombreAlumno(modalPago.id_alumno)} (${modalPago.periodo})`} onClose={() => setModalPago(null)}>
          <form onSubmit={registrarPago}>
            <Campo label="Monto" type="number" value={formPago.monto} onChange={(v) => setFormPago({ ...formPago, monto: v })} required />
            <div style={styles.field}>
              <label htmlFor="pago-metodo" style={styles.label}>Método de pago</label>
              <select id="pago-metodo" value={formPago.metodo_pago} onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })} style={styles.input}>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <Campo label="N° comprobante (opcional)" value={formPago.comprobante_ref} onChange={(v) => setFormPago({ ...formPago, comprobante_ref: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Confirmar pago'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function Campo({ label, value, onChange, type = 'text', required, placeholder }) {
  const id = `pago-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} style={styles.input} />
    </div>
  )
}

const styles = {
  toolbar: { marginBottom: '1.25rem' },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' },
  badgeOk: { background: colors.primaryLight, color: colors.primaryDark, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  badgePend: { background: '#fff3e0', color: colors.accent, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  field: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
