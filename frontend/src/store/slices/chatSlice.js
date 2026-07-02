import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { chatApi } from '../../api/chatApi'

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await chatApi.getMyConversations()
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load conversations')
    }
  }
)

export const openDirectConversation = createAsyncThunk(
  'chat/openDirect',
  async (otherUserId, { rejectWithValue }) => {
    try {
      const res = await chatApi.getOrCreateDirectConversation(otherUserId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to open conversation')
    }
  }
)

export const createGroup = createAsyncThunk(
  'chat/createGroup',
  async (data, { rejectWithValue }) => {
    try {
      const res = await chatApi.createGroupConversation(data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create group')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 0, size = 30 }, { rejectWithValue }) => {
    try {
      const res = await chatApi.getMessages(conversationId, page, size)
      return { conversationId, ...res.data.data, page }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load messages')
    }
  }
)

export const sendMessageRest = createAsyncThunk(
  'chat/sendMessageRest',
  async ({ conversationId, data }, { rejectWithValue }) => {
    try {
      const res = await chatApi.sendMessage(conversationId, data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message')
    }
  }
)

export const markConversationRead = createAsyncThunk(
  'chat/markRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await chatApi.markAsRead(conversationId)
      return conversationId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read')
    }
  }
)

export const deleteMessageForMe = createAsyncThunk(
  'chat/deleteMessageForMe',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await chatApi.deleteMessageForMe(messageId)
      return { conversationId, messageId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete message')
    }
  }
)

export const deleteMessageForEveryone = createAsyncThunk(
  'chat/deleteMessageForEveryone',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await chatApi.deleteMessageForEveryone(messageId, conversationId)
      return { conversationId, messageId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete message')
    }
  }
)

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await chatApi.deleteConversation(conversationId)
      return conversationId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete conversation')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations:        [],
    activeConversationId: null,
    messagesByConv:       {},   // conversationId → { messages: [], page, hasMore }
    typingByConv:         {},   // conversationId → { userId: { fullName, typing } }
    onlineUserIds:        [],   // array of online user IDs
    wsConnected:          false,
    isLoadingConversations: false,
    isLoadingMessages:    false,
    error:                null,
  },
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload
    },
    setWsConnected(state, action) {
      state.wsConnected = action.payload
    },
    // Incoming real-time message via WebSocket
    // payload: { message, currentUserId } — we ALWAYS recompute ownedByCurrentUser
    // here because the backend broadcasts ONE identical object to every
    // subscriber (computed relative to the sender), so trusting it would make
    // the recipient incorrectly see ownedByCurrentUser: true.
    receiveMessage(state, action) {
      const { message: rawMsg, currentUserId } = action.payload
      const msg = {
        ...rawMsg,
        ownedByCurrentUser: rawMsg.senderId === currentUserId,
      }
      const convId = msg.conversationId
      if (!state.messagesByConv[convId]) {
        state.messagesByConv[convId] = { messages: [], page: 0, hasMore: true }
      }
      // Avoid duplicates (e.g. own message echoed back)
      const exists = state.messagesByConv[convId].messages.some(m => m.id === msg.id)
      if (!exists) {
        state.messagesByConv[convId].messages.push(msg)
      }

      // Update conversation preview + move to top
      const convIdx = state.conversations.findIndex(c => c.id === convId)
      if (convIdx !== -1) {
        state.conversations[convIdx].lastMessageContent = msg.content
        state.conversations[convIdx].lastMessageAt = msg.createdAt
        if (!msg.ownedByCurrentUser && state.activeConversationId !== convId) {
          state.conversations[convIdx].unreadCount =
            (state.conversations[convIdx].unreadCount || 0) + 1
        }
        const [conv] = state.conversations.splice(convIdx, 1)
        state.conversations.unshift(conv)
      }
    },
    // Typing indicator update
    setTyping(state, action) {
      const { conversationId, userId, fullName, typing } = action.payload
      if (!state.typingByConv[conversationId]) {
        state.typingByConv[conversationId] = {}
      }
      if (typing) {
        state.typingByConv[conversationId][userId] = { fullName, typing: true }
      } else {
        delete state.typingByConv[conversationId][userId]
      }
    },
    clearTyping(state, action) {
      delete state.typingByConv[action.payload]
    },
    // Presence update — directly set otherUserOnline using the event's own
    // `online` flag (don't re-derive from onlineUserIds — that has a timing
    // gap inside the same reducer call that caused the "stuck online" bug).
    setUserOnline(state, action) {
      const { userId, online } = action.payload

      if (online) {
        if (!state.onlineUserIds.includes(userId)) {
          state.onlineUserIds.push(userId)
        }
      } else {
        state.onlineUserIds = state.onlineUserIds.filter(id => id !== userId)
      }

      state.conversations.forEach(c => {
        if (c.type === 'DIRECT' && c.participants?.some(p => p.userId === userId)) {
          c.otherUserOnline = online
        }
      })
    },
    clearUnread(state, action) {
      const conv = state.conversations.find(c => c.id === action.payload)
      if (conv) conv.unreadCount = 0
    },
    // Real-time: the other participant read my message(s) in this conversation.
    // Mark all of MY OWN messages in that conversation as READ.
    markMessagesReadByOther(state, action) {
      const { conversationId } = action.payload
      const conv = state.messagesByConv[conversationId]
      if (!conv) return

      conv.messages.forEach(msg => {
        if (msg.ownedByCurrentUser) {
          msg.status = 'READ'
          msg.readCount = Math.max(msg.readCount || 1, 2)
        }
      })
    },
    // Real-time: a message was deleted for everyone (via WebSocket broadcast)
    receiveMessageDeleted(state, action) {
      const { messageId } = action.payload
      Object.values(state.messagesByConv).forEach(conv => {
        const msg = conv.messages.find(m => m.id === messageId)
        if (msg) {
          msg.deletedForEveryone = true
          msg.content = 'This message was deleted'
          msg.attachmentUrl = null
        }
      })
    },
    clearChatError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending,   (s) => { s.isLoadingConversations = true })
      .addCase(fetchConversations.fulfilled, (s, a) => {
        s.isLoadingConversations = false
        s.conversations = a.payload
      })
      .addCase(fetchConversations.rejected,  (s, a) => {
        s.isLoadingConversations = false; s.error = a.payload
      })

    builder.addCase(openDirectConversation.fulfilled, (s, a) => {
      const exists = s.conversations.find(c => c.id === a.payload.id)
      if (!exists) s.conversations.unshift(a.payload)
      s.activeConversationId = a.payload.id
    })

    builder.addCase(createGroup.fulfilled, (s, a) => {
      s.conversations.unshift(a.payload)
      s.activeConversationId = a.payload.id
    })

    builder
      .addCase(fetchMessages.pending,   (s) => { s.isLoadingMessages = true })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.isLoadingMessages = false
        const { conversationId, content, page, last } = a.payload
        const existing = s.messagesByConv[conversationId]?.messages || []

        // Reverse because backend returns newest-first; we want oldest-first for display
        const reversed = [...content].reverse()

        if (page === 0) {
          s.messagesByConv[conversationId] = {
            messages: reversed, page: 0, hasMore: !last,
          }
        } else {
          s.messagesByConv[conversationId] = {
            messages: [...reversed, ...existing], page, hasMore: !last,
          }
        }
      })
      .addCase(fetchMessages.rejected, (s, a) => {
        s.isLoadingMessages = false; s.error = a.payload
      })

    builder.addCase(sendMessageRest.fulfilled, (s, a) => {
      const msg = a.payload
      const convId = msg.conversationId
      if (!s.messagesByConv[convId]) {
        s.messagesByConv[convId] = { messages: [], page: 0, hasMore: true }
      }
      s.messagesByConv[convId].messages.push(msg)
    })

    builder.addCase(markConversationRead.fulfilled, (s, a) => {
      const conv = s.conversations.find(c => c.id === a.payload)
      if (conv) conv.unreadCount = 0
    })

    // Delete message for me — remove from my local view only
    builder.addCase(deleteMessageForMe.fulfilled, (s, a) => {
      const { conversationId, messageId } = a.payload
      const conv = s.messagesByConv[conversationId]
      if (conv) {
        conv.messages = conv.messages.filter(m => m.id !== messageId)
      }
    })

    // Delete message for everyone — mark as deleted locally (others get it via WS)
    builder.addCase(deleteMessageForEveryone.fulfilled, (s, a) => {
      const { conversationId, messageId } = a.payload
      const conv = s.messagesByConv[conversationId]
      if (conv) {
        const msg = conv.messages.find(m => m.id === messageId)
        if (msg) {
          msg.deletedForEveryone = true
          msg.content = 'This message was deleted'
          msg.attachmentUrl = null
        }
      }
    })

    // Delete conversation — remove from my conversation list
    builder.addCase(deleteConversation.fulfilled, (s, a) => {
      s.conversations = s.conversations.filter(c => c.id !== a.payload)
      delete s.messagesByConv[a.payload]
      if (s.activeConversationId === a.payload) {
        s.activeConversationId = null
      }
    })
  },
})

export const {
  setActiveConversation, setWsConnected, receiveMessage,
  setTyping, clearTyping, setUserOnline, clearUnread, clearChatError,
  markMessagesReadByOther, receiveMessageDeleted,
} = chatSlice.actions

// Selectors
export const selectConversations         = (s) => s.chat.conversations
export const selectActiveConversationId  = (s) => s.chat.activeConversationId
export const selectMessagesForConv = (convId) => (s) =>
  s.chat.messagesByConv[convId]?.messages || []
export const selectHasMoreMessages = (convId) => (s) =>
  s.chat.messagesByConv[convId]?.hasMore ?? true
export const selectTypingForConv = (convId) => (s) =>
  s.chat.typingByConv[convId] || {}
export const selectOnlineUserIds   = (s) => s.chat.onlineUserIds
export const selectWsConnected     = (s) => s.chat.wsConnected
export const selectChatLoading     = (s) => s.chat.isLoadingConversations
export const selectMessagesLoading = (s) => s.chat.isLoadingMessages
export const selectTotalUnread     = (s) =>
  s.chat.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

export default chatSlice.reducer
