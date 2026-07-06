import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import adminApi from '../../api/adminApi'

// ── Thunks ──────────────────────────────────────────────────────────────

export const fetchAdminStudents = createAsyncThunk(
  'admin/fetchStudents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.listStudents()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load students')
    }
  }
)

export const removeStudentAdmin = createAsyncThunk(
  'admin/removeStudent',
  async (studentId, { rejectWithValue }) => {
    try {
      await adminApi.removeStudent(studentId)
      return studentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove student')
    }
  }
)

export const restrictChatAdmin = createAsyncThunk(
  'admin/restrictChat',
  async ({ studentId, reason }, { rejectWithValue }) => {
    try {
      const res = await adminApi.restrictChat(studentId, reason)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to restrict chat')
    }
  }
)

export const unrestrictChatAdmin = createAsyncThunk(
  'admin/unrestrictChat',
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await adminApi.unrestrictChat(studentId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to lift chat restriction')
    }
  }
)

export const lockAccountAdmin = createAsyncThunk(
  'admin/lockAccount',
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await adminApi.lockAccount(studentId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to suspend account')
    }
  }
)

export const unlockAccountAdmin = createAsyncThunk(
  'admin/unlockAccount',
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await adminApi.unlockAccount(studentId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to unsuspend account')
    }
  }
)

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.getAnalytics()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load analytics')
    }
  }
)

export const fetchAuditLogs = createAsyncThunk(
  'admin/fetchAuditLogs',
  async (page = 0, { rejectWithValue }) => {
    try {
      const res = await adminApi.getAuditLogs(page)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load audit log')
    }
  }
)

export const fetchReports = createAsyncThunk(
  'admin/fetchReports',
  async (status = 'all', { rejectWithValue }) => {
    try {
      const res = await adminApi.listReports(status)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load reports')
    }
  }
)

export const resolveReportAdmin = createAsyncThunk(
  'admin/resolveReport',
  async ({ reportId, notes }, { rejectWithValue }) => {
    try {
      const res = await adminApi.resolveReport(reportId, notes)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to resolve report')
    }
  }
)

export const dismissReportAdmin = createAsyncThunk(
  'admin/dismissReport',
  async ({ reportId, notes }, { rejectWithValue }) => {
    try {
      const res = await adminApi.dismissReport(reportId, notes)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to dismiss report')
    }
  }
)

// ── Slice ───────────────────────────────────────────────────────────────

const initialState = {
  students: [],
  studentsLoading: false,
  studentsError: null,

  analytics: null,
  analyticsLoading: false,

  auditLogs: { content: [], totalPages: 0, page: 0 },
  auditLogsLoading: false,

  reports: [],
  reportsLoading: false,
}

const updateStudentInList = (state, updated) => {
  const idx = state.students.findIndex((s) => s.id === updated.id)
  if (idx !== -1) state.students[idx] = updated
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStudents.pending, (state) => { state.studentsLoading = true; state.studentsError = null })
      .addCase(fetchAdminStudents.fulfilled, (state, action) => {
        state.studentsLoading = false
        state.students = action.payload
      })
      .addCase(fetchAdminStudents.rejected, (state, action) => {
        state.studentsLoading = false
        state.studentsError = action.payload
      })

      .addCase(removeStudentAdmin.fulfilled, (state, action) => {
        state.students = state.students.filter((s) => s.id !== action.payload)
      })

      .addCase(restrictChatAdmin.fulfilled, (state, action) => updateStudentInList(state, action.payload))
      .addCase(unrestrictChatAdmin.fulfilled, (state, action) => updateStudentInList(state, action.payload))
      .addCase(lockAccountAdmin.fulfilled, (state, action) => updateStudentInList(state, action.payload))
      .addCase(unlockAccountAdmin.fulfilled, (state, action) => updateStudentInList(state, action.payload))

      .addCase(fetchAnalytics.pending, (state) => { state.analyticsLoading = true })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false
        state.analytics = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state) => { state.analyticsLoading = false })

      .addCase(fetchAuditLogs.pending, (state) => { state.auditLogsLoading = true })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.auditLogsLoading = false
        state.auditLogs = action.payload
      })
      .addCase(fetchAuditLogs.rejected, (state) => { state.auditLogsLoading = false })

      .addCase(fetchReports.pending, (state) => { state.reportsLoading = true })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reportsLoading = false
        state.reports = action.payload
      })
      .addCase(fetchReports.rejected, (state) => { state.reportsLoading = false })

      .addCase(resolveReportAdmin.fulfilled, (state, action) => {
        state.reports = state.reports.map((r) => (r.id === action.payload.id ? action.payload : r))
      })
      .addCase(dismissReportAdmin.fulfilled, (state, action) => {
        state.reports = state.reports.map((r) => (r.id === action.payload.id ? action.payload : r))
      })
  },
})

export default adminSlice.reducer
