import { useDispatch } from 'react-redux'
import {
  Box, List, ListItemButton, ListItemText, IconButton, Button, Typography, Divider, Stack,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Chat as ChatIcon } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { setActiveConversation, startNewConversation, deleteConversationThunk, fetchMessages } from '../../store/slices/aiSlice'

const ConversationSidebar = ({ conversations, activeConversationId, onNewChatMobile }) => {
  const dispatch = useDispatch()

  const handleSelect = (id) => {
    dispatch(setActiveConversation(id))
    dispatch(fetchMessages(id))
    onNewChatMobile?.()
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this conversation?')) dispatch(deleteConversationThunk(id))
  }

  const handleNewChat = () => {
    dispatch(startNewConversation())
    onNewChatMobile?.()
  }

  return (
    <Box sx={{ width: '100%', borderRight: { md: '1px solid' }, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth variant="outlined" startIcon={<AddIcon />}
          onClick={handleNewChat}
        >
          New chat
        </Button>
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
        {conversations.map((c) => (
          <ListItemButton
            key={c.id}
            selected={c.id === activeConversationId}
            onClick={() => handleSelect(c.id)}
            sx={{ pr: 5, position: 'relative' }}
          >
            <ChatIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary', flexShrink: 0 }} />
            <ListItemText
              primary={c.title}
              secondary={c.lastMessageAt ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true }) : ''}
              primaryTypographyProps={{ noWrap: true, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
            <IconButton
              size="small"
              onClick={(e) => handleDelete(e, c.id)}
              sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
        {conversations.length === 0 && (
          <Stack sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No conversations yet
            </Typography>
          </Stack>
        )}
      </List>
    </Box>
  )
}

export default ConversationSidebar