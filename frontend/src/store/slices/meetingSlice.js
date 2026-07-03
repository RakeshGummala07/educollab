import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import meetingApi from '../../api/meetingApi'

// ── Thunks ──────────────────────────────────────────────────────────────

export const fetchMeetings = createAsyncThunk(
  'meetings/fetchAll',
  async (status = 'all', { rejectWithValue }) => {
    try {
      const res = await meetingApi.listMeetings(status)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meetings')
    }
  }
)

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await meetingApi.createMeeting(data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create meeting')
    }
  }
)

export const deleteMeeting = createAsyncThunk(
  'meetings/delete',
  async (meetingId, { rejectWithValue }) => {
    try {
      await meetingApi.deleteMeeting(meetingId)
      return meetingId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete meeting')
    }
  }
)

export const joinMeetingRoom = createAsyncThunk(
  'meetings/join',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.joinMeeting(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to join meeting')
    }
  }
)

export const endMeetingRoom = createAsyncThunk(
  'meetings/end',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.endMeeting(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to end meeting')
    }
  }
)

export const fetchAttendance = createAsyncThunk(
  'meetings/fetchAttendance',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.getAttendance(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load attendance')
    }
  }
)

export const fetchParticipants = createAsyncThunk(
  'meetings/fetchParticipants',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.listParticipants(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load participants')
    }
  }
)

export const fetchWaitingRoom = createAsyncThunk(
  'meetings/fetchWaitingRoom',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.listWaitingRoom(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load waiting room')
    }
  }
)

export const fetchMeetingChatHistory = createAsyncThunk(
  'meetings/fetchChatHistory',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.getChatHistory(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load chat history')
    }
  }
)

export const fetchMeetingDetail = createAsyncThunk(
  'meetings/fetchDetail',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.getMeeting(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meeting')
    }
  }
)

export const startMeetingRoom = createAsyncThunk(
  'meetings/start',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await meetingApi.startMeeting(meetingId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start meeting')
    }
  }
)

// ── Slice ───────────────────────────────────────────────────────────────

const initialState = {
  list: [],
  listLoading: false,
  listError: null,

  activeMeeting: null,     // MeetingResponse for the room currently open
  joinInfo: null,          // { livekitUrl, token, role, waiting }
  joinLoading: false,
  joinError: null,
  waitingForApproval: false,

  chatMessages: [],
  waitingRoom: [],
  attendance: [],

  // live moderation/participant state keyed by userId
  moderationEvents: [],    // last few events, for toast/snackbar display
  participantEventTick: 0, // bumped on every participant WS event (join/leave/hand-raise/screen-share)
}

const meetingSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    clearActiveMeeting: (state) => {
      state.activeMeeting = null
      state.joinInfo = null
      state.chatMessages = []
      state.waitingRoom = []
      state.attendance = []
      state.waitingForApproval = false
      state.moderationEvents = []
      state.participantEventTick = 0
    },
    receiveMeetingChatMessage: (state, action) => {
      state.chatMessages.push(action.payload)
    },
    receiveWaitingRoomRequest: (state, action) => {
      const exists = state.waitingRoom.some((r) => r.userId === action.payload.userId)
      if (!exists) state.waitingRoom.push(action.payload)
    },
    removeFromWaitingRoom: (state, action) => {
      state.waitingRoom = state.waitingRoom.filter((r) => r.userId !== action.payload)
    },
    approvalReceived: (state) => {
      state.waitingForApproval = false
    },
    denialReceived: (state) => {
      state.waitingForApproval = false
      state.joinError = 'The host declined your request to join.'
    },
    receiveModerationEvent: (state, action) => {
      state.moderationEvents.push({ ...action.payload, ts: Date.now() })
    },
    receiveLifecycleEvent: (state, action) => {
      if (!state.activeMeeting) return
      const { event, chatMode } = action.payload
      if (event === 'ENDED') state.activeMeeting.status = 'ENDED'
      if (event === 'STARTED') state.activeMeeting.status = 'LIVE'
      if (event === 'LOCKED') state.activeMeeting.locked = true
      if (event === 'UNLOCKED') state.activeMeeting.locked = false
      if (event === 'CHAT_MODE_CHANGED') state.activeMeeting.chatMode = chatMode
    },
    receiveParticipantEvent: (state, action) => {
      const { event, userId } = action.payload
      state.participantEventTick += 1
      if (event === 'SCREEN_SHARE_STARTED' && state.activeMeeting) {
        state.activeMeeting.activeScreenShareUserId = userId
      }
      if (event === 'SCREEN_SHARE_STOPPED' && state.activeMeeting) {
        state.activeMeeting.activeScreenShareUserId = null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (state) => { state.listLoading = true; state.listError = null })
      .addCase(fetchMeetings.fulfilled, (state, action) => { state.listLoading = false; state.list = action.payload })
      .addCase(fetchMeetings.rejected, (state, action) => { state.listLoading = false; state.listError = action.payload })

      .addCase(createMeeting.fulfilled, (state, action) => { state.list.unshift(action.payload) })

      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.list = state.list.filter((m) => m.id !== action.payload)
      })

      .addCase(joinMeetingRoom.pending, (state) => { state.joinLoading = true; state.joinError = null })
      .addCase(joinMeetingRoom.fulfilled, (state, action) => {
        state.joinLoading = false
        state.joinInfo = action.payload
        state.waitingForApproval = !!action.payload.waiting
      })
      .addCase(joinMeetingRoom.rejected, (state, action) => {
        state.joinLoading = false
        state.joinError = action.payload
      })

      .addCase(fetchMeetingDetail.fulfilled, (state, action) => { state.activeMeeting = action.payload })
      .addCase(startMeetingRoom.fulfilled, (state, action) => { state.activeMeeting = action.payload })

      .addCase(endMeetingRoom.fulfilled, (state, action) => {
        if (state.activeMeeting) state.activeMeeting.status = 'ENDED'
      })

      .addCase(fetchAttendance.fulfilled, (state, action) => { state.attendance = action.payload })
      .addCase(fetchParticipants.fulfilled, (state, action) => { state.attendance = action.payload })
      .addCase(fetchWaitingRoom.fulfilled, (state, action) => { state.waitingRoom = action.payload })
      .addCase(fetchMeetingChatHistory.fulfilled, (state, action) => { state.chatMessages = action.payload })
  },
})

export const {
  clearActiveMeeting,
  receiveMeetingChatMessage,
  receiveWaitingRoomRequest,
  removeFromWaitingRoom,
  approvalReceived,
  denialReceived,
  receiveModerationEvent,
  receiveLifecycleEvent,
  receiveParticipantEvent,
} = meetingSlice.actions

export default meetingSlice.reducer
