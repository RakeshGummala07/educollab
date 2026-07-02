import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationApi } from '../../api/notificationApi'

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 0, size = 20 } = {}, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getMyNotifications(page, size)
      return { ...res.data.data, page }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load notifications')
    }
  }
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getUnreadCount()
      return res.data.data.count
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load count')
    }
  }
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.markAsRead(notificationId)
      return notificationId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read')
    }
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead()
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read')
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.deleteNotification(notificationId)
      return notificationId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification')
    }
  }
)

export const deleteAllReadNotifications = createAsyncThunk(
  'notifications/deleteAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.deleteAllRead()
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete read notifications')
    }
  }
)

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.deleteAll()
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete all notifications')
    }
  }
)


const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    page: 0,
    hasMore: true,
    unreadCount: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    // Real-time notification arriving via WebSocket
    receiveNotification(state, action) {
      const notif = action.payload
      const exists = state.items.some(n => n.id === notif.id)
      if (!exists) {
        state.items.unshift(notif)
      }
      if (!notif.read) {
        state.unreadCount += 1
      }
    },
    clearNotificationsError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.isLoading = true })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.isLoading = false
        if (a.payload.page === 0) {
          s.items = a.payload.content
        } else {
          s.items = [...s.items, ...a.payload.content]
        }
        s.page = a.payload.page
        s.hasMore = !a.payload.last
      })
      .addCase(fetchNotifications.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    builder.addCase(fetchUnreadCount.fulfilled, (s, a) => {
      s.unreadCount = a.payload
    })

    builder.addCase(markNotificationRead.fulfilled, (s, a) => {
      const notif = s.items.find(n => n.id === a.payload)
      if (notif && !notif.read) {
        notif.read = true
        s.unreadCount = Math.max(0, s.unreadCount - 1)
      }
    })

    builder.addCase(markAllNotificationsRead.fulfilled, (s) => {
      s.items.forEach(n => { n.read = true })
      s.unreadCount = 0
    })

    builder.addCase(deleteNotification.fulfilled, (s, a) => {
      const deletedId = a.payload // the notificationId returned from the thunk
      s.items = s.items.filter(n => String(n.id) !== String(deletedId))
      s.unreadCount = s.items.filter(n => !n.read).length
    })

    builder.addCase(deleteAllReadNotifications.fulfilled, (s) => {
      s.items = s.items.filter(n => !n.read)
      // unreadCount stays the same — only read ones were deleted
    })

    builder.addCase(deleteAllNotifications.fulfilled, (s) => {
      s.items = []
      s.unreadCount = 0
    })
  },
})

export const { receiveNotification, clearNotificationsError } = notificationSlice.actions

export const selectNotifications        = (s) => s.notifications.items
export const selectUnreadNotifCount     = (s) => s.notifications.unreadCount
export const selectNotificationsLoading = (s) => s.notifications.isLoading
export const selectNotificationsHasMore = (s) => s.notifications.hasMore

export default notificationSlice.reducer
