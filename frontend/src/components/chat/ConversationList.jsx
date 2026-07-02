import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, Badge, Typography, CircularProgress, TextField,
  InputAdornment, Chip, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material'
import { Search as SearchIcon, MoreVert as MoreIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  fetchConversations, setActiveConversation, deleteConversation,
  selectConversations, selectActiveConversationId,
  selectChatLoading,
} from '../../store/slices/chatSlice'

const ConversationList = ({ onSelect }) => {
  const dispatch     = useDispatch()
  const conversations = useSelector(selectConversations)
  const activeId      = useSelector(selectActiveConversationId)
  const isLoading      = useSelector(selectChatLoading)
  const [search, setSearch] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuConv, setMenuConv]     = useState(null)
  const [deleteDialogConv, setDeleteDialogConv] = useState(null)

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  const filtered = conversations.filter(c =>
    (c.displayName || c.groupName || '')
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (conv) => {
    dispatch(setActiveConversation(conv.id))
    onSelect?.(conv)
  }

  const timeAgo = (date) => {
    if (!date) return ''
    try { return formatDistanceToNowStrict(new Date(date), { addSuffix: false }) }
    catch { return '' }
  }

  const handleMenuOpen = (e, conv) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuConv(conv)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuConv(null)
  }

  const handleDeleteClick = () => {
    setDeleteDialogConv(menuConv)
    handleMenuClose()
  }

  const handleConfirmDelete = () => {
    if (deleteDialogConv) {
      dispatch(deleteConversation(deleteDialogConv.id))
    }
    setDeleteDialogConv(null)
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
        />
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <Typography variant="body2" color="text.disabled">
              {search ? 'No conversations match' : 'No conversations yet'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filtered.map((conv) => (
              <ListItemButton
                key={conv.id}
                selected={conv.id === activeId}
                onClick={() => handleSelect(conv)}
                sx={{
                  px: 2, py: 1.25,
                  borderBottom: '1px solid', borderColor: 'divider',
                  '&.Mui-selected': { bgcolor: 'primary.50' },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      conv.type === 'DIRECT' && conv.otherUserOnline ? (
                        <Box sx={{
                          width: 10, height: 10, borderRadius: '50%',
                          bgcolor: 'success.main', border: '2px solid white',
                        }} />
                      ) : null
                    }
                  >
                    <Avatar
                      src={conv.displayAvatarUrl}
                      sx={{
                        bgcolor: conv.type === 'GROUP' ? 'secondary.main' : 'primary.main',
                        fontWeight: 700,
                      }}
                    >
                      {conv.displayName?.[0] || 'G'}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                primaryTypographyProps={{
                component: 'div',
                }}
                secondaryTypographyProps={{
                component: 'div',
                }}
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        fontWeight={conv.unreadCount > 0 ? 700 : 600}
                        noWrap
                        sx={{ maxWidth: 140 }}
                      >
                        {conv.displayName || conv.groupName}
                      </Typography>
                      {conv.lastMessageAt && (
                        <Typography variant="caption" color="text.disabled">
                          {timeAgo(conv.lastMessageAt)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="caption"
                        color={conv.unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                        fontWeight={conv.unreadCount > 0 ? 600 : 400}
                        noWrap
                        sx={{ maxWidth: 160 }}
                      >
                        {conv.lastMessageContent || 'No messages yet'}
                      </Typography>
                      {conv.unreadCount > 0 && (
                        <Chip
                          label={conv.unreadCount}
                          size="small"
                          color="primary"
                          sx={{ height: 18, minWidth: 18, fontSize: 10 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, conv)}
                  sx={{ ml: 0.5 }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* Per-conversation options menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete conversation
        </MenuItem>
      </Menu>

      {/* Confirm delete dialog */}
      <Dialog open={Boolean(deleteDialogConv)} onClose={() => setDeleteDialogConv(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove your conversation with{' '}
            <strong>{deleteDialogConv?.displayName || deleteDialogConv?.groupName}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This only removes it from your list. The other participant will still see it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogConv(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConversationList
