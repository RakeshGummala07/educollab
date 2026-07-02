import apiClient from './apiClient'

export const mediaApi = {
  uploadImage: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/media/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total)
          onProgress(percent)
        }
      },
    })
  },

  uploadVideo: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/media/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total)
          onProgress(percent)
        }
      },
    })
  },

  uploadAvatar: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/media/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total)
          onProgress(percent)
        }
      },
    })
  },

  deleteFile: (url) => apiClient.delete(`/media/delete?url=${encodeURIComponent(url)}`),
}
