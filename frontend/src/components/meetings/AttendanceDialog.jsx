import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Avatar, Stack, Typography,
} from '@mui/material'
import { fetchAttendance } from '../../store/slices/meetingSlice'

const STATUS_COLORS = { PRESENT: 'success', PARTIAL: 'warning', ABSENT: 'default' }

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

const AttendanceDialog = ({ meeting, open, onClose }) => {
  const dispatch = useDispatch()
  const attendance = useSelector((s) => s.meetings.attendance)

  useEffect(() => {
    if (open && meeting) dispatch(fetchAttendance(meeting.id))
  }, [open, meeting, dispatch])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Attendance — {meeting?.title}
      </DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Participant</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((a) => (
              <TableRow key={a.userId}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={a.avatarUrl} sx={{ width: 28, height: 28 }}>{a.fullName?.[0]}</Avatar>
                    <Typography variant="body2">{a.fullName}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{a.role}</TableCell>
                <TableCell>{formatDuration(a.durationSeconds)}</TableCell>
                <TableCell>
                  <Chip size="small" label={a.status} color={STATUS_COLORS[a.status]} />
                </TableCell>
              </TableRow>
            ))}
            {attendance.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No attendance records yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AttendanceDialog
