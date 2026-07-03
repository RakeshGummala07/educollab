import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box, Stack, TextField, IconButton, Typography, Avatar, MenuItem, Select, Chip,
} from '@mui/material'
import { Send as SendIcon } from '@mui/icons-material'

const MeetingChatPanel = ({ meetingId, currentUserId, participants, chatMode, isModerator, onSend }) => {
  const messages = useSelector((s) => s.meetings.chatMessages)
  const [text, setText] = useState('')
  const [recipientId, setRecipientId] = useState('') // '' = everyone
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const canBroadcastPublicly = chatMode === 'EVERYONE' || isModerator

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim(), recipientId || null)
    setText('')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {messages.map((m) => {
          const mine = m.senderId === currentUserId
          return (
            <Box key={m.id} sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                {!mine && <Avatar src={m.senderAvatarUrl} sx={{ width: 20, height: 20 }}>{m.senderFullName?.[0]}</Avatar>}
                <Typography variant="caption" color="text.secondary">
                  {mine ? 'You' : m.senderFullName}
                  {m.isPrivate && ' · private'}
                </Typography>
              </Stack>
              <Box sx={{
                mt: 0.25, px: 1.25, py: 0.75, borderRadius: 2, maxWidth: 240,
                bgcolor: m.isPrivate ? 'warning.light' : mine ? 'primary.main' : 'grey.100',
                color: mine && !m.isPrivate ? 'primary.contrastText' : 'text.primary',
              }}>
                <Typography variant="body2">{m.content}</Typography>
              </Box>
            </Box>
          )
        })}
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No messages yet. Say hello!
          </Typography>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        {!canBroadcastPublicly && (
          <Chip size="small" sx={{ mb: 1 }} label="Messages go privately to the host in this mode" />
        )}
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Select
            size="small" fullWidth value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled={!canBroadcastPublicly}>Everyone</MenuItem>
            {participants
              .filter((p) => p.userId !== currentUserId)
              .map((p) => <MenuItem key={p.userId} value={p.userId}>{p.fullName} (private)</MenuItem>)}
          </Select>
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small" fullWidth placeholder="Type a message…" value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={!text.trim()}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )
}

export default MeetingChatPanel
