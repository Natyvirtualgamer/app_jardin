import { createContext, useContext, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  async function login(email, password) {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    const res = await api.post('/auth/login', formData)
    setToken(res.data.access_token)
    setUser({ nombre: res.data.nombre, rol: res.data.rol })
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`
  }

  function logout() {
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
