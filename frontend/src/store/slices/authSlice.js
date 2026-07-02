import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../api/authApi'

// ── Async Thunks ──────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data)
      return response.data.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.response?.data?.data || 'Registration failed'
      )
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.login(data)
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try { await authApi.logout() } finally { dispatch(logout()) }
  }
)

// ── Persist helpers ───────────────────────────────────────────────────────
const loadPersistedAuth = () => {
  try {
    const s = localStorage.getItem('educollab_auth')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

const persist = (state) => {
  localStorage.setItem('educollab_auth', JSON.stringify({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  }))
}

const p = loadPersistedAuth()

const initialState = {
  user: p?.user || null,
  accessToken: p?.accessToken || null,
  refreshToken: p?.refreshToken || null,
  isAuthenticated: !!p?.accessToken,
  isLoading: false,
  error: null,
}

// ── Slice ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('educollab_auth')
    },
    setCredentials(state, action) {
      const { accessToken, refreshToken } = action.payload
      state.accessToken = accessToken
      if (refreshToken) state.refreshToken = refreshToken
      persist(state)
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      persist(state)
    },
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    const handleAuth = (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      persist(state)
    }

    builder
      .addCase(registerUser.pending,   (s) => { s.isLoading = true;  s.error = null })
      .addCase(registerUser.fulfilled, handleAuth)
      .addCase(registerUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

      .addCase(loginUser.pending,   (s) => { s.isLoading = true;  s.error = null })
      .addCase(loginUser.fulfilled, handleAuth)
      .addCase(loginUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })
  },
})

export const { logout, setCredentials, updateUser, clearError } = authSlice.actions

// ── Selectors ─────────────────────────────────────────────────────────────
export const selectCurrentUser    = (s) => s.auth.user
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated
export const selectAuthLoading    = (s) => s.auth.isLoading
export const selectAuthError      = (s) => s.auth.error
export const selectAccessToken    = (s) => s.auth.accessToken

export default authSlice.reducer
