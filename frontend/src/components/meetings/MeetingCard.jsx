import { Card, CardContent, Typography, Chip, Stack, Button, IconButton, Tooltip } from '@mui/material'
import {
  VideoCall as VideoCallIcon, Delete as DeleteIcon,
  Schedule as ScheduleIcon, Lock as LockIcon, People as PeopleIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const STATUS_COLORS = { SCHEDULED: 'default', LIVE: 'success', ENDED: 'default', CANCELLED: 'error' }

const MeetingCard = ({ meeting, isTeacher, onDelete, onShowAttendance }) => {
  const navigate = useNavigate()
  const isLive = meeting.status === 'LIVE'
  const isPast = meeting.status === 'ENDED' || meeting.status === 'CANCELLED'

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <div>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={700}>{meeting.title}</Typography>
              <Chip size="small" label={meeting.status} color={STATUS_COLORS[meeting.status]} />
              {meeting.locked && <Tooltip title="Locked"><LockIcon fontSize="small" color="action" /></Tooltip>}
            </Stack>
            {meeting.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {meeting.description}
              </Typography>
            )}
            <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(meeting.scheduledStart), 'MMM d, yyyy · h:mm a')}
                </Typography>
              </Stack>
              {!isTeacher && (
                <Typography variant="caption" color="text.secondary">
                  Host: {meeting.teacherName}
                </Typography>
              )}
            </Stack>
          </div>

          <Stack direction="row" spacing={1}>
            {isLive && (
              <Button variant="contained" color="success" startIcon={<VideoCallIcon />}
                onClick={() => navigate(`/meetings/${meeting.id}`)}>
                Join
              </Button>
            )}
            {!isLive && !isPast && isTeacher && (
              <Button variant="contained" startIcon={<VideoCallIcon />}
                onClick={() => navigate(`/meetings/${meeting.id}`)}>
                Start
              </Button>
            )}
            {!isLive && !isPast && !isTeacher && (
              <Button variant="outlined" disabled>Not started</Button>
            )}
            {isPast && isTeacher && (
              <Button variant="outlined" startIcon={<PeopleIcon />} onClick={() => onShowAttendance(meeting)}>
                Attendance
              </Button>
            )}
            {isTeacher && meeting.status === 'SCHEDULED' && (
              <IconButton color="error" onClick={() => onDelete(meeting.id)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default MeetingCard
