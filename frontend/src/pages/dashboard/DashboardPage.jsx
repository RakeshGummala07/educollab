import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Button, Stack, Chip, LinearProgress,
} from '@mui/material'
import {
  Chat as ChatIcon, VideoCall as VideoCallIcon,
  SmartToy as AIIcon, People as PeopleIcon,
  Feed as FeedIcon, TrendingUp as TrendingUpIcon,
  School as SchoolIcon, AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowIcon, Group as CommunityIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { fetchMyProfile, selectMyProfile } from '../../store/slices/profileSlice'
import { fetchMyStudents, fetchMyTeachers,
         selectMyStudents, selectMyTeachers } from '../../store/slices/enrollmentSlice'
import MainLayout from '../../components/layout/MainLayout'

const DashboardPage = () => {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user, isTeacher } = useAuth()
  const profile    = useSelector(selectMyProfile)
  const myStudents = useSelector(selectMyStudents)
  const myTeachers = useSelector(selectMyTeachers)

  useEffect(() => {
    dispatch(fetchMyProfile())
    if (isTeacher) dispatch(fetchMyStudents())
    else           dispatch(fetchMyTeachers())
  }, [dispatch, isTeacher])

  const completion      = profile?.profileCompletionPercent || 0
  const completionColor = completion < 40 ? 'error' : completion < 70 ? 'warning' : 'success'

  const teacherActions = [
    { icon: <FeedIcon />,       label: 'Create Post',   color: '#2563EB', bg: '#EEF2FF', path: '/feed' },
    { icon: <VideoCallIcon />,  label: 'Start Meeting', color: '#7C3AED', bg: '#F5F3FF', path: '/meetings' },
    { icon: <CommunityIcon />,  label: 'My Community',  color: '#059669', bg: '#ECFDF5', path: '/community' },
    { icon: <AIIcon />,         label: 'AI Assistant',  color: '#D97706', bg: '#FFFBEB', path: '/ai' },
    { icon: <ChatIcon />,       label: 'Messages',      color: '#DC2626', bg: '#FEF2F2', path: '/chat' },
    { icon: <AdminIcon />,      label: 'Admin Panel',   color: '#6D28D9', bg: '#F5F3FF', path: '/admin' },
  ]

  const studentActions = [
    { icon: <FeedIcon />,       label: 'View Feed',     color: '#2563EB', bg: '#EEF2FF', path: '/feed' },
    { icon: <ChatIcon />,       label: 'Messages',      color: '#7C3AED', bg: '#F5F3FF', path: '/chat' },
    { icon: <VideoCallIcon />,  label: 'Join Meeting',  color: '#059669', bg: '#ECFDF5', path: '/meetings' },
    { icon: <AIIcon />,         label: 'AI Assistant',  color: '#D97706', bg: '#FFFBEB', path: '/ai' },
    { icon: <SchoolIcon />,     label: 'My Teachers',   color: '#DC2626', bg: '#FEF2F2', path: '/teachers' },
    { icon: <PeopleIcon />,     label: 'Study Tools',   color: '#6D28D9', bg: '#F5F3FF', path: '/ai' },
  ]

  const actions = isTeacher ? teacherActions : studentActions

  const stats = isTeacher
    ? [
        { label: 'Students',   value: myStudents.length || '—', sub: 'in community',  icon: <PeopleIcon />,   color: '#EEF2FF', iconColor: '#2563EB', path: '/community' },
        { label: 'Posts',      value: '—',                      sub: 'published',     icon: <FeedIcon />,     color: '#F5F3FF', iconColor: '#7C3AED', path: '/feed' },
        { label: 'Meetings',   value: '—',                      sub: 'this week',     icon: <VideoCallIcon />,color: '#ECFDF5', iconColor: '#059669', path: '/meetings' },
      ]
    : [
        { label: 'Teachers',   value: myTeachers.length || '—', sub: 'enrolled with', icon: <SchoolIcon />,   color: '#EEF2FF', iconColor: '#2563EB', path: '/teachers' },
        { label: 'Messages',   value: '—',                      sub: 'unread',        icon: <ChatIcon />,     color: '#F5F3FF', iconColor: '#7C3AED', path: '/chat' },
        { label: 'Meetings',   value: '—',                      sub: 'upcoming',      icon: <VideoCallIcon />,color: '#ECFDF5', iconColor: '#059669', path: '/meetings' },
      ]

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>

        {/* Welcome Banner */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', color: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar
                src={profile?.avatarUrl}
                sx={{
                  width: 64, height: 64,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: 26, fontWeight: 700,
                  border: '3px solid rgba(255,255,255,0.4)',
                }}
              >
                {user?.firstName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  Welcome back, {user?.firstName}! 👋
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography sx={{ opacity: 0.85 }} variant="body2">
                    @{user?.username}
                  </Typography>
                  <Chip
                    label={isTeacher ? 'Teacher' : 'Student'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                  />
                </Stack>
              </Box>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/profile')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                View Profile
              </Button>
            </Box>

            {completion < 100 && (
              <Box sx={{ mt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Profile completion
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>{completion}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completion}
                  sx={{
                    height: 6, borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { bgcolor: 'white' },
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Card
                onClick={() => navigate(stat.path)}
                sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }, transition: 'all 0.2s' }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: stat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: stat.iconColor,
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} lineHeight={1}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label} {stat.sub}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {isTeacher ? '🎓 Teacher Tools' : '📚 Quick Access'}
        </Typography>
        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid item xs={6} sm={4} key={action.label}>
              <Card
                onClick={() => navigate(action.path)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.15)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: '20px !important' }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 2.5,
                    bgcolor: action.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: action.color, mx: 'auto', mb: 1.5,
                  }}>
                    {action.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{action.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Profile completion nudge */}
        {completion < 70 && (
          <Card
            sx={{ mt: 3, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
              <TrendingUpIcon sx={{ color: '#D97706' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} color="#92400E">
                  Complete your profile ({completion}% done)
                </Typography>
                <Typography variant="caption" color="#B45309">
                  Add bio, institution and contact info to unlock full features
                </Typography>
              </Box>
              <ArrowIcon sx={{ color: '#D97706' }} />
            </CardContent>
          </Card>
        )}
      </Box>
    </MainLayout>
  )
}

export default DashboardPage
