import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaura la sesion al recargar la pagina (F5). Antes token/user vivian
  // solo en useState (memoria), por eso se perdian al refrescar.
  useEffect(() => {
    const storedToken = localStorage.getItem('jardin_token')
    const storedUser = localStorage.getItem('jardin_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  async function login(email, password, expectedAudience) {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    const res = await api.post('/auth/login', formData)
    const rol = res.data.rol

    if (expectedAudience === 'staff' && rol === 'apoderado') {
      throw new Error('Tu cuenta corresponde a un apoderado. Ingresa desde el acceso de familias.')
    }
    if (expectedAudience === 'familia' && rol !== 'apoderado') {
      throw new Error('Tu cuenta corresponde al personal del jardín. Ingresa desde el acceso de personal.')
    }

    const nuevoUsuario = { nombre: res.data.nombre, rol: res.data.rol }
    setToken(res.data.access_token)
    setUser(nuevoUsuario)
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`
    localStorage.setItem('jardin_token', res.data.access_token)
    localStorage.setItem('jardin_user', JSON.stringify(nuevoUsuario))
    return rol
  }

  function logout() {
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('jardin_token')
    localStorage.removeItem('jardin_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
