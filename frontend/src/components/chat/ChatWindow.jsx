import { useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Avatar, Typography, IconButton, TextField,
  CircularProgress, Chip, Divider,
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'
import {
  fetchMessages, sendMessageRest, markConversationRead,
  clearUnread,
} from '../../store/slices/chatSlice'
import { selectCurrentUser } from '../../store/slices/authSlice'
import { useConversationSubscription } from '../../hooks/useWebSocket'
import { mediaApi } from '../../api/mediaApi'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const ChatWindow = ({ conversation, onBack }) => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  // Stable inline selectors (no factory-function-per-render) — fixes the
  // "Selector returned a different result" Redux warning. The fallback []/{}
  // is only created via useMemo when the underlying reference actually
  // changes, not on every render.
  const messagesRaw = useSelector((s) => s.chat.messagesByConv[conversation?.id]?.messages)
  const messages = useMemo(() => messagesRaw || [], [messagesRaw])

  const hasMore = useSelector((s) => s.chat.messagesByConv[conversation?.id]?.hasMore ?? true)

  const rawTypingUsers = useSelector((s) => s.chat.typingByConv[conversation?.id])
  // Filter out the current user's own typing event — otherwise you see
  // "You are typing" on your own screen instead of only the other person.
  const typingUsers = useMemo(() => {
    const raw = rawTypingUsers || {}
    return Object.fromEntries(
      Object.entries(raw).filter(([userId]) => Number(userId) !== currentUser?.id)
    )
  }, [rawTypingUsers, currentUser?.id])

  const isLoadingMessages = useSelector((s) => s.chat.isLoadingMessages)

  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const { sendViaWs, sendTyping } = useConversationSubscription(conversation?.id)

  // Load message history + mark read on open
  useEffect(() => {
    if (!conversation?.id) return
    dispatch(fetchMessages({ conversationId: conversation.id, page: 0 }))
    dispatch(markConversationRead(conversation.id))
    dispatch(clearUnread(conversation.id))
  }, [conversation?.id, dispatch])

  // Re-mark as read whenever a new message arrives while this chat is open
  // (without this, read receipts only update on next open/close, not live)
  useEffect(() => {
    if (!conversation?.id || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.ownedByCurrentUser) return

    const timeout = setTimeout(() => {
      dispatch(markConversationRead(conversation.id))
    }, 300)

    return () => clearTimeout(timeout)
  }, [messages.length, conversation?.id, dispatch])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!text.trim()) return
    sendViaWs(text.trim())
    setText('')
    sendTyping(false)
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    sendTyping(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const isImage = file.type.startsWith('image/')
      const res = isImage
        ? await mediaApi.uploadImage(file)
        : await mediaApi.uploadVideo(file)

      sendViaWs(text.trim() || '', {
        attachmentUrl: res.data.data.url,
        attachmentType: file.type,
        attachmentName: file.name,
      })
      setText('')
    } catch (err) {
      console.error('File upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const loadMore = () => {
    if (!conversation?.id) return
    const currentPage = Math.floor(messages.length / 30)
    dispatch(fetchMessages({ conversationId: conversation.id, page: currentPage + 1 }))
  }

  if (!conversation) {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', color: 'text.disabled',
      }}>
        <Typography variant="body1">Select a conversation to start chatting</Typography>
      </Box>
    )
  }

  const isGroup = conversation.type === 'GROUP'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <IconButton onClick={onBack} sx={{ display: { md: 'none' } }}>
          <BackIcon />
        </IconButton>
        <Avatar
          src={conversation.displayAvatarUrl}
          sx={{ bgcolor: isGroup ? 'secondary.main' : 'primary.main', fontWeight: 700 }}
        >
          {(conversation.displayName || conversation.groupName)?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {conversation.displayName || conversation.groupName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isGroup
              ? `${conversation.participants?.length || 0} members`
              : conversation.otherUserOnline ? '🟢 Online' : 'Offline'
            }
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
        {hasMore && (
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Chip
              label={isLoadingMessages ? <CircularProgress size={12} /> : 'Load earlier messages'}
              size="small"
              onClick={loadMore}
              clickable
              variant="outlined"
            />
          </Box>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
              isGroup={isGroup}
            />
          )
        })}

        <div ref={bottomRef} />
      </Box>

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      <Divider />

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*"
          onChange={handleFileUpload}
        />
        <IconButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <CircularProgress size={20} /> : <AttachIcon />}
        </IconButton>

        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
        />

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!text.trim()}
          sx={{ bgcolor: text.trim() ? 'primary.main' : 'transparent', color: text.trim() ? 'white' : 'inherit',
                '&:hover': { bgcolor: text.trim() ? 'primary.dark' : 'action.hover' } }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}

export default ChatWindow
