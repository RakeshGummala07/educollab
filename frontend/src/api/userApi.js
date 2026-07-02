import apiClient from './apiClient'

export const userApi = {
  getMyProfile:        ()           => apiClient.get('/users/me'),
  updateMyProfile:     (data)       => apiClient.put('/users/me', data),
  changePassword:      (data)       => apiClient.put('/users/me/password', data),
  getProfileByUsername:(username)   => apiClient.get(`/users/${username}`),
  getAllTeachers:       ()           => apiClient.get('/users/teachers'),
  getAllStudents:       ()           => apiClient.get('/users/students'),
  getAllUsers:          ()           => apiClient.get('/users/all'),
  toggleUserLock:      (userId)     => apiClient.put(`/users/${userId}/toggle-lock`),
}
