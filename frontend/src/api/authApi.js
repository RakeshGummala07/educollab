import apiClient from './apiClient'

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
}
