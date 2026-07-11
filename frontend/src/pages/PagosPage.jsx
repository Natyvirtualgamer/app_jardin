import { useEffect, useState } from 'react'
import api from '../services/api.js'
import PanelLayout from '../components/PanelLayout.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { colors, shadows } from '../theme.js'

const ETIQUETA_ESTADO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' }
const ETIQUETA_METODO = { efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', transferencia: 'Transferencia' }

const FORM_MENSUALIDAD = { id_alumno: '', periodo: '', monto_total: '', descuento: 0, beca: false, fecha_vencimiento: '' }
const FORM_PAGO = { monto: '', metodo_pago: 'efectivo', comprobante_ref: '', observacion: '' }
const FORM_EDITAR_PAGO = { monto: '', metodo_pago: 'efectivo', fecha_pago: '', observacion: '' }

function dinero(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CL')}`
}

function fechaCorta(valor) {
  if (!valor) return 'Sin fecha'
  return new Date(valor).toLocaleDateString('es-CL')
}

function fechaParaInput(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function mensajeError(err, fallback) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || fallback
}

export default function PagosPage() {
  const { user } = useAuth()
  const [mensualidades, setMensualidades] = useState([])
  const [pagos, setPagos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalPago, setModalPago] = useState(null)
  const [modalEditarPago, setModalEditarPago] = useState(null)
  const [formMensualidad, setFormMensualidad] = useState(FORM_MENSUALIDAD)
  const [formPago, setFormPago] = useState(FORM_PAGO)
  const [formEditarPago, setFormEditarPago] = useState(FORM_EDITAR_PAGO)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const puedeEscribir = ['administrador', 'finanzas'].includes(user?.rol)

  function cargar() {
    setLoading(true)
    Promise.all([api.get('/pagos/mensualidades'), api.get('/pagos/')])
      .then(([mensualidadesRes, pagosRes]) => {
        setMensualidades(mensualidadesRes.data)
        setPagos(pagosRes.data)
      })
      .catch((err) => setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudieron cargar los pagos') }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    api.get('/alumnos/').then((res) => setAlumnos(res.data)).catch(() => setAlumnos([]))
  }, [])

  function nombreAlumno(id) {
    const alumno = alumnos.find((x) => x.id_alumno === id)
    return alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Alumno sin nombre disponible'
  }

  function pagosDeMensualidad(idMensualidad) {
    return pagos.filter((pago) => pago.id_mensualidad === idMensualidad)
  }

  function saldoMensualidad(mensualidad) {
    const totalPagado = pagosDeMensualidad(mensualidad.id_mensualidad).reduce((total, pago) => total + Number(pago.monto || 0), 0)
    return Number(mensualidad.monto_total || 0) - Number(mensualidad.descuento || 0) - totalPagado
  }

  async function crearMensualidad(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      await api.post('/pagos/mensualidades', {
        ...formMensualidad,
        id_alumno: Number(formMensualidad.id_alumno),
        monto_total: Number(formMensualidad.monto_total),
        descuento: Number(formMensualidad.descuento || 0),
        fecha_vencimiento: formMensualidad.fecha_vencimiento || null,
      })
      setModalNueva(false)
      setFormMensualidad(FORM_MENSUALIDAD)
      setMensaje({ tipo: 'ok', texto: 'Mensualidad creada correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo crear la mensualidad') })
    } finally {
      setGuardando(false)
    }
  }

  async function registrarPago(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      await api.post('/pagos/', {
        id_mensualidad: modalPago.id_mensualidad,
        monto: Number(formPago.monto),
        metodo_pago: formPago.metodo_pago,
        comprobante_ref: formPago.comprobante_ref || null,
        observacion: formPago.observacion || null,
      })
      setModalPago(null)
      setFormPago(FORM_PAGO)
      setMensaje({ tipo: 'ok', texto: 'Pago registrado correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo registrar el pago') })
    } finally {
      setGuardando(false)
    }
  }

  function abrirEditarPago(pago) {
    setModalEditarPago(pago)
    setFormEditarPago({
      monto: String(pago.monto ?? ''),
      metodo_pago: pago.metodo_pago,
      fecha_pago: fechaParaInput(pago.fecha_pago),
      observacion: pago.observacion ?? '',
    })
    setMensaje(null)
  }

  async function editarPago(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      await api.put(`/pagos/${modalEditarPago.id_pago}`, {
        monto: Number(formEditarPago.monto),
        metodo_pago: formEditarPago.metodo_pago,
        fecha_pago: new Date(formEditarPago.fecha_pago).toISOString(),
        observacion: formEditarPago.observacion || null,
      })
      setModalEditarPago(null)
      setFormEditarPago(FORM_EDITAR_PAGO)
      setMensaje({ tipo: 'ok', texto: 'Pago actualizado correctamente.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo actualizar el pago') })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarPago(pago) {
    const seguro = confirm('¿Seguro que deseas eliminar este pago? Esta acción recalculará el estado de la mensualidad.')
    if (!seguro) return
    setMensaje(null)
    try {
      await api.delete(`/pagos/${pago.id_pago}`)
      setMensaje({ tipo: 'ok', texto: 'Pago eliminado correctamente. La mensualidad fue recalculada.' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err, 'No se pudo eliminar el pago') })
    }
  }

  return (
    <PanelLayout title="💰 Pagos">
      <div style={styles.toolbar}>
        <div>
          <p style={styles.kicker}>Mensualidades</p>
          <p style={styles.help}>Registra pagos y controla saldos sin mostrar datos técnicos a las familias.</p>
        </div>
        {puedeEscribir && <button style={styles.newBtn} onClick={() => setModalNueva(true)}>+ Nueva mensualidad</button>}
      </div>

      {mensaje && <p style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>{mensaje.texto}</p>}

      {loading ? <p>Cargando mensualidades...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Alumno</th>
                <th style={styles.th}>Periodo</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Pagos registrados</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensualidades.length === 0 && (
                <tr><td style={styles.td} colSpan={6}>Sin mensualidades registradas todavía.</td></tr>
              )}
              {mensualidades.map((mensualidad) => {
                const pagosMensualidad = pagosDeMensualidad(mensualidad.id_mensualidad)
                return (
                  <tr key={mensualidad.id_mensualidad}>
                    <td style={styles.td}>{nombreAlumno(mensualidad.id_alumno)}</td>
                    <td style={styles.td}>{mensualidad.periodo}</td>
                    <td style={styles.td}>
                      <strong>{dinero(mensualidad.monto_total)}</strong>
                      <span style={styles.subText}>Saldo: {dinero(Math.max(saldoMensualidad(mensualidad), 0))}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(mensualidad.estado)}>{ETIQUETA_ESTADO[mensualidad.estado] ?? mensualidad.estado}</span>
                    </td>
                    <td style={styles.td}>
                      {pagosMensualidad.length === 0 && <span style={styles.subText}>Sin pagos registrados</span>}
                      {pagosMensualidad.map((pago) => (
                        <div key={pago.id_pago} style={styles.paymentLine}>
                          <div>
                            <strong>{dinero(pago.monto)}</strong>
                            <span style={styles.subText}>{fechaCorta(pago.fecha_pago)} · {ETIQUETA_METODO[pago.metodo_pago] ?? pago.metodo_pago}</span>
                            {pago.observacion && <span style={styles.subText}>{pago.observacion}</span>}
                          </div>
                          {puedeEscribir && (
                            <div style={styles.inlineActions}>
                              <button style={styles.actionBtn} onClick={() => abrirEditarPago(pago)}>Editar</button>
                              <button style={styles.actionBtnDanger} onClick={() => eliminarPago(pago)}>Eliminar</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={styles.td}>
                      {puedeEscribir && mensualidad.estado !== 'pagado' && (
                        <button style={styles.actionBtn} onClick={() => setModalPago(mensualidad)}>Registrar pago</button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
        <Modal title={`Registrar pago - ${nombreAlumno(modalPago.id_alumno)} (${modalPago.periodo})`} onClose={() => setModalPago(null)}>
          <form onSubmit={registrarPago}>
            <Campo label="Monto" type="number" value={formPago.monto} onChange={(v) => setFormPago({ ...formPago, monto: v })} required />
            <MetodoPago value={formPago.metodo_pago} onChange={(v) => setFormPago({ ...formPago, metodo_pago: v })} />
            <Campo label="N° comprobante (opcional)" value={formPago.comprobante_ref} onChange={(v) => setFormPago({ ...formPago, comprobante_ref: v })} />
            <Campo label="Observación (opcional)" value={formPago.observacion} onChange={(v) => setFormPago({ ...formPago, observacion: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Confirmar pago'}</button>
          </form>
        </Modal>
      )}

      {modalEditarPago && (
        <Modal title="Editar pago registrado" onClose={() => setModalEditarPago(null)}>
          <form onSubmit={editarPago}>
            <Campo label="Monto" type="number" value={formEditarPago.monto} onChange={(v) => setFormEditarPago({ ...formEditarPago, monto: v })} required />
            <Campo label="Fecha de pago" type="datetime-local" value={formEditarPago.fecha_pago} onChange={(v) => setFormEditarPago({ ...formEditarPago, fecha_pago: v })} required />
            <MetodoPago value={formEditarPago.metodo_pago} onChange={(v) => setFormEditarPago({ ...formEditarPago, metodo_pago: v })} />
            <Campo label="Observación (opcional)" value={formEditarPago.observacion} onChange={(v) => setFormEditarPago({ ...formEditarPago, observacion: v })} />
            <button type="submit" disabled={guardando} style={styles.saveBtn}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  )
}

function MetodoPago({ value, onChange }) {
  return (
    <div style={styles.field}>
      <label htmlFor="pago-metodo" style={styles.label}>Método de pago</label>
      <select id="pago-metodo" value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        <option value="efectivo">Efectivo</option>
        <option value="debito">Débito</option>
        <option value="credito">Crédito</option>
        <option value="transferencia">Transferencia</option>
      </select>
    </div>
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
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  kicker: { margin: '0 0 0.25rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.75rem' },
  help: { color: colors.textMuted, fontSize: '0.88rem', lineHeight: 1.5, margin: 0 },
  ok: { color: colors.success, background: '#e8f7ef', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bfe8d1' },
  error: { color: colors.danger, background: colors.dangerLight, padding: '0.75rem 1rem', borderRadius: '10px', border: `1px solid ${colors.dangerLight}` },
  newBtn: { background: colors.primary, color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  tableWrap: { background: colors.cardBg, borderRadius: '12px', boxShadow: shadows.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '980px' },
  theadRow: { background: colors.primaryLight },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: colors.primaryDark, borderBottom: `2px solid ${colors.border}` },
  td: { padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', verticalAlign: 'top' },
  subText: { display: 'block', color: colors.textMuted, fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.35 },
  badge: (estado) => ({
    background: estado === 'pagado' ? '#e8f7ef' : estado === 'parcial' ? '#fff3e0' : colors.dangerLight,
    color: estado === 'pagado' ? colors.success : estado === 'parcial' ? colors.accent : colors.danger,
    padding: '0.22rem 0.62rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
  }),
  paymentLine: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', padding: '0.45rem 0', borderBottom: `1px solid ${colors.border}` },
  inlineActions: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionBtn: { background: 'none', border: `1px solid ${colors.primary}`, color: colors.primary, padding: '0.32rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  actionBtnDanger: { background: 'none', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '0.32rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  field: { marginBottom: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: colors.textDark, fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem', border: `1.5px solid ${colors.border}`, borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' },
  saveBtn: { width: '100%', padding: '0.75rem', background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
}
