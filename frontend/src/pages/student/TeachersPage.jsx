import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Chip, CircularProgress, Alert, TextField,
  InputAdornment, Button, Divider, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack,
} from '@mui/material'
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  CheckCircle as EnrolledIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  PersonAdd as RequestIcon,
  Close as CancelIcon,
} from '@mui/icons-material'
import {
  fetchMyTeachers, fetchMyRequests, fetchAllTeachersToRequest,
  requestToJoin, cancelRequest, clearMessages,
  selectMyTeachers, selectMyRequests, selectAllTeachers,
  selectEnrollLoading, selectEnrollActing,
  selectEnrollError, selectEnrollSuccess,
} from '../../store/slices/enrollmentSlice'
import MainLayout from '../../components/layout/MainLayout'

import { useNavigate } from 'react-router-dom'
import { openDirectConversation } from '../../store/slices/chatSlice'

const TeachersPage = () => {
  const dispatch     = useDispatch()
  const myTeachers   = useSelector(selectMyTeachers)
  const myRequests   = useSelector(selectMyRequests)
  const allTeachers  = useSelector(selectAllTeachers)
  const isLoading    = useSelector(selectEnrollLoading)
  const isActing     = useSelector(selectEnrollActing)
  const error        = useSelector(selectEnrollError)
  const successMsg   = useSelector(selectEnrollSuccess)

  const [tab, setTab]                 = useState('enrolled')
  const [search, setSearch]           = useState('')
  const [actingId, setActingId]       = useState(null)
  const [requestDialog, setRequestDialog] = useState(null) // teacher to request
  const [message, setMessage]         = useState('')

  useEffect(() => {
    dispatch(fetchMyTeachers())
    dispatch(fetchMyRequests())
    dispatch(fetchAllTeachersToRequest())
  }, [dispatch])

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMessages()), 3500)
      return () => clearTimeout(t)
    }
  }, [successMsg, error, dispatch])

  // Build maps for quick lookup
  const enrolledTeacherIds = new Set(myTeachers.map(t => t.id))
  const requestMap = {}  // teacherId → request
  myRequests.forEach(r => { requestMap[r.teacherId] = r })

  const pendingRequests  = myRequests.filter(r => r.status === 'PENDING')
  const rejectedRequests = myRequests.filter(r => r.status === 'REJECTED')

  // Teachers not yet enrolled or pending
  const availableTeachers = allTeachers.filter(t =>
    !enrolledTeacherIds.has(t.id) &&
    `${t.fullName} ${t.subject || ''} ${t.institution || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const filteredEnrolled = myTeachers.filter(t =>
    `${t.fullName} ${t.subject || ''} ${t.institution || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const filteredPending = pendingRequests.filter(r =>
    `${r.teacherName} ${r.teacherSubject || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleSendRequest = async () => {
    if (!requestDialog) return
    setActingId(requestDialog.id)
    await dispatch(requestToJoin({ teacherId: requestDialog.id, message }))
    await dispatch(fetchMyRequests())
    setRequestDialog(null)
    setMessage('')
    setActingId(null)
  }

  const handleCancel = async (enrollmentId, teacherId) => {
    setActingId(teacherId)
    await dispatch(cancelRequest(enrollmentId))
    await dispatch(fetchMyRequests())
    setActingId(null)
  }

  const getTeacherRequestStatus = (teacherId) => {
    const req = requestMap[teacherId]
    if (!req) return null
    return req.status
  }

  const navigate = useNavigate()

  const handleMessage = async (teacherId) => {
    // POST /chat/conversations/direct/{teacherId}
    // Creates conversation if it doesn't exist, returns existing one if it does
    const result = await dispatch(openDirectConversation(teacherId))
    if (openDirectConversation.fulfilled.match(result)) {
      navigate('/chat') // activeConversationId is already set in Redux by the slice
    }
  }

  const tabs = [
    { value: 'enrolled', label: 'My Teachers',   count: myTeachers.length },
    { value: 'discover', label: 'Discover',       count: null },
    { value: 'pending',  label: 'Sent Requests',  count: pendingRequests.length },
  ]

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2, bgcolor: '#F5F3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'secondary.main',
          }}>
            <SchoolIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Teachers</Typography>
            <Typography variant="body2" color="text.secondary">
              {myTeachers.length} enrolled · {pendingRequests.length} pending
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
                      <Chip label={t.count} size="small"
                        sx={{ height: 18, fontSize: 10 }} />
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
          placeholder="Search teachers..."
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* ── Enrolled Tab ──────────────────────────────────── */}
            {tab === 'enrolled' && (
              filteredEnrolled.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SchoolIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {search ? 'No teachers match your search' : 'No teachers yet'}
                  </Typography>
                  {!search && (
                    <>
                      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Discover teachers and send a join request
                      </Typography>
                      <Button variant="contained" startIcon={<RequestIcon />}
                        onClick={() => setTab('discover')}>
                        Find Teachers
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredEnrolled.map(teacher => (
                    <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                      <TeacherCard teacher={teacher} status="ACTIVE" onMessage={handleMessage} />
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* ── Discover Tab ──────────────────────────────────── */}
            {tab === 'discover' && (
              availableTeachers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <EnrolledIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {search ? 'No teachers match your search' : 'You have sent requests to all teachers!'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {availableTeachers.map(teacher => {
                    const reqStatus = getTeacherRequestStatus(teacher.id)
                    return (
                      <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                        <TeacherCard
                          teacher={teacher}
                          status={reqStatus || 'NONE'}
                          actingId={actingId}
                          onMessage={handleMessage}
                          onRequest={() => setRequestDialog(teacher)}
                          onCancelRequest={(enrollmentId) =>
                            handleCancel(enrollmentId, teacher.id)
                          }
                          requestData={requestMap[teacher.id]}
                        />
                      </Grid>
                    )
                  })}
                </Grid>
              )
            )}

            {/* ── Pending Requests Tab ──────────────────────────── */}
            {tab === 'pending' && (
              filteredPending.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PendingIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {search ? 'No requests match' : 'No pending requests'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredPending.map(req => (
                    <Grid item xs={12} sm={6} md={4} key={req.id}>
                      <PendingRequestCard
                        request={req}
                        actingId={actingId}
                        onCancel={() => handleCancel(req.id, req.teacherId)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )
            )}
          </>
        )}
      </Box>

      {/* Request dialog */}
      <Dialog open={Boolean(requestDialog)} onClose={() => { setRequestDialog(null); setMessage('') }}
        maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={requestDialog?.avatarUrl}
            sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }}>
            {requestDialog?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Join {requestDialog?.firstName}'s Community
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {requestDialog?.subject && `${requestDialog.subject} · `}
              {requestDialog?.institution}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send a join request to <strong>{requestDialog?.fullName}</strong>.
            They will review and approve your request.
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            label="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself or explain why you'd like to join..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setRequestDialog(null); setMessage('') }} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSendRequest} variant="contained" disabled={isActing}>
            {isActing ? <CircularProgress size={18} color="inherit" /> : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}

// ── Teacher Card ──────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, status, actingId, onRequest, onCancelRequest, requestData, onMessage }) => {
  const isActing = actingId === teacher.id

  const statusConfig = {
    ACTIVE:   { label: 'Enrolled',  color: 'success', icon: <EnrolledIcon sx={{ fontSize: 14 }} /> },
    PENDING:  { label: 'Pending',   color: 'warning', icon: <PendingIcon  sx={{ fontSize: 14 }} /> },
    REJECTED: { label: 'Rejected',  color: 'error',   icon: <RejectedIcon sx={{ fontSize: 14 }} /> },
    NONE:     null,
  }

  const cfg = statusConfig[status]

  return (
    <Card sx={{
      height: '100%', transition: 'all 0.2s',
      border: '1px solid', borderColor: status === 'ACTIVE' ? 'secondary.100' : 'divider',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(124,58,237,0.12)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar src={teacher.avatarUrl}
            sx={{ width: 48, height: 48, bgcolor: 'secondary.main', fontWeight: 700 }}>
            {teacher.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{teacher.fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              @{teacher.username}
            </Typography>
            {teacher.subject && (
              <Chip label={teacher.subject} size="small" color="secondary"
                sx={{ height: 18, fontSize: 10, mt: 0.25 }} />
            )}
          </Box>
        </Box>

        {teacher.bio && (
          <Typography variant="body2" color="text.secondary" sx={{
            mb: 1.5, overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {teacher.bio}
          </Typography>
        )}

        {teacher.institution && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            🏫 {teacher.institution}
          </Typography>
        )}

        {cfg && (
          <Chip label={cfg.label} size="small" color={cfg.color}
            icon={cfg.icon} sx={{ height: 20, fontSize: 10, mb: 1.5 }} />
        )}

        {status === 'REJECTED' && requestData?.rejectReason && (
          <Box sx={{ bgcolor: 'error.50', borderRadius: 1, p: 1, mb: 1.5 }}>
            <Typography variant="caption" color="error.main">
              Reason: {requestData.rejectReason}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 1.5 }} />

        <Stack spacing={1}>
          {/* ✅ FIXED — onClick now dispatches openDirectConversation then navigates */}
          {status === 'ACTIVE' && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<ChatIcon />}
              fullWidth
              onClick={() => onMessage(teacher.id)}  
            >
              Message
            </Button>
          )}
          {status === 'NONE' && (
            <Button size="small" variant="contained"
              startIcon={isActing ? <CircularProgress size={14} color="inherit" /> : <RequestIcon />}
              onClick={onRequest} disabled={isActing} fullWidth>
              Send Request
            </Button>
          )}
          {status === 'PENDING' && (
            <Button size="small" variant="outlined" color="warning"
              startIcon={isActing ? <CircularProgress size={14} /> : <CancelIcon />}
              onClick={() => onCancelRequest(requestData?.id)}
              disabled={isActing} fullWidth>
              Cancel Request
            </Button>
          )}
          {status === 'REJECTED' && (
            <Button size="small" variant="outlined" color="primary"
              startIcon={<RequestIcon />}
              onClick={onRequest} fullWidth>
              Request Again
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Pending Request Card ──────────────────────────────────────────────────
const PendingRequestCard = ({ request, actingId, onCancel }) => {
  const isActing = actingId === request.teacherId
  return (
    <Card sx={{ border: '1px solid', borderColor: 'warning.200' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar src={request.teacherAvatarUrl}
            sx={{ width: 44, height: 44, bgcolor: 'secondary.main', fontWeight: 700 }}>
            {request.teacherName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{request.teacherName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              @{request.teacherUsername}
            </Typography>
            {request.teacherSubject && (
              <Chip label={request.teacherSubject} size="small" color="secondary"
                sx={{ height: 18, fontSize: 10, mt: 0.25 }} />
            )}
          </Box>
        </Box>

        <Chip label="Awaiting Approval" size="small" color="warning"
          icon={<PendingIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ height: 20, fontSize: 10, mb: 1.5 }} />

        {request.requestMessage && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontStyle: 'italic' }}>
            Your message: "{request.requestMessage}"
          </Typography>
        )}

        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
          Sent {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Button fullWidth size="small" variant="outlined" color="error"
          startIcon={isActing ? <CircularProgress size={14} /> : <CancelIcon />}
          onClick={onCancel} disabled={isActing}>
          Cancel Request
        </Button>
      </CardContent>
    </Card>
  )
}

export default TeachersPage
