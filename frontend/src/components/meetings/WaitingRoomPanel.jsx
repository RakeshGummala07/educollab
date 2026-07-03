import { useDispatch, useSelector } from 'react-redux'
import { Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, Stack, Button, Typography } from '@mui/material'
import meetingApi from '../../api/meetingApi'
import { removeFromWaitingRoom } from '../../store/slices/meetingSlice'
import { toast } from 'react-toastify'

const WaitingRoomPanel = ({ meetingId }) => {
  const dispatch = useDispatch()
  const waitingRoom = useSelector((s) => s.meetings.waitingRoom)

  const approve = async (userId) => {
    try {
      await meetingApi.approveWaiting(meetingId, userId)
      dispatch(removeFromWaitingRoom(userId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    }
  }

  const deny = async (userId) => {
    try {
      await meetingApi.denyWaiting(meetingId, userId)
      dispatch(removeFromWaitingRoom(userId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deny')
    }
  }

  if (waitingRoom.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">No one is waiting</Typography>
      </Box>
    )
  }

  return (
    <List dense>
      {waitingRoom.map((r) => (
        <ListItem key={r.userId} secondaryAction={
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" onClick={() => approve(r.userId)}>Admit</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => deny(r.userId)}>Deny</Button>
          </Stack>
        }>
          <ListItemAvatar><Avatar src={r.avatarUrl}>{r.fullName?.[0]}</Avatar></ListItemAvatar>
          <ListItemText primary={r.fullName} secondary={r.username} />
        </ListItem>
      ))}
    </List>
  )
}

export default WaitingRoomPanel
