import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Chip, Button, TextField, InputAdornment,
  Alert, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Stack,
  Tooltip, Badge, Tab, Tabs,
} from '@mui/material'
import {
  Search as SearchIcon,
  PersonAdd as AddIcon,
  PersonRemove as RemoveIcon,
  Group as GroupIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  HourglassEmpty as PendingIcon,
  Message as MessageIcon,
} from '@mui/icons-material'
import {
  fetchMyStudents, fetchPendingRequests, fetchAllStudentsToAdd,
  approveRequest, rejectRequest, addStudentDirectly, removeStudent,
  clearMessages,
  selectMyStudents, selectPendingRequests, selectAllStudents,
  selectEnrollLoading, selectEnrollActing,
  selectEnrollError, selectEnrollSuccess,
} from '../../store/slices/enrollmentSlice'
import MainLayout from '../../components/layout/MainLayout'

const CommunityPage = () => {
  const dispatch        = useDispatch()
  const myStudents      = useSelector(selectMyStudents)
  const pendingRequests = useSelector(selectPendingRequests)
  const allStudents     = useSelector(selectAllStudents)
  const isLoading       = useSelector(selectEnrollLoading)
  const isActing        = useSelector(selectEnrollActing)
  const error           = useSelector(selectEnrollError)
  const successMsg      = useSelector(selectEnrollSuccess)

  const [tab, setTab]             = useState('enrolled')
  const [search, setSearch]       = useState('')
  const [actingId, setActingId]   = useState(null)
  const [removeDialog, setRemoveDialog] = useState(null)
  const [rejectDialog, setRejectDialog] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    dispatch(fetchMyStudents())
    dispatch(fetchPendingRequests())
    dispatch(fetchAllStudentsToAdd())
  }, [dispatch])

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMessages()), 3500)
      return () => clearTimeout(t)
    }
  }, [successMsg, error, dispatch])

  // After approve/reject refresh students list
  useEffect(() => {
    dispatch(fetchMyStudents())
  }, [pendingRequests.length])

  const enrolledIds = new Set(myStudents.map(s => s.id))
  const pendingIds  = new Set(pendingRequests.map(r => r.studentId))

  const filteredEnrolled = myStudents.filter(s =>
    `${s.fullName} ${s.email} ${s.username} ${s.institution || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const filteredAdd = allStudents.filter(s =>
    !enrolledIds.has(s.id) &&
    !pendingIds.has(s.id) &&
    `${s.fullName} ${s.email} ${s.username}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const filteredPending = pendingRequests.filter(r =>
    `${r.studentName} ${r.studentUsername}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = async (enrollmentId) => {
    setActingId(enrollmentId)
    await dispatch(approveRequest(enrollmentId))
    setActingId(null)
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    setActingId(rejectDialog.id)
    await dispatch(rejectRequest({ enrollmentId: rejectDialog.id, reason: rejectReason }))
    setRejectDialog(null)
    setRejectReason('')
    setActingId(null)
  }

  const handleAdd = async (studentId) => {
    setActingId(studentId)
    await dispatch(addStudentDirectly(studentId))
    await dispatch(fetchMyStudents())
    setActingId(null)
  }

  const handleRemove = async () => {
    if (!removeDialog) return
    setActingId(removeDialog.id)
    await dispatch(removeStudent(removeDialog.id))
    setRemoveDialog(null)
    setActingId(null)
  }

  const tabs = [
    { value: 'enrolled', label: 'Enrolled',  count: myStudents.length },
    { value: 'pending',  label: 'Requests',  count: pendingRequests.length, badge: true },
    { value: 'add',      label: 'Add Students', count: null },
  ]

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2, bgcolor: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'primary.main',
          }}>
            <GroupIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Community</Typography>
            <Typography variant="body2" color="text.secondary">
              {myStudents.length} enrolled · {pendingRequests.length} pending
            </Typography>
          </Box>
        </Box>

        {/* Alerts */}
        {error      && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => dispatch(clearMessages())}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => dispatch(clearMessages())}>{successMsg}</Alert>}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch('') }}>
            {tabs.map(t => (
              <Tab
                key={t.value}
                value={t.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {t.label}
                    {t.count !== null && (
                      <Chip
                        label={t.count}
                        size="small"
                        color={t.badge && t.count > 0 ? 'error' : 'default'}
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Box>
                }
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Search */}
        <TextField
          fullWidth size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* ── Enrolled Tab ──────────────────────────────────── */}
            {tab === 'enrolled' && (
              filteredEnrolled.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <GroupIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {search ? 'No students match your search' : 'No enrolled students yet'}
                  </Typography>
                  {!search && (
                    <Button variant="contained" sx={{ mt: 2 }}
                      startIcon={<AddIcon />} onClick={() => setTab('add')}>
                      Add Students
                    </Button>
                  )}
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredEnrolled.map(student => (
                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                      <StudentCard
                        user={student}
                        status="ACTIVE"
                        actingId={actingId}
                        onRemove={() => setRemoveDialog(student)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* ── Pending Requests Tab ──────────────────────────── */}
            {tab === 'pending' && (
              filteredPending.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PendingIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {search ? 'No requests match your search' : 'No pending requests'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredPending.map(request => (
                    <Grid item xs={12} sm={6} key={request.id}>
                      <RequestCard
                        request={request}
                        actingId={actingId}
                        onApprove={() => handleApprove(request.id)}
                        onReject={() => setRejectDialog(request)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* ── Add Students Tab ──────────────────────────────── */}
            {tab === 'add' && (
              filteredAdd.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ApproveIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {search ? 'No students match your search' : 'All students are enrolled!'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredAdd.map(student => (
                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                      <StudentCard
                        user={student}
                        status="NONE"
                        actingId={actingId}
                        onAdd={() => handleAdd(student.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )
            )}
          </>
        )}
      </Box>

      {/* Remove dialog */}
      <Dialog open={Boolean(removeDialog)} onClose={() => setRemoveDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" /> Remove Student
        </DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{removeDialog?.fullName}</strong> from your community?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They can send a new request to re-join later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveDialog(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleRemove} variant="contained" color="error" disabled={isActing}>
            {isActing ? <CircularProgress size={18} color="inherit" /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectDialog)} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RejectIcon color="error" /> Reject Request
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Reject <strong>{rejectDialog?.studentName}</strong>'s join request?
          </Typography>
          <TextField
            fullWidth multiline rows={2}
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Let the student know why..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setRejectDialog(null); setRejectReason('') }} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={isActing}>
            {isActing ? <CircularProgress size={18} color="inherit" /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}

// ── Student Card ──────────────────────────────────────────────────────────
const StudentCard = ({ user, status, actingId, onAdd, onRemove }) => {
  const isActing = actingId === user.id
  return (
    <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar src={user.avatarUrl}
            sx={{ width: 44, height: 44, bgcolor: status === 'ACTIVE' ? 'primary.main' : 'grey.400', fontWeight: 700 }}>
            {user.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{user.fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">@{user.username}</Typography>
            {user.institution && (
              <Typography variant="caption" color="text.disabled" noWrap display="block">🏫 {user.institution}</Typography>
            )}
          </Box>
        </Box>
        {status === 'ACTIVE' && (
          <Chip label="Enrolled" size="small" color="primary"
            icon={<ApproveIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ height: 20, fontSize: 10, mb: 1.5 }} />
        )}
        <Divider sx={{ mb: 1.5 }} />
        {status === 'ACTIVE' ? (
          <Button fullWidth size="small" variant="outlined" color="error"
            startIcon={isActing ? <CircularProgress size={14} /> : <RemoveIcon />}
            onClick={onRemove} disabled={isActing}>
            Remove
          </Button>
        ) : (
          <Button fullWidth size="small" variant="contained" color="success"
            startIcon={isActing ? <CircularProgress size={14} /> : <AddIcon />}
            onClick={onAdd} disabled={isActing}>
            Add Directly
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ── Request Card ──────────────────────────────────────────────────────────
const RequestCard = ({ request, actingId, onApprove, onReject }) => {
  const isActing = actingId === request.id
  return (
    <Card sx={{ border: '1px solid', borderColor: 'warning.200', transition: 'all 0.2s' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar src={request.studentAvatarUrl}
            sx={{ width: 48, height: 48, bgcolor: 'warning.main', fontWeight: 700 }}>
            {request.studentName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{request.studentName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              @{request.studentUsername}
            </Typography>
            <Chip label="Pending" size="small" color="warning"
              icon={<PendingIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ height: 18, fontSize: 10, mt: 0.25 }} />
          </Box>
        </Box>

        {request.requestMessage && (
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.5, mb: 1.5, display: 'flex', gap: 1 }}>
            <MessageIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.25, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              "{request.requestMessage}"
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
          Requested {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Stack direction="row" spacing={1}>
          <Button fullWidth size="small" variant="contained" color="success"
            startIcon={isActing ? <CircularProgress size={14} color="inherit" /> : <ApproveIcon />}
            onClick={onApprove} disabled={isActing}>
            Approve
          </Button>
          <Button fullWidth size="small" variant="outlined" color="error"
            startIcon={<RejectIcon />}
            onClick={onReject} disabled={isActing}>
            Reject
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CommunityPage
