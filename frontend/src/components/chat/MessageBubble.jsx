import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Box, Avatar, Typography, Tooltip, IconButton, Menu, MenuItem,
} from '@mui/material'
import {
  Done as SentIcon, DoneAll as ReadIcon,
  MoreVert as MoreIcon, DeleteOutline as DeleteIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import {
  deleteMessageForMe, deleteMessageForEveryone,
} from '../../store/slices/chatSlice'

import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../store/slices/authSlice'





const MessageBubble = ({ message, showAvatar = true, isGroup = false }) => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const isOwn = Number(message.senderId) === Number(currentUser?.id)
  const isDeleted = message.deletedForEveryone
  const [anchorEl, setAnchorEl] = useState(null)

  const time = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : ''

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const handleDeleteForMe = () => {
    dispatch(deleteMessageForMe({
      conversationId: message.conversationId,
      messageId: message.id,
    }))
    handleMenuClose()
  }

  const handleDeleteForEveryone = () => {
    dispatch(deleteMessageForEveryone({
      conversationId: message.conversationId,
      messageId: message.id,
    }))
    handleMenuClose()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1, gap: 1, alignItems: 'flex-end',
        '&:hover .msg-menu-btn': { opacity: 1 },
      }}
    >
      {!isOwn && showAvatar && (
        <Avatar
          src={message.senderAvatarUrl}
          sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main' }}
        >
          {message.senderFullName?.[0]}
        </Avatar>
      )}
      {!isOwn && !showAvatar && <Box sx={{ width: 28 }} />}

      {/* Menu button — only for own, non-deleted messages, on the left of the bubble */}
      {isOwn && !isDeleted && (
        <IconButton
          size="small"
          className="msg-menu-btn"
          onClick={handleMenuOpen}
          sx={{ opacity: 0, transition: 'opacity 0.15s', width: 24, height: 24 }}
        >
          <MoreIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}

      <Box sx={{ maxWidth: '70%' }}>
        {!isOwn && isGroup && showAvatar && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5, mb: 0.25, display: 'block' }}>
            {message.senderFullName}
          </Typography>
        )}

        <Box
          sx={{
            bgcolor: isDeleted ? 'action.disabledBackground' : (isOwn ? 'primary.main' : 'background.paper'),
            color: isDeleted ? 'text.disabled' : (isOwn ? 'white' : 'text.primary'),
            borderRadius: 3,
            borderTopLeftRadius: !isOwn ? 4 : 24,
            borderTopRightRadius: isOwn ? 4 : 24,
            px: 1.75, py: 1,
            border: (isOwn && !isDeleted) ? 'none' : '1px solid',
            borderColor: 'divider',
            boxShadow: (isOwn && !isDeleted) ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
            fontStyle: isDeleted ? 'italic' : 'normal',
          }}
        >
          {isDeleted ? (
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DeleteIcon sx={{ fontSize: 14 }} /> This message was deleted
            </Typography>
          ) : (
            <>
              {/* Image attachment */}
              {message.attachmentUrl && message.type === 'IMAGE' && (
                <Box
                  component="img"
                  src={message.attachmentUrl}
                  alt={message.attachmentName}
                  sx={{
                    maxWidth: '100%', maxHeight: 240, borderRadius: 1.5,
                    mb: message.content ? 0.75 : 0, display: 'block', cursor: 'pointer',
                  }}
                  onClick={() => window.open(message.attachmentUrl, '_blank')}
                />
              )}

              {/* File attachment */}
              {message.attachmentUrl && message.type === 'FILE' && (
                <Box
                  component="a"
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    textDecoration: 'none', color: 'inherit',
                    bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : 'background.default',
                    borderRadius: 1.5, p: 1, mb: message.content ? 0.75 : 0,
                  }}
                >
                  <Typography variant="caption" noWrap>
                    📎 {message.attachmentName || 'Attachment'}
                  </Typography>
                </Box>
              )}

              {message.content && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Timestamp + read receipt */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mt: 0.25, mx: 0.5,
        }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {time}{message.edited ? ' · edited' : ''}
          </Typography>
          {isOwn && !isDeleted && (
            <Tooltip title={message.readByCurrentUser || message.readCount > 1 ? 'Read' : 'Sent'}>
              {message.status === 'READ' || message.readCount > 1 ? (
                <ReadIcon sx={{ fontSize: 13, color: 'primary.main' }} />
              ) : (
                <SentIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              )}
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Delete menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDeleteForMe}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete for me
        </MenuItem>
        <MenuItem onClick={handleDeleteForEveryone} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete for everyone
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default MessageBubble
