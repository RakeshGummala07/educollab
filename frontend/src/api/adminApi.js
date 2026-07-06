import apiClient from './apiClient'

const adminApi = {
  // ── Student management ──────────────────────────────────────────────
  listStudents: () => apiClient.get('/admin/students'),
  removeStudent: (studentId) => apiClient.delete(`/admin/students/${studentId}`),
  restrictChat: (studentId, reason) => apiClient.post(`/admin/students/${studentId}/restrict-chat`, { reason }),
  unrestrictChat: (studentId) => apiClient.post(`/admin/students/${studentId}/unrestrict-chat`),
  lockAccount: (studentId) => apiClient.post(`/admin/students/${studentId}/lock`),
  unlockAccount: (studentId) => apiClient.post(`/admin/students/${studentId}/unlock`),

  // ── Analytics ────────────────────────────────────────────────────────
  getAnalytics: () => apiClient.get('/admin/analytics'),

  // ── Audit log ────────────────────────────────────────────────────────
  getAuditLogs: (page = 0, size = 20) => apiClient.get('/admin/audit-logs', { params: { page, size } }),

  // ── Reports (moderation queue) ──────────────────────────────────────
  listReports: (status = 'all') => apiClient.get('/admin/reports', { params: { status } }),
  resolveReport: (reportId, notes) => apiClient.post(`/admin/reports/${reportId}/resolve`, { notes }),
  dismissReport: (reportId, notes) => apiClient.post(`/admin/reports/${reportId}/dismiss`, { notes }),
}

export default adminApi
