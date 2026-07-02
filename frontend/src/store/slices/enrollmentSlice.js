import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { enrollmentApi } from '../../api/enrollmentApi'

// ── Thunks ────────────────────────────────────────────────────────────────

// Student
export const requestToJoin = createAsyncThunk(
  'enrollment/requestToJoin',
  async ({ teacherId, message }, { rejectWithValue }) => {
    try {
      await enrollmentApi.requestToJoin(teacherId, message)
      return teacherId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send request')
    }
  }
)

export const cancelRequest = createAsyncThunk(
  'enrollment/cancelRequest',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      await enrollmentApi.cancelRequest(enrollmentId)
      return enrollmentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel request')
    }
  }
)

export const fetchMyRequests = createAsyncThunk(
  'enrollment/fetchMyRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await enrollmentApi.getMyRequests()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load requests')
    }
  }
)

export const fetchMyTeachers = createAsyncThunk(
  'enrollment/fetchMyTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await enrollmentApi.getMyTeachers()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load teachers')
    }
  }
)

export const fetchAllTeachersToRequest = createAsyncThunk(
  'enrollment/fetchAllTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const { userApi } = await import('../../api/userApi')
      const res = await userApi.getAllTeachers()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load teachers')
    }
  }
)

// Teacher
export const fetchPendingRequests = createAsyncThunk(
  'enrollment/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await enrollmentApi.getPendingRequests()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load requests')
    }
  }
)

export const approveRequest = createAsyncThunk(
  'enrollment/approveRequest',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      await enrollmentApi.approveRequest(enrollmentId)
      return enrollmentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve')
    }
  }
)

export const rejectRequest = createAsyncThunk(
  'enrollment/rejectRequest',
  async ({ enrollmentId, reason }, { rejectWithValue }) => {
    try {
      await enrollmentApi.rejectRequest(enrollmentId, reason)
      return enrollmentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject')
    }
  }
)

export const fetchMyStudents = createAsyncThunk(
  'enrollment/fetchMyStudents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await enrollmentApi.getMyStudents()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load students')
    }
  }
)

export const addStudentDirectly = createAsyncThunk(
  'enrollment/addStudent',
  async (studentId, { rejectWithValue }) => {
    try {
      await enrollmentApi.addStudent(studentId)
      return studentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add student')
    }
  }
)

export const removeStudent = createAsyncThunk(
  'enrollment/removeStudent',
  async (studentId, { rejectWithValue }) => {
    try {
      await enrollmentApi.removeStudent(studentId)
      return studentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove student')
    }
  }
)

export const fetchAllStudentsToAdd = createAsyncThunk(
  'enrollment/fetchAllStudents',
  async (_, { rejectWithValue }) => {
    try {
      const { userApi } = await import('../../api/userApi')
      const res = await userApi.getAllStudents()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load students')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    // Teacher state
    myStudents:       [],
    pendingRequests:  [],
    allStudents:      [],

    // Student state
    myTeachers:       [],
    myRequests:       [],
    allTeachers:      [],

    isLoading:   false,
    isActing:    false,
    error:       null,
    successMsg:  null,
  },
  reducers: {
    clearMessages(state) {
      state.error      = null
      state.successMsg = null
    },
  },
  extraReducers: (builder) => {
    // ── Student thunks ────────────────────────────────────────────────────
    builder
      .addCase(requestToJoin.pending,   (s) => { s.isActing = true; s.error = null })
      .addCase(requestToJoin.fulfilled, (s) => {
        s.isActing   = false
        s.successMsg = 'Join request sent! Waiting for teacher approval.'
      })
      .addCase(requestToJoin.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(cancelRequest.pending,   (s) => { s.isActing = true })
      .addCase(cancelRequest.fulfilled, (s, a) => {
        s.isActing      = false
        s.myRequests    = s.myRequests.filter(r => r.id !== a.payload)
        s.successMsg    = 'Request cancelled'
      })
      .addCase(cancelRequest.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(fetchMyRequests.pending,   (s) => { s.isLoading = true })
      .addCase(fetchMyRequests.fulfilled, (s, a) => { s.isLoading = false; s.myRequests = a.payload })
      .addCase(fetchMyRequests.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(fetchMyTeachers.pending,   (s) => { s.isLoading = true })
      .addCase(fetchMyTeachers.fulfilled, (s, a) => { s.isLoading = false; s.myTeachers = a.payload })
      .addCase(fetchMyTeachers.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(fetchAllTeachersToRequest.pending,   (s) => { s.isLoading = true })
      .addCase(fetchAllTeachersToRequest.fulfilled, (s, a) => { s.isLoading = false; s.allTeachers = a.payload })
      .addCase(fetchAllTeachersToRequest.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    // ── Teacher thunks ────────────────────────────────────────────────────
    builder
      .addCase(fetchPendingRequests.pending,   (s) => { s.isLoading = true })
      .addCase(fetchPendingRequests.fulfilled, (s, a) => { s.isLoading = false; s.pendingRequests = a.payload })
      .addCase(fetchPendingRequests.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(approveRequest.pending,   (s) => { s.isActing = true; s.error = null })
      .addCase(approveRequest.fulfilled, (s, a) => {
        s.isActing       = false
        s.successMsg     = 'Student approved!'
        s.pendingRequests = s.pendingRequests.filter(r => r.id !== a.payload)
      })
      .addCase(approveRequest.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(rejectRequest.pending,   (s) => { s.isActing = true; s.error = null })
      .addCase(rejectRequest.fulfilled, (s, a) => {
        s.isActing       = false
        s.successMsg     = 'Request rejected'
        s.pendingRequests = s.pendingRequests.filter(r => r.id !== a.payload)
      })
      .addCase(rejectRequest.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(fetchMyStudents.pending,   (s) => { s.isLoading = true })
      .addCase(fetchMyStudents.fulfilled, (s, a) => { s.isLoading = false; s.myStudents = a.payload })
      .addCase(fetchMyStudents.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(addStudentDirectly.pending,   (s) => { s.isActing = true; s.error = null })
      .addCase(addStudentDirectly.fulfilled, (s) => {
        s.isActing   = false
        s.successMsg = 'Student added successfully!'
      })
      .addCase(addStudentDirectly.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(removeStudent.pending,   (s) => { s.isActing = true })
      .addCase(removeStudent.fulfilled, (s, a) => {
        s.isActing   = false
        s.myStudents = s.myStudents.filter(st => st.id !== a.payload)
        s.successMsg = 'Student removed from community'
      })
      .addCase(removeStudent.rejected,  (s, a) => { s.isActing = false; s.error = a.payload })

    builder
      .addCase(fetchAllStudentsToAdd.pending,   (s) => { s.isLoading = true })
      .addCase(fetchAllStudentsToAdd.fulfilled, (s, a) => { s.isLoading = false; s.allStudents = a.payload })
      .addCase(fetchAllStudentsToAdd.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })
  },
})

export const { clearMessages } = enrollmentSlice.actions

// Selectors
export const selectMyStudents       = (s) => s.enrollment.myStudents
export const selectMyTeachers       = (s) => s.enrollment.myTeachers
export const selectPendingRequests  = (s) => s.enrollment.pendingRequests
export const selectMyRequests       = (s) => s.enrollment.myRequests
export const selectAllTeachers      = (s) => s.enrollment.allTeachers
export const selectAllStudents      = (s) => s.enrollment.allStudents
export const selectEnrollLoading    = (s) => s.enrollment.isLoading
export const selectEnrollActing     = (s) => s.enrollment.isActing
export const selectEnrollError      = (s) => s.enrollment.error
export const selectEnrollSuccess    = (s) => s.enrollment.successMsg

export default enrollmentSlice.reducer
