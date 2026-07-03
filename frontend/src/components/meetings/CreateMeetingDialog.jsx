import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Stack, MenuItem,
  FormControlLabel, Switch, Alert,
} from '@mui/material'
import { createMeeting } from '../../store/slices/meetingSlice'
import { toast } from 'react-toastify'

const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const defaultStart = () => {
  const d = new Date(Date.now() + 15 * 60 * 1000) // 15 min from now
  return toLocalInputValue(d)
}
const defaultEnd = () => {
  const d = new Date(Date.now() + 75 * 60 * 1000) // +1hr after start
  return toLocalInputValue(d)
}

const CHAT_MODES = [
  { value: 'EVERYONE', label: 'Everyone can chat publicly' },
  { value: 'HOST_ONLY_BROADCAST', label: 'Only host broadcasts (students can still DM host)' },
  { value: 'PRIVATE_TO_HOST_ONLY', label: 'All messages go privately to host' },
]

const CreateMeetingDialog = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    title: '', description: '',
    scheduledStart: defaultStart(), scheduledEnd: defaultEnd(),
    maxParticipants: 50, waitingRoomEnabled: false, chatMode: 'EVERYONE',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    if (!form.title.trim()) { setError('Title is required'); return }

    setLoading(true)
    const result = await dispatch(createMeeting({
      ...form,
      scheduledStart: form.scheduledStart || null,
      scheduledEnd: form.scheduledEnd || null,
      maxParticipants: Number(form.maxParticipants),
    }))
    setLoading(false)

    if (createMeeting.fulfilled.match(result)) {
      toast.success('Meeting scheduled')
      onClose()
    } else {
      setError(result.payload || 'Failed to create meeting')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Schedule a Meeting</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" fullWidth required value={form.title} onChange={set('title')} />
          <TextField label="Description" fullWidth multiline rows={2}
            value={form.description} onChange={set('description')} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Start" type="datetime-local" fullWidth
              InputLabelProps={{ shrink: true }} value={form.scheduledStart} onChange={set('scheduledStart')} />
            <TextField label="End" type="datetime-local" fullWidth
              InputLabelProps={{ shrink: true }} value={form.scheduledEnd} onChange={set('scheduledEnd')} />
          </Stack>
          <TextField label="Max participants" type="number" value={form.maxParticipants}
            onChange={set('maxParticipants')} inputProps={{ min: 2, max: 500 }} />
          <TextField select label="Chat mode" value={form.chatMode} onChange={set('chatMode')}>
            {CHAT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </TextField>
          <FormControlLabel
            control={<Switch checked={form.waitingRoomEnabled} onChange={set('waitingRoomEnabled')} />}
            label="Enable waiting room (approve students before they join)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateMeetingDialog
