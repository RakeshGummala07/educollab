import apiClient from './apiClient'

export const postApi = {
  getFeed:        (page = 0, size = 10, filter = 'all') =>
    apiClient.get(`/posts?page=${page}&size=${size}&filter=${filter}`),

  searchPosts:    (q, page = 0, size = 10) =>
    apiClient.get(`/posts/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),

  getPost:        (postId) =>
    apiClient.get(`/posts/${postId}`),

  getPostsByUser: (username, page = 0, size = 10) =>
    apiClient.get(`/posts/user/${username}?page=${page}&size=${size}`),

  getMyStats:     () =>
    apiClient.get('/posts/stats/me'),

  createPost:     (data)         => apiClient.post('/posts', data),
  updatePost:     (postId, data) => apiClient.put(`/posts/${postId}`, data),
  deletePost:     (postId)       => apiClient.delete(`/posts/${postId}`),

  toggleLike:     (postId)       => apiClient.post(`/posts/${postId}/like`),
  sharePost:      (postId)       => apiClient.post(`/posts/${postId}/share`),

  addComment:     (postId, data)            => apiClient.post(`/posts/${postId}/comments`, data),
  getComments:    (postId)                  => apiClient.get(`/posts/${postId}/comments`),
  deleteComment:  (postId, commentId)       =>
    apiClient.delete(`/posts/${postId}/comments/${commentId}`),
}
