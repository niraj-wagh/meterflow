import axios from 'axios'
import { useAuthStore } from '../store/authStore'


const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,   // 30s timeout — Render free tier cold start can be slow
  withCredentials: false,
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

// Handle 401 → refresh → retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true
      try {
        const { refreshToken, setAuth, user } = useAuthStore.getState()
        if (!refreshToken) throw new Error('No refresh token')

        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        )
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data
        setAuth(user, newAccess, newRefresh)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api