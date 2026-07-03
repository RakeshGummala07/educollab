import { configureStore } from '@reduxjs/toolkit'
import authReducer       from './slices/authSlice'
import profileReducer    from './slices/profileSlice'
import feedReducer       from './slices/feedSlice'
import enrollmentReducer from './slices/enrollmentSlice'
import chatReducer       from './slices/chatSlice'
import notificationReducer from './slices/notificationSlice'
import meetingReducer     from './slices/meetingSlice'

export const store = configureStore({
  reducer: {
    auth:       authReducer,
    profile:    profileReducer,
    feed:       feedReducer,
    enrollment: enrollmentReducer,
    chat:       chatReducer,
    notifications: notificationReducer,
    meetings:   meetingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})
