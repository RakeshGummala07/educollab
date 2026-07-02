import axios from 'axios'
import { store } from '../store'
import { logout, setCredentials } from '../store/slices/authSlice'

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Request interceptor: attach access token ──────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = store.getState().auth.refreshToken

      if (!refreshToken) {
        store.dispatch(logout())
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        store.dispatch(setCredentials({ accessToken, refreshToken: newRefreshToken }))
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(logout())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
