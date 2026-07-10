import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import aiApi from '../../api/aiApi'

const extractQuotaOrMessage = (err, dispatch, fallbackMsg) => {
  if (err.response?.status === 429) {
    dispatch(setQuotaExceeded(err.response.data.data))
    return err.response.data.message || 'Token limit reached'
  }
  return err.response?.data?.message || fallbackMsg
}

export const fetchConversations = createAsyncThunk(
  'ai/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await aiApi.listConversations()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load conversations')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'ai/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await aiApi.getMessages(conversationId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load messages')
    }
  }
)

export const sendChatMessage = createAsyncThunk(
  'ai/sendChatMessage',
  async ({ conversationId, message, useDocumentContext = true }, { dispatch, rejectWithValue }) => {
    const isNewConversation = !conversationId
    try {
      const res = await aiApi.sendMessage(conversationId, message, useDocumentContext)
      dispatch(fetchUsage())
      // First message of a brand-new chat creates a conversation server-side
      // that isn't in state.conversations yet — refresh the sidebar list so
      // it appears immediately instead of only after a full page reload.
      if (isNewConversation) {
        dispatch(fetchConversations())
      }
      return { userMessage: message, assistantMessage: res.data.data }
    } catch (err) {
      return rejectWithValue(extractQuotaOrMessage(err, dispatch, 'Failed to send message'))
    }
  }
)

export const deleteConversationThunk = createAsyncThunk(
  'ai/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await aiApi.deleteConversation(conversationId)
      return conversationId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete conversation')
    }
  }
)

export const fetchUsage = createAsyncThunk(
  'ai/fetchUsage',
  async (_, { rejectWithValue }) => {
    try {
      const res = await aiApi.getUsage()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load usage')
    }
  }
)

export const uploadDocumentThunk = createAsyncThunk(
  'ai/uploadDocument',
  async ({ file, onProgress }, { rejectWithValue }) => {
    try {
      const res = await aiApi.uploadDocument(file, onProgress)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload document')
    }
  }
)

export const fetchDocuments = createAsyncThunk(
  'ai/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await aiApi.listDocuments()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load documents')
    }
  }
)

export const deleteDocumentThunk = createAsyncThunk(
  'ai/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      await aiApi.deleteDocument(documentId)
      return documentId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete document')
    }
  }
)

export const generateQuizThunk = createAsyncThunk(
  'ai/generateQuiz',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await aiApi.generateQuiz(data)
      dispatch(fetchUsage())
      return res.data.data
    } catch (err) {
      return rejectWithValue(extractQuotaOrMessage(err, dispatch, 'Failed to generate quiz'))
    }
  }
)

export const generateAssignmentThunk = createAsyncThunk(
  'ai/generateAssignment',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await aiApi.generateAssignment(data)
      dispatch(fetchUsage())
      return res.data.data
    } catch (err) {
      return rejectWithValue(extractQuotaOrMessage(err, dispatch, 'Failed to generate assignment'))
    }
  }
)

export const summarizeThunk = createAsyncThunk(
  'ai/summarize',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await aiApi.summarize(data)
      dispatch(fetchUsage())
      return res.data.data
    } catch (err) {
      return rejectWithValue(extractQuotaOrMessage(err, dispatch, 'Failed to generate summary'))
    }
  }
)

const initialState = {
  conversations: [],
  conversationsLoading: false,
  activeConversationId: null,
  messages: [],
  messagesLoading: false,
  sendLoading: false,
  sendError: null,
  documents: [],
  documentsLoading: false,
  uploadProgress: 0,
  usage: null,
  usageLoading: false,
  quotaExceeded: null,
  quizResult: null,
  assignmentResult: null,
  summaryResult: null,
  toolLoading: false,
  toolError: null,
}

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload
      state.messages = []
    },
    setQuotaExceeded: (state, action) => {
      state.quotaExceeded = action.payload
    },
    clearQuotaExceeded: (state) => {
      state.quotaExceeded = null
    },
    clearToolResults: (state) => {
      state.quizResult = null
      state.assignmentResult = null
      state.summaryResult = null
      state.toolError = null
    },
    startNewConversation: (state) => {
      state.activeConversationId = null
      state.messages = []
    },
    // Real-time document status update arriving via WebSocket
    // (pushed by DocumentIngestionWorker once PDF processing finishes)
    receiveDocumentStatusUpdate: (state, action) => {
      const updated = action.payload
      const index = state.documents.findIndex((d) => d.id === updated.id)
      if (index !== -1) {
        state.documents[index] = updated
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.conversationsLoading = true })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state) => { state.conversationsLoading = false })

      .addCase(fetchMessages.pending, (state) => { state.messagesLoading = true })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        state.messages = action.payload
      })
      .addCase(fetchMessages.rejected, (state) => { state.messagesLoading = false })

      .addCase(sendChatMessage.pending, (state) => { state.sendLoading = true; state.sendError = null })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendLoading = false
        const { userMessage, assistantMessage } = action.payload
        state.messages.push({
          id: `local-${Date.now()}`,
          role: 'USER',
          content: userMessage,
          createdAt: new Date().toISOString(),
        })
        state.messages.push(assistantMessage)
        state.activeConversationId = assistantMessage.conversationId
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendLoading = false
        state.sendError = action.payload
      })

      .addCase(deleteConversationThunk.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter((c) => c.id !== action.payload)
        if (state.activeConversationId === action.payload) {
          state.activeConversationId = null
          state.messages = []
        }
      })

      .addCase(fetchUsage.pending, (state) => { state.usageLoading = true })
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.usageLoading = false
        state.usage = action.payload
      })
      .addCase(fetchUsage.rejected, (state) => { state.usageLoading = false })

      .addCase(uploadDocumentThunk.pending, (state) => { state.documentsLoading = true })
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        state.documentsLoading = false
        state.documents.unshift(action.payload)
      })
      .addCase(uploadDocumentThunk.rejected, (state) => { state.documentsLoading = false })

      .addCase(fetchDocuments.fulfilled, (state, action) => { state.documents = action.payload })
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload)
      })

      .addCase(generateQuizThunk.pending, (state) => { state.toolLoading = true; state.toolError = null })
      .addCase(generateQuizThunk.fulfilled, (state, action) => { state.toolLoading = false; state.quizResult = action.payload })
      .addCase(generateQuizThunk.rejected, (state, action) => { state.toolLoading = false; state.toolError = action.payload })

      .addCase(generateAssignmentThunk.pending, (state) => { state.toolLoading = true; state.toolError = null })
      .addCase(generateAssignmentThunk.fulfilled, (state, action) => { state.toolLoading = false; state.assignmentResult = action.payload })
      .addCase(generateAssignmentThunk.rejected, (state, action) => { state.toolLoading = false; state.toolError = action.payload })

      .addCase(summarizeThunk.pending, (state) => { state.toolLoading = true; state.toolError = null })
      .addCase(summarizeThunk.fulfilled, (state, action) => { state.toolLoading = false; state.summaryResult = action.payload })
      .addCase(summarizeThunk.rejected, (state, action) => { state.toolLoading = false; state.toolError = action.payload })
  },
})

export const {
  setActiveConversation, setQuotaExceeded, clearQuotaExceeded, clearToolResults, startNewConversation,
  receiveDocumentStatusUpdate,
} = aiSlice.actions

export default aiSlice.reducer