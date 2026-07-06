import apiClient from './apiClient'

const reportApi = {
  submitReport: (data) => apiClient.post('/reports', data),
}

export default reportApi
