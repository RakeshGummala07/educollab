import {
  Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton,
  Stack, Chip, Tooltip, Menu, MenuItem,
} from '@mui/material'
import {
  MicOff as MicOffIcon, Mic as MicIcon, VideocamOff as VideocamOffIcon, Videocam as VideocamIcon,
  PanTool as PanToolIcon, MoreVert as MoreVertIcon, PersonRemove as PersonRemoveIcon,
  ArrowUpward as PromoteIcon, ArrowDownward as DemoteIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import meetingApi from '../../api/meetingApi'
import { toast } from 'react-toastify'

const ParticipantsPanel = ({ meetingId, participants, currentUserId, isModerator }) => {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuTarget, setMenuTarget] = useState(null)

  const openMenu = (e, participant) => { setMenuAnchor(e.currentTarget); setMenuTarget(participant) }
  const closeMenu = () => { setMenuAnchor(null); setMenuTarget(null) }

  const run = async (fn, successMsg) => {
    try {
      await fn()
      toast.success(successMsg)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
    closeMenu()
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <List dense>
        {participants.map((p) => (
          <ListItem
            key={p.userId}
            secondaryAction={
              <Stack direction="row" spacing={0.5} alignItems="center">
                {p.handRaised && <Tooltip title="Hand raised"><PanToolIcon fontSize="small" color="warning" /></Tooltip>}
                {isModerator && p.userId !== currentUserId && p.role !== 'HOST' && (
                  <IconButton size="small" onClick={(e) => openMenu(e, p)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            }
          >
            <ListItemAvatar>
              <Avatar src={p.avatarUrl}>{p.fullName?.[0]}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={p.fullName}
              secondary={<Chip size="small" label={p.role} sx={{ mt: 0.5 }} />}
            />
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        {menuTarget?.role === 'PARTICIPANT' && (
          <MenuItem onClick={() => run(() => meetingApi.promoteToCoHost(meetingId, menuTarget.userId), 'Promoted to co-host')}>
            <PromoteIcon fontSize="small" sx={{ mr: 1 }} /> Make co-host
          </MenuItem>
        )}
        {menuTarget?.role === 'CO_HOST' && (
          <MenuItem onClick={() => run(() => meetingApi.demoteToParticipant(meetingId, menuTarget.userId), 'Demoted to participant')}>
            <DemoteIcon fontSize="small" sx={{ mr: 1 }} /> Remove co-host
          </MenuItem>
        )}
        <MenuItem
          onClick={() => run(() => meetingApi.muteParticipantAudio(meetingId, menuTarget.userId, true), 'Mic turned off')}>
          {menuTarget?.micMuted ? <MicIcon fontSize="small" sx={{ mr: 1 }} /> : <MicOffIcon fontSize="small" sx={{ mr: 1 }} />}
          {'Mute mic'}
        </MenuItem>
        <MenuItem onClick={() => run(() => meetingApi.muteParticipantVideo(meetingId, menuTarget.userId, !menuTarget.cameraOff), 'Camera turned off')}>
          {menuTarget?.cameraOff ? <VideocamIcon fontSize="small" sx={{ mr: 1 }} /> : <VideocamOffIcon fontSize="small" sx={{ mr: 1 }} />}
          {'Turn camera off'}
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }}
          onClick={() => run(() => meetingApi.kickParticipant(meetingId, menuTarget.userId), 'Participant removed')}>
          <PersonRemoveIcon fontSize="small" sx={{ mr: 1 }} /> Remove from meeting
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ParticipantsPanel
