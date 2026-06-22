// App.jsx — Antes: "/" caia directo en LoginPage y solo existian las
// rutas /login, /dashboard, /alumnos. Ahora "/" es la landing publica,
// el login es un modal, y se agregan /cursos, /asistencia, /pagos
// (las tarjetas del dashboard apuntaban a rutas que no existian).
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AlumnosPage from './pages/AlumnosPage.jsx'
import CursosPage from './pages/CursosPage.jsx'
import AsistenciaPage from './pages/AsistenciaPage.jsx'
import PagosPage from './pages/PagosPage.jsx'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return null // evita un parpadeo a "/" mientras se restaura la sesion
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/alumnos" element={<PrivateRoute><AlumnosPage /></PrivateRoute>} />
          <Route path="/cursos" element={<PrivateRoute><CursosPage /></PrivateRoute>} />
          <Route path="/asistencia" element={<PrivateRoute><AsistenciaPage /></PrivateRoute>} />
          <Route path="/pagos" element={<PrivateRoute><PagosPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
