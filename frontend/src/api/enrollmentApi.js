import apiClient from './apiClient'

export const enrollmentApi = {

  // Student
  requestToJoin: (teacherId, message) =>
    apiClient.post(`/enrollments/request/${teacherId}`, { message }),

  cancelRequest: (enrollmentId) =>
    apiClient.delete(`/enrollments/cancel/${enrollmentId}`),

  getMyRequests: () =>
    apiClient.get('/enrollments/my-requests'),

  getMyTeachers: () =>
    apiClient.get('/enrollments/my-teachers'),

  // Teacher
  getPendingRequests: () =>
    apiClient.get('/enrollments/pending-requests'),

  approveRequest: (enrollmentId) =>
    apiClient.put(`/enrollments/approve/${enrollmentId}`),

  rejectRequest: (enrollmentId, reason) =>
    apiClient.put(`/enrollments/reject/${enrollmentId}`, { reason }),

  addStudent: (studentId) =>
    apiClient.post(`/enrollments/add/${studentId}`),

  removeStudent: (studentId) =>
    apiClient.delete(`/enrollments/remove/${studentId}`),

  getMyStudents: () =>
    apiClient.get('/enrollments/my-students'),
}