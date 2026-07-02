import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { postApi } from '../../api/postApi'

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async ({ page = 0, size = 10, filter = 'all' } = {}, { rejectWithValue }) => {
    try {
      const res = await postApi.getFeed(page, size, filter)
      return { ...res.data.data, page, filter }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load feed')
    }
  }
)

export const fetchMorePosts = createAsyncThunk(
  'feed/fetchMore',
  async ({ page, size = 10, filter = 'all' }, { rejectWithValue }) => {
    try {
      const res = await postApi.getFeed(page, size, filter)
      return { ...res.data.data, page }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load more')
    }
  }
)

export const searchPosts = createAsyncThunk(
  'feed/search',
  async ({ q, page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const res = await postApi.searchPosts(q, page, size)
      return { ...res.data.data, page, query: q }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed')
    }
  }
)

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (data, { rejectWithValue }) => {
    try {
      const res = await postApi.createPost(data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create post')
    }
  }
)

export const updatePost = createAsyncThunk(
  'feed/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const res = await postApi.updatePost(postId, data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update post')
    }
  }
)

export const deletePost = createAsyncThunk(
  'feed/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postApi.deletePost(postId)
      return postId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete post')
    }
  }
)

export const toggleLike = createAsyncThunk(
  'feed/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      const res = await postApi.toggleLike(postId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle like')
    }
  }
)

export const addComment = createAsyncThunk(
  'feed/addComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const res = await postApi.addComment(postId, { content })
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add comment')
    }
  }
)

export const deleteComment = createAsyncThunk(
  'feed/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      const res = await postApi.deleteComment(postId, commentId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete comment')
    }
  }
)

export const sharePost = createAsyncThunk(
  'feed/sharePost',
  async (postId, { rejectWithValue }) => {
    try {
      const res = await postApi.sharePost(postId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to share post')
    }
  }
)

export const fetchAllComments = createAsyncThunk(
  'feed/fetchAllComments',
  async (postId, { rejectWithValue }) => {
    try {
      const res = await postApi.getComments(postId)
      return { postId, comments: res.data.data }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load comments')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────
const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts:          [],
    page:           0,
    totalPages:     0,
    totalElements:  0,
    hasMore:        true,
    activeFilter:   'all',
    searchQuery:    '',
    isSearching:    false,
    isLoading:      false,
    isLoadingMore:  false,
    isCreating:     false,
    error:          null,
    expandedComments: {},  // postId → [comments]
  },
  reducers: {
    clearFeed(state) {
      state.posts         = []
      state.page          = 0
      state.hasMore       = true
      state.searchQuery   = ''
      state.isSearching   = false
    },
    setFilter(state, action) {
      state.activeFilter = action.payload
      state.posts        = []
      state.page         = 0
      state.hasMore      = true
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload
    },
    clearError(state) { state.error = null },
    clearExpandedComments(state, action) {
      delete state.expandedComments[action.payload]
    },
  },
  extraReducers: (builder) => {
    // fetchFeed
    builder
      .addCase(fetchFeed.pending,   (s) => { s.isLoading = true; s.error = null })
      .addCase(fetchFeed.fulfilled, (s, a) => {
        s.isLoading      = false
        s.posts          = a.payload.content
        s.page           = 0
        s.totalPages     = a.payload.totalPages
        s.totalElements  = a.payload.totalElements
        s.hasMore        = !a.payload.last
        s.activeFilter   = a.payload.filter || 'all'
        s.isSearching    = false
        s.searchQuery    = ''
      })
      .addCase(fetchFeed.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // fetchMorePosts
    builder
      .addCase(fetchMorePosts.pending,   (s) => { s.isLoadingMore = true })
      .addCase(fetchMorePosts.fulfilled, (s, a) => {
        s.isLoadingMore = false
        s.posts         = [...s.posts, ...a.payload.content]
        s.page          = a.payload.page
        s.hasMore       = !a.payload.last
      })
      .addCase(fetchMorePosts.rejected, (s) => { s.isLoadingMore = false })

    // searchPosts
    builder
      .addCase(searchPosts.pending,   (s) => { s.isLoading = true; s.isSearching = true })
      .addCase(searchPosts.fulfilled, (s, a) => {
        s.isLoading     = false
        s.posts         = a.payload.content
        s.totalElements = a.payload.totalElements
        s.hasMore       = !a.payload.last
        s.searchQuery   = a.payload.query
      })
      .addCase(searchPosts.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // createPost
    builder
      .addCase(createPost.pending,   (s) => { s.isCreating = true; s.error = null })
      .addCase(createPost.fulfilled, (s, a) => {
        s.isCreating    = false
        s.posts         = [a.payload, ...s.posts]
        s.totalElements += 1
      })
      .addCase(createPost.rejected, (s, a) => { s.isCreating = false; s.error = a.payload })

    // updatePost
    builder.addCase(updatePost.fulfilled, (s, a) => {
      const idx = s.posts.findIndex(p => p.id === a.payload.id)
      if (idx !== -1) s.posts[idx] = a.payload
    })

    // deletePost
    builder.addCase(deletePost.fulfilled, (s, a) => {
      s.posts         = s.posts.filter(p => p.id !== a.payload)
      s.totalElements = Math.max(0, s.totalElements - 1)
    })

    // In-place updates
    const updateInPlace = (s, a) => {
      const idx = s.posts.findIndex(p => p.id === a.payload.id)
      if (idx !== -1) s.posts[idx] = a.payload
    }
    builder
      .addCase(toggleLike.fulfilled,    updateInPlace)
      .addCase(addComment.fulfilled,    updateInPlace)
      .addCase(deleteComment.fulfilled, updateInPlace)
      .addCase(sharePost.fulfilled,     updateInPlace)

    // fetchAllComments
    builder.addCase(fetchAllComments.fulfilled, (s, a) => {
      s.expandedComments[a.payload.postId] = a.payload.comments
    })
  },
})

export const {
  clearFeed, setFilter, setSearchQuery, clearError, clearExpandedComments
} = feedSlice.actions

// Selectors
export const selectPosts             = (s) => s.feed.posts
export const selectFeedLoading       = (s) => s.feed.isLoading
export const selectFeedLoadingMore   = (s) => s.feed.isLoadingMore
export const selectFeedCreating      = (s) => s.feed.isCreating
export const selectFeedError         = (s) => s.feed.error
export const selectFeedHasMore       = (s) => s.feed.hasMore
export const selectFeedPage          = (s) => s.feed.page
export const selectTotalPosts        = (s) => s.feed.totalElements
export const selectActiveFilter      = (s) => s.feed.activeFilter
export const selectSearchQuery       = (s) => s.feed.searchQuery
export const selectIsSearching       = (s) => s.feed.isSearching
export const selectExpandedComments  = (s) => s.feed.expandedComments

export default feedSlice.reducer
