import apiClient from './apiClient'

export const notificationApi = {
  getMyNotifications: (page = 0, size = 20) =>
    apiClient.get(`/notifications?page=${page}&size=${size}`),

  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  markAsRead: (notificationId) =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),

  deleteNotification: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),

  deleteAllRead: () =>
    apiClient.delete('/notifications/read'),

  deleteAll: () =>
    apiClient.delete('/notifications/all'),
}
