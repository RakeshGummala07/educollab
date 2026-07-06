import { Box, Grid, Card, CardContent, Typography, Stack, Tooltip } from '@mui/material'
import {
  People as PeopleIcon, Article as ArticleIcon, VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon, Flag as FlagIcon, VolumeOff as VolumeOffIcon,
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'

const StatCard = ({ icon, label, value, color = 'primary' }) => (
  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: `${color}.50` || 'grey.100', color: `${color}.main`,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
)

const AnalyticsOverview = ({ analytics }) => {
  if (!analytics) return null

  const maxCount = Math.max(1, ...analytics.postsLast7Days.map((d) => d.count))

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<PeopleIcon />} label="Students" value={analytics.totalStudents} color="primary" />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<ArticleIcon />} label="Posts this week" value={analytics.postsThisWeek} color="info" />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<VideoCallIcon />} label="Meetings this month" value={analytics.meetingsHeldThisMonth} color="secondary" />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<CheckCircleIcon />} label="Avg. attendance" value={`${analytics.averageAttendanceRate}%`} color="success" />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<FlagIcon />} label="Pending reports" value={analytics.pendingReports} color="error" />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard icon={<VolumeOffIcon />} label="Chat restricted" value={analytics.restrictedStudentsCount} color="warning" />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Post activity — last 7 days
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ height: 120 }}>
            {analytics.postsLast7Days.map((d) => (
              <Stack key={d.date} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Tooltip title={`${d.count} post${d.count === 1 ? '' : 's'}`}>
                  <Box sx={{
                    width: '100%',
                    height: `${Math.max(4, (d.count / maxCount) * 90)}px`,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    transition: 'height 0.2s',
                  }} />
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {format(parseISO(d.date), 'EEE')}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AnalyticsOverview
