import apiClient from './apiClient'

const aiApi = {
  // ── Chat ─────────────────────────────────────────────────────────────
  sendMessage: (conversationId, message, useDocumentContext = true) =>
    apiClient.post('/ai/chat', { conversationId, message, useDocumentContext }),
  listConversations: () => apiClient.get('/ai/conversations'),
  getMessages: (conversationId) => apiClient.get(`/ai/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId) => apiClient.delete(`/ai/conversations/${conversationId}`),

  // ── Usage / token quota ──────────────────────────────────────────────
  getUsage: () => apiClient.get('/ai/usage'),

  // ── Documents (RAG) ──────────────────────────────────────────────────
  uploadDocument: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/ai/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
  },
  listDocuments: () => apiClient.get('/ai/documents'),
  deleteDocument: (documentId) => apiClient.delete(`/ai/documents/${documentId}`),

  // ── Study tools ──────────────────────────────────────────────────────
  generateQuiz: (data) => apiClient.post('/ai/quiz', data),
  generateAssignment: (data) => apiClient.post('/ai/assignment', data),
  summarize: (data) => apiClient.post('/ai/summarize', data),
}

export default aiApi
