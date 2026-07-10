import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_URL?.trim() || '/api/v1'

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
})

// Interceptor para manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api
