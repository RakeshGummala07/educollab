import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, Stack, Tabs, Tab, CircularProgress, Alert,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { fetchMeetings, deleteMeeting } from '../../store/slices/meetingSlice'
import CreateMeetingDialog from '../../components/meetings/CreateMeetingDialog'
import AttendanceDialog from '../../components/meetings/AttendanceDialog'
import MeetingCard from '../../components/meetings/MeetingCard'
import { toast } from 'react-toastify'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

const MeetingsPage = () => {
  const dispatch = useDispatch()
  const { isTeacher } = useAuth()
  const { list, listLoading, listError } = useSelector((s) => s.meetings)

  const [tab, setTab] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [attendanceMeeting, setAttendanceMeeting] = useState(null)

  useEffect(() => { dispatch(fetchMeetings(tab)) }, [tab, dispatch])

  const handleDelete = async (meetingId) => {
    if (!window.confirm('Delete this meeting?')) return
    const result = await dispatch(deleteMeeting(meetingId))
    if (deleteMeeting.fulfilled.match(result)) toast.success('Meeting deleted')
    else toast.error(result.payload || 'Failed to delete meeting')
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Meetings</Typography>
          {isTeacher && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Schedule Meeting
            </Button>
          )}
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label} />)}
        </Tabs>

        {listError && <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>}

        {listLoading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : list.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            No meetings here yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {list.map((m) => (
              <MeetingCard
                key={m.id} meeting={m} isTeacher={isTeacher}
                onDelete={handleDelete}
                onShowAttendance={setAttendanceMeeting}
              />
            ))}
          </Stack>
        )}
      </Box>

      <CreateMeetingDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AttendanceDialog
        meeting={attendanceMeeting} open={!!attendanceMeeting}
        onClose={() => setAttendanceMeeting(null)}
      />
    </MainLayout>
  )
}

export default MeetingsPage
