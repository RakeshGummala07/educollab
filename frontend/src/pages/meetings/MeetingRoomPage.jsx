import { useEffect, useMemo, useState,useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LiveKitRoom, GridLayout, ParticipantTile, RoomAudioRenderer,
  useTracks, useLocalParticipant,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track } from 'livekit-client'
import {
  Box, Stack, IconButton, Tooltip, Typography, Tabs, Tab, Badge,
  Button, CircularProgress, Paper,
} from '@mui/material'
import {
  Mic as MicIcon, MicOff as MicOffIcon, Videocam as VideocamIcon, VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon, StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon, PanTool as PanToolIcon, Lock as LockIcon, LockOpen as LockOpenIcon,
  Chat as ChatIcon, People as PeopleIcon, HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'

import { useAuth } from '../../hooks/useAuth'
import { useMeetingRoomSubscription } from '../../hooks/useWebSocket'
import meetingApi from '../../api/meetingApi'
import {
  fetchMeetingDetail, joinMeetingRoom, endMeetingRoom, startMeetingRoom,
  fetchMeetingChatHistory, fetchParticipants, fetchWaitingRoom, clearActiveMeeting,
} from '../../store/slices/meetingSlice'
import MeetingChatPanel from '../../components/meetings/MeetingChatPanel'
import ParticipantsPanel from '../../components/meetings/ParticipantsPanel'
import WaitingRoomPanel from '../../components/meetings/WaitingRoomPanel'

// ── Video grid, rendered inside <LiveKitRoom> so hooks have room context ──
const VideoStage = () => {

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

// ── Custom control bar (mic/camera/screen-share/hand-raise/lock/end) ──────
const ControlBarCustom = ({ meeting, meetingId, isModerator, onLeave }) => {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant()
  const [handRaised, setHandRaised] = useState(false)
  const [busy, setBusy] = useState(false)

  const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  const toggleCamera = () => localParticipant.setCameraEnabled(!isCameraEnabled)

  const toggleScreenShare = async () => {
    setBusy(true)
    try {
      if (!isScreenShareEnabled) {
        await meetingApi.startScreenShare(meetingId)   // soft-lock check first
        await localParticipant.setScreenShareEnabled(true)
      } else {
        await localParticipant.setScreenShareEnabled(false)
        await meetingApi.stopScreenShare(meetingId)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Screen share unavailable')
    }
    setBusy(false)
  }

  const toggleHandRaise = async () => {
    const res = await meetingApi.toggleHandRaise(meetingId)
    setHandRaised(res.data.data.raised)
  }

  const toggleLock = async () => {
    if (meeting.locked) await meetingApi.unlockMeeting(meetingId)
    else await meetingApi.lockMeeting(meetingId)
  }

  

  return (
    <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center"
      sx={{ p: 1.5, bgcolor: 'grey.900', borderRadius: 0 }}>
      <Tooltip title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}>
        <IconButton onClick={toggleMic} sx={{ color: 'white' }}>
          {isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon color="error" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}>
        <IconButton onClick={toggleCamera} sx={{ color: 'white' }}>
          {isCameraEnabled ? <VideocamIcon /> : <VideocamOffIcon color="error" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}>
        <span>
          <IconButton onClick={toggleScreenShare} disabled={busy} sx={{ color: 'white' }}>
            {isScreenShareEnabled ? <StopScreenShareIcon color="warning" /> : <ScreenShareIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Raise hand">
        <IconButton onClick={toggleHandRaise} sx={{ color: handRaised ? '#facc15' : 'white' }}>
          <PanToolIcon />
        </IconButton>
      </Tooltip>
      {isModerator && (
        <Tooltip title={meeting.locked ? 'Unlock meeting' : 'Lock meeting'}>
          <IconButton onClick={toggleLock} sx={{ color: 'white' }}>
            {meeting.locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Leave meeting">
        <IconButton onClick={onLeave} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}>
          <CallEndIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

const MeetingRoomPage = () => {
  const { meetingId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isTeacher } = useAuth()

  const { activeMeeting, joinInfo, joinLoading, joinError, waitingForApproval, attendance, waitingRoom,
    moderationEvents, participantEventTick } = useSelector((s) => s.meetings)

  const [sideTab, setSideTab] = useState('chat')
  const hasJoinedRef = useMemo(() => ({ current: false }), [meetingId])

  const { sendChat } = useMeetingRoomSubscription(Number(meetingId))

  useEffect(() => {

    if (hasJoinedRef.current) return
    hasJoinedRef.current = true

    dispatch(fetchMeetingDetail(meetingId))
    dispatch(joinMeetingRoom(meetingId))
    dispatch(fetchMeetingChatHistory(meetingId))
    return () => { dispatch(clearActiveMeeting()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId])

  const isModerator = useMemo(() => {
    if (!activeMeeting) return false
    if (activeMeeting.teacherId === user?.id) return true
    const me = attendance.find((a) => a.userId === user?.id)
    return me?.role === 'HOST' || me?.role === 'CO_HOST'
  }, [activeMeeting, attendance, user])

  useEffect(() => {
    if (meetingId) dispatch(fetchParticipants(meetingId))
  }, [meetingId, dispatch])

  // Live roster changes (join/leave/promote/demote/mute/kick/hand-raise) arrive
  // over WebSocket as lightweight events — re-pull the roster snapshot on each.
  useEffect(() => {
    if (meetingId && (moderationEvents.length > 0 || participantEventTick > 0)) dispatch(fetchParticipants(meetingId))
  }, [moderationEvents.length, participantEventTick, meetingId, dispatch])

  useEffect(() => {
    if (isModerator && meetingId) {
      dispatch(fetchWaitingRoom(meetingId))
    }
  }, [isModerator, meetingId, dispatch])

  const retriedForLiveRef = useRef(false)
  useEffect(() => {
    if (activeMeeting?.status !== 'LIVE') { retriedForLiveRef.current = false; return }
    if (joinInfo?.token || joinLoading || waitingForApproval) return
    if (retriedForLiveRef.current) return

    retriedForLiveRef.current = true
    dispatch(joinMeetingRoom(meetingId))
  }, [activeMeeting?.status, joinInfo?.token, joinLoading, waitingForApproval, meetingId, dispatch])

  const handleStart = async () => {
    const res = await dispatch(startMeetingRoom(meetingId))
    if (startMeetingRoom.fulfilled.match(res)) dispatch(joinMeetingRoom(meetingId))
  }

  const handleLeave = async () => {
    await meetingApi.leaveMeeting(meetingId)
    navigate('/meetings')
  }

  const handleEnd = async () => {
    if (!window.confirm('End this meeting for everyone?')) return
    await dispatch(endMeetingRoom(meetingId))
    navigate('/meetings')
  }

  // ── Meeting hasn't started yet (student view) ─────────────────────────
  if (activeMeeting && activeMeeting.status === 'SCHEDULED' && !isTeacher) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <HourglassEmptyIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography variant="h6">The host hasn't started this meeting yet</Typography>
        <Button variant="outlined" onClick={() => navigate('/meetings')}>Back to Meetings</Button>
      </Stack>
    )
  }

  // ── Host sees a "Start meeting" screen for a SCHEDULED meeting ────────
  if (activeMeeting && activeMeeting.status === 'SCHEDULED' && isTeacher) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <Typography variant="h6">{activeMeeting.title}</Typography>
        <Button variant="contained" size="large" onClick={handleStart}>Start Meeting</Button>
      </Stack>
    )
  }

  if (activeMeeting && (activeMeeting.status === 'ENDED' || activeMeeting.status === 'CANCELLED')) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <Typography variant="h6">This meeting has ended</Typography>
        <Button variant="outlined" onClick={() => navigate('/meetings')}>Back to Meetings</Button>
      </Stack>
    )
  }

  // ── Waiting room screen ────────────────────────────────────────────────
  if (waitingForApproval) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="h6">Waiting for the host to let you in…</Typography>
      </Stack>
    )
  }

  if (joinError && !joinLoading && !joinInfo?.token) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <Typography variant="h6" color="error">{joinError}</Typography>
        <Button variant="outlined" onClick={() => navigate('/meetings')}>Back to Meetings</Button>
      </Stack>
    )
  }

  if (joinLoading || !joinInfo?.token) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh', gap: 2 }}>
        <CircularProgress />
        {joinError && <Typography color="error">{joinError}</Typography>}
      </Stack>
    )
  }

  return (
    <LiveKitRoom
      token={joinInfo.token}
      serverUrl={joinInfo.livekitUrl}
      connect
      audio video
      data-lk-theme="default"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDisconnected={() => navigate('/meetings')}
    >
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, bgcolor: 'grey.900' }}>
            <VideoStage />
          </Box>
          <ControlBarCustom meeting={activeMeeting} meetingId={meetingId} isModerator={isModerator} onLeave={handleLeave} />
          {isModerator && (
            <Stack direction="row" justifyContent="center" sx={{ bgcolor: 'grey.900', pb: 1.5 }}>
              <Button size="small" color="error" variant="contained" onClick={handleEnd}>
                End Meeting for Everyone
              </Button>
            </Stack>
          )}
        </Box>

        <Paper elevation={0} square sx={{ width: 320, borderLeft: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Tabs value={sideTab} onChange={(_, v) => setSideTab(v)} variant="fullWidth">
            <Tab value="chat" icon={<ChatIcon fontSize="small" />} label="Chat" />
            <Tab value="participants" icon={<PeopleIcon fontSize="small" />} label="People" />
            {isModerator && (
              <Tab value="waiting" icon={
                <Badge badgeContent={waitingRoom.length} color="error">
                  <HourglassEmptyIcon fontSize="small" />
                </Badge>
              } label="Waiting" />
            )}
          </Tabs>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {sideTab === 'chat' && (
              <MeetingChatPanel
                meetingId={meetingId}
                currentUserId={user?.id}
                participants={attendance}
                chatMode={activeMeeting?.chatMode}
                isModerator={isModerator}
                onSend={sendChat}
              />
            )}
            {sideTab === 'participants' && (
              <ParticipantsPanel
                meetingId={meetingId}
                participants={attendance}
                currentUserId={user?.id}
                isModerator={isModerator}
              />
            )}
            {sideTab === 'waiting' && isModerator && <WaitingRoomPanel meetingId={meetingId} />}
          </Box>
        </Paper>
      </Stack>
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}

export default MeetingRoomPage
