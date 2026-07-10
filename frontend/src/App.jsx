// App.jsx — Antes: "/" caia directo en LoginPage y solo existian las
// rutas /login, /dashboard, /alumnos. Ahora "/" es la landing publica,
// el login es un modal, y se agregan /cursos, /asistencia, /pagos
// (las tarjetas del dashboard apuntaban a rutas que no existian).
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AlumnosPage from './pages/AlumnosPage.jsx'
import ApoderadosPage from './pages/ApoderadosPage.jsx'
import CursosPage from './pages/CursosPage.jsx'
import EducadorasPage from './pages/EducadorasPage.jsx'
import AsistenciaPage from './pages/AsistenciaPage.jsx'
import PagosPage from './pages/PagosPage.jsx'
import UsuariosPage from './pages/UsuariosPage.jsx'
import ApoderadoPortal from './pages/ApoderadoPortal.jsx'

const STAFF_ROLES = ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion']

const ROUTE_ROLES = {
  dashboard: STAFF_ROLES,
  alumnos: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'],
  apoderados: ['administrador', 'direccion', 'recepcion'],
  cursos: ['administrador', 'direccion', 'educadora', 'finanzas', 'recepcion'],
  educadoras: ['administrador', 'direccion', 'recepcion'],
  asistencia: ['administrador', 'direccion', 'educadora', 'recepcion'],
  pagos: ['administrador', 'direccion', 'finanzas'],
  usuarios: ['administrador'],
  portal: ['apoderado'],
}

function destinoPorRol(user) {
  return user?.rol === 'apoderado' ? '/portal' : '/dashboard'
}

function RoleRoute({ children, roles }) {
  const { token, user, loading } = useAuth()
  if (loading) return null // evita un parpadeo a "/" mientras se restaura la sesion
  if (!token) return <Navigate to="/" replace />
  // Capa de UX: la API sigue siendo la fuente de seguridad con require_roles.
  if (!roles.includes(user?.rol)) return <Navigate to={destinoPorRol(user)} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<RoleRoute roles={ROUTE_ROLES.dashboard}><DashboardPage /></RoleRoute>} />
          <Route path="/alumnos" element={<RoleRoute roles={ROUTE_ROLES.alumnos}><AlumnosPage /></RoleRoute>} />
          <Route path="/apoderados" element={<RoleRoute roles={ROUTE_ROLES.apoderados}><ApoderadosPage /></RoleRoute>} />
          <Route path="/cursos" element={<RoleRoute roles={ROUTE_ROLES.cursos}><CursosPage /></RoleRoute>} />
          <Route path="/educadoras" element={<RoleRoute roles={ROUTE_ROLES.educadoras}><EducadorasPage /></RoleRoute>} />
          <Route path="/asistencia" element={<RoleRoute roles={ROUTE_ROLES.asistencia}><AsistenciaPage /></RoleRoute>} />
          <Route path="/pagos" element={<RoleRoute roles={ROUTE_ROLES.pagos}><PagosPage /></RoleRoute>} />
          <Route path="/usuarios" element={<RoleRoute roles={ROUTE_ROLES.usuarios}><UsuariosPage /></RoleRoute>} />
          <Route path="/portal" element={<RoleRoute roles={ROUTE_ROLES.portal}><ApoderadoPortal /></RoleRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
