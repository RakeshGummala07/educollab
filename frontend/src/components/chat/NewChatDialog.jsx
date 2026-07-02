import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, TextField, Button, Tabs, Tab, Box,
  Checkbox, CircularProgress, InputAdornment,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { openDirectConversation, createGroup } from '../../store/slices/chatSlice'
import { selectMyStudents, selectMyTeachers } from '../../store/slices/enrollmentSlice'
import { fetchMyStudents, fetchMyTeachers } from '../../store/slices/enrollmentSlice'
import { useAuth } from '../../hooks/useAuth'

const NewChatDialog = ({ open, onClose, onConversationReady }) => {
  const dispatch = useDispatch()
  const { isTeacher } = useAuth()
  const myStudents = useSelector(selectMyStudents)
  const myTeachers = useSelector(selectMyTeachers)

  const contacts = isTeacher ? myStudents : myTeachers

  const [tab, setTab]           = useState('direct')
  const [search, setSearch]     = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [groupName, setGroupName]     = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (open) {
      if (isTeacher) dispatch(fetchMyStudents())
      else dispatch(fetchMyTeachers())
    }
  }, [open, isTeacher, dispatch])

  const filtered = contacts.filter(c =>
    c.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDirectClick = async (userId) => {
    setLoading(true)
    const result = await dispatch(openDirectConversation(userId))
    setLoading(false)
    if (openDirectConversation.fulfilled.match(result)) {
      onConversationReady(result.payload)
      handleClose()
    }
  }

  const toggleSelect = (userId) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length < 2) return
    setLoading(true)
    const result = await dispatch(createGroup({
      groupName: groupName.trim(),
      participantIds: selectedIds,
      isGroup: true,
    }))
    setLoading(false)
    if (createGroup.fulfilled.match(result)) {
      onConversationReady(result.payload)
      handleClose()
    }
  }

  const handleClose = () => {
    setSearch('')
    setSelectedIds([])
    setGroupName('')
    setTab('direct')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New Message</DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Direct Message" value="direct" sx={{ textTransform: 'none' }} />
        <Tab label="Create Group" value="group" sx={{ textTransform: 'none' }} />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth size="small"
            placeholder={isTeacher ? "Search students..." : "Search teachers..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {tab === 'group' && (
            <TextField
              fullWidth size="small"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              sx={{ mt: 1.5 }}
            />
          )}
        </Box>

        <List sx={{ maxHeight: 320, overflowY: 'auto', px: 1 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
              No contacts found
            </Box>
          ) : filtered.map((person) => (
            <ListItemButton
              key={person.id}
              onClick={() => tab === 'direct' ? handleDirectClick(person.id) : toggleSelect(person.id)}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {tab === 'group' && (
                <Checkbox
                  edge="start"
                  checked={selectedIds.includes(person.id)}
                  tabIndex={-1}
                  disableRipple
                />
              )}
              <ListItemAvatar>
                <Avatar src={person.avatarUrl} sx={{ bgcolor: 'primary.main' }}>
                  {person.firstName?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={person.fullName}
                secondary={`@${person.username}`}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>

      {tab === 'group' && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!groupName.trim() || selectedIds.length < 2 || loading}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> :
              `Create Group (${selectedIds.length})`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default NewChatDialog
