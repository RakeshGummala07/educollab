import apiClient from './apiClient'

export const chatApi = {
  getMyConversations: () =>
    apiClient.get('/chat/conversations'),

  getOrCreateDirectConversation: (otherUserId) =>
    apiClient.post(`/chat/conversations/direct/${otherUserId}`),

  createGroupConversation: (data) =>
    apiClient.post('/chat/conversations/group', data),

  getMessages: (conversationId, page = 0, size = 30) =>
    apiClient.get(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`),

  sendMessage: (conversationId, data) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, data),

  markAsRead: (conversationId) =>
    apiClient.put(`/chat/conversations/${conversationId}/read`),

  deleteMessageForMe: (messageId) =>
    apiClient.delete(`/chat/messages/${messageId}/me`),

  deleteMessageForEveryone: (messageId, conversationId) =>
    apiClient.delete(`/chat/messages/${messageId}/everyone?conversationId=${conversationId}`),

  deleteConversation: (conversationId) =>
    apiClient.delete(`/chat/conversations/${conversationId}`),
}
