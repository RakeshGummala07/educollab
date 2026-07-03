import apiClient from './apiClient'

const meetingApi = {
  // ── Core ──────────────────────────────────────────────────────────────
  createMeeting: (data) => apiClient.post('/meetings', data),
  listMeetings: (status = 'all') => apiClient.get('/meetings', { params: { status } }),
  getMeeting: (meetingId) => apiClient.get(`/meetings/${meetingId}`),
  deleteMeeting: (meetingId) => apiClient.delete(`/meetings/${meetingId}`),

  // ── Lifecycle ────────────────────────────────────────────────────────
  startMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/start`),
  joinMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/join`),
  leaveMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/leave`),
  endMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/end`),

  // ── Attendance ───────────────────────────────────────────────────────
  getAttendance: (meetingId) => apiClient.get(`/meetings/${meetingId}/attendance`),
  listParticipants: (meetingId) => apiClient.get(`/meetings/${meetingId}/participants`),

  // ── Waiting room ─────────────────────────────────────────────────────
  listWaitingRoom: (meetingId) => apiClient.get(`/meetings/${meetingId}/waiting-room`),
  approveWaiting: (meetingId, userId) =>
    apiClient.post(`/meetings/${meetingId}/waiting-room/${userId}/approve`),
  denyWaiting: (meetingId, userId) =>
    apiClient.post(`/meetings/${meetingId}/waiting-room/${userId}/deny`),

  // ── Moderation ───────────────────────────────────────────────────────
  promoteToCoHost: (meetingId, userId) =>
    apiClient.post(`/meetings/${meetingId}/participants/${userId}/promote`),
  demoteToParticipant: (meetingId, userId) =>
    apiClient.post(`/meetings/${meetingId}/participants/${userId}/demote`),
  kickParticipant: (meetingId, userId) =>
    apiClient.post(`/meetings/${meetingId}/participants/${userId}/kick`),
  muteParticipantAudio: (meetingId, userId, muted = true) =>
    apiClient.post(`/meetings/${meetingId}/participants/${userId}/mute-audio`, null, { params: { muted } }),
  muteParticipantVideo: (meetingId, userId, off = true) =>
    apiClient.post(`/meetings/${meetingId}/participants/${userId}/mute-video`, null, { params: { off } }),
  muteAll: (meetingId) => apiClient.post(`/meetings/${meetingId}/mute-all`),
  lockMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/lock`),
  unlockMeeting: (meetingId) => apiClient.post(`/meetings/${meetingId}/unlock`),
  setChatMode: (meetingId, chatMode) => apiClient.put(`/meetings/${meetingId}/chat-mode`, { chatMode }),

  // ── Hand raise & screen share ───────────────────────────────────────
  toggleHandRaise: (meetingId) => apiClient.post(`/meetings/${meetingId}/hand-raise`),
  startScreenShare: (meetingId) => apiClient.post(`/meetings/${meetingId}/screen-share/start`),
  stopScreenShare: (meetingId) => apiClient.post(`/meetings/${meetingId}/screen-share/stop`),

  // ── Chat ─────────────────────────────────────────────────────────────
  getChatHistory: (meetingId) => apiClient.get(`/meetings/${meetingId}/chat`),
}

export default meetingApi
