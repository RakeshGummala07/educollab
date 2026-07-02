import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { userApi } from '../../api/userApi'
import { updateUser } from './authSlice'

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchMyProfile = createAsyncThunk(
  'profile/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getMyProfile()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load profile')
    }
  }
)

export const updateMyProfile = createAsyncThunk(
  'profile/updateMy',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await userApi.updateMyProfile(data)
      const profile = res.data.data
      // Sync name/avatar back into auth user object
      dispatch(updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
      }))
      return profile
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed')
    }
  }
)

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      await userApi.changePassword(data)
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Password change failed')
    }
  }
)

export const fetchAllStudents = createAsyncThunk(
  'profile/fetchStudents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getAllStudents()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load students')
    }
  }
)

export const fetchAllTeachers = createAsyncThunk(
  'profile/fetchTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getAllTeachers()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load teachers')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────
const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    myProfile: null,
    students: [],
    teachers: [],
    isLoading: false,
    isUpdating: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearProfileMessages(state) {
      state.error = null
      state.successMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyProfile
      .addCase(fetchMyProfile.pending,   (s) => { s.isLoading = true;  s.error = null })
      .addCase(fetchMyProfile.fulfilled, (s, a) => { s.isLoading = false; s.myProfile = a.payload })
      .addCase(fetchMyProfile.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

      // updateMyProfile
      .addCase(updateMyProfile.pending,   (s) => { s.isUpdating = true;  s.error = null; s.successMessage = null })
      .addCase(updateMyProfile.fulfilled, (s, a) => {
        s.isUpdating = false
        s.myProfile = a.payload
        s.successMessage = 'Profile updated successfully!'
      })
      .addCase(updateMyProfile.rejected,  (s, a) => { s.isUpdating = false; s.error = a.payload })

      // changePassword
      .addCase(changePassword.pending,   (s) => { s.isUpdating = true;  s.error = null; s.successMessage = null })
      .addCase(changePassword.fulfilled, (s) => { s.isUpdating = false; s.successMessage = 'Password changed successfully!' })
      .addCase(changePassword.rejected,  (s, a) => { s.isUpdating = false; s.error = a.payload })

      // fetchAllStudents
      .addCase(fetchAllStudents.fulfilled, (s, a) => { s.students = a.payload })

      // fetchAllTeachers
      .addCase(fetchAllTeachers.fulfilled, (s, a) => { s.teachers = a.payload })
  },
})

export const { clearProfileMessages } = profileSlice.actions

export const selectMyProfile      = (s) => s.profile.myProfile
export const selectProfileLoading = (s) => s.profile.isLoading
export const selectProfileUpdating = (s) => s.profile.isUpdating
export const selectProfileError   = (s) => s.profile.error
export const selectProfileSuccess = (s) => s.profile.successMessage
export const selectStudents       = (s) => s.profile.students
export const selectTeachers       = (s) => s.profile.teachers

export default profileSlice.reducer
