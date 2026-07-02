import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Avatar, Grid, Stack, Divider, LinearProgress, Chip,
  Alert, CircularProgress, Tab, Tabs, InputAdornment,
} from '@mui/material'
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LinkedIn as LinkedInIcon,
  Language as WebIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import {
  fetchMyProfile, updateMyProfile, changePassword,
  selectMyProfile, selectProfileUpdating,
  selectProfileError, selectProfileSuccess,
  clearProfileMessages,
} from '../../store/slices/profileSlice'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'

// ── Validation schemas ────────────────────────────────────────────────────
const profileSchema = yup.object({
  firstName: yup.string().min(2).max(50).required('Required'),
  lastName:  yup.string().min(2).max(50).required('Required'),
  bio:       yup.string().max(500).optional(),
  subject:   yup.string().max(100).optional(),
  institution: yup.string().max(100).optional(),
  phone:     yup.string().max(20).optional(),
  location:  yup.string().max(100).optional(),
  linkedinUrl: yup.string().optional(),
  websiteUrl:  yup.string().optional(),
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Required'),
  newPassword: yup.string().min(8).matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/).required('Required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Required'),
})

// ── Component ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const dispatch = useDispatch()
  const { isTeacher } = useAuth()
  const profile    = useSelector(selectMyProfile)
  const isUpdating = useSelector(selectProfileUpdating)
  const error      = useSelector(selectProfileError)
  const success    = useSelector(selectProfileSuccess)

  const [tab, setTab] = useState(0)
  const [editMode, setEditMode] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm({ resolver: yupResolver(profileSchema) })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd,
          formState: { errors: pwdErrors } } =
    useForm({ resolver: yupResolver(passwordSchema) })

  useEffect(() => {
    dispatch(fetchMyProfile())
  }, [dispatch])

  useEffect(() => {
    if (profile) {
      reset({
        firstName:   profile.firstName,
        lastName:    profile.lastName,
        bio:         profile.bio || '',
        subject:     profile.subject || '',
        institution: profile.institution || '',
        phone:       profile.phone || '',
        location:    profile.location || '',
        linkedinUrl: profile.linkedinUrl || '',
        websiteUrl:  profile.websiteUrl || '',
      })
    }
  }, [profile, reset])

  useEffect(() => {
    if (success) {
      setEditMode(false)
      const t = setTimeout(() => dispatch(clearProfileMessages()), 3000)
      return () => clearTimeout(t)
    }
  }, [success, dispatch])

  const onSubmitProfile = (data) => dispatch(updateMyProfile(data))
  const onSubmitPassword = (data) => {
    dispatch(changePassword(data)).then((r) => {
      if (!r.error) resetPwd()
    })
  }

  if (!profile) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    )
  }

  const completion = profile.profileCompletionPercent || 0
  const completionColor = completion < 40 ? 'error' : completion < 70 ? 'warning' : 'success'

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>

        {/* Alerts */}
        {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => dispatch(clearProfileMessages())}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Profile Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profile.avatarUrl}
                  sx={{
                    width: 90, height: 90,
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    fontSize: 36, fontWeight: 700,
                  }}
                >
                  {profile.firstName?.[0]}
                </Avatar>
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {profile.fullName}
                  </Typography>
                  <Chip
                    label={profile.roleDisplay}
                    size="small"
                    color={isTeacher ? 'secondary' : 'primary'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Typography color="text.secondary" variant="body2">@{profile.username}</Typography>
                <Typography color="text.secondary" variant="body2">{profile.email}</Typography>
                {profile.institution && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    🏫 {profile.institution}
                  </Typography>
                )}
                {profile.location && (
                  <Typography variant="body2" color="text.secondary">
                    📍 {profile.location}
                  </Typography>
                )}
              </Box>

              {/* Edit button */}
              <Button
                variant={editMode ? 'outlined' : 'contained'}
                startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                onClick={() => { setEditMode(!editMode); setTab(0) }}
                color={editMode ? 'inherit' : 'primary'}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            {/* Profile completion */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Profile Completion
                </Typography>
                <Typography variant="caption" fontWeight={700} color={`${completionColor}.main`}>
                  {completion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completion}
                color={completionColor}
                sx={{ height: 6, borderRadius: 3 }}
              />
              {completion < 70 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Complete your profile to unlock all features
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
          >
            <Tab label="Profile Info" />
            <Tab label="Change Password" />
          </Tabs>

          {/* ── Tab 0: Profile Info ─────────────────────────────────── */}
          {tab === 0 && (
            <CardContent sx={{ p: 3 }}>
              {!editMode ? (
                /* View mode */
                <Grid container spacing={3}>
                  {[
                    { label: 'First Name',   value: profile.firstName },
                    { label: 'Last Name',    value: profile.lastName },
                    { label: 'Email',        value: profile.email },
                    { label: 'Username',     value: `@${profile.username}` },
                    { label: 'Institution',  value: profile.institution },
                    { label: 'Subject',      value: profile.subject },
                    { label: 'Phone',        value: profile.phone },
                    { label: 'Location',     value: profile.location },
                  ].map(({ label, value }) => value ? (
                    <Grid item xs={12} sm={6} key={label}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {label.toUpperCase()}
                      </Typography>
                      <Typography variant="body1">{value}</Typography>
                    </Grid>
                  ) : null)}

                  {profile.bio && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>BIO</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{profile.bio}</Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      {profile.linkedinUrl && (
                        <Button size="small" startIcon={<LinkedInIcon />}
                          href={profile.linkedinUrl} target="_blank">LinkedIn</Button>
                      )}
                      {profile.websiteUrl && (
                        <Button size="small" startIcon={<WebIcon />}
                          href={profile.websiteUrl} target="_blank">Website</Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              ) : (
                /* Edit mode */
                <Box component="form" onSubmit={handleSubmit(onSubmitProfile)}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="First Name" fullWidth {...register('firstName')}
                        error={!!errors.firstName} helperText={errors.firstName?.message} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Last Name" fullWidth {...register('lastName')}
                        error={!!errors.lastName} helperText={errors.lastName?.message} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Bio" fullWidth multiline rows={3}
                        {...register('bio')} error={!!errors.bio} helperText={errors.bio?.message}
                        placeholder="Tell us about yourself..." />
                    </Grid>
                    {isTeacher && (
                      <Grid item xs={12} sm={6}>
                        <TextField label="Subject" fullWidth
                          {...register('subject')}
                          InputProps={{ startAdornment: <InputAdornment position="start"><SchoolIcon fontSize="small" /></InputAdornment> }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={isTeacher ? 6 : 12}>
                      <TextField label="Institution" fullWidth {...register('institution')}
                        placeholder="School / University" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Phone" fullWidth {...register('phone')}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Location" fullWidth {...register('location')}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="LinkedIn URL" fullWidth {...register('linkedinUrl')}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LinkedInIcon fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Website URL" fullWidth {...register('websiteUrl')}
                        InputProps={{ startAdornment: <InputAdornment position="start"><WebIcon fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ mb: 2 }} />
                      <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon />}
                          disabled={isUpdating}>
                          {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                        <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          )}

          {/* ── Tab 1: Change Password ──────────────────────────────── */}
          {tab === 1 && (
            <CardContent sx={{ p: 3, maxWidth: 480 }}>
              <Box component="form" onSubmit={handlePwd(onSubmitPassword)}>
                <Stack spacing={2.5}>
                  <TextField label="Current Password" type="password" fullWidth
                    {...regPwd('currentPassword')}
                    error={!!pwdErrors.currentPassword}
                    helperText={pwdErrors.currentPassword?.message}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }}
                  />
                  <TextField label="New Password" type="password" fullWidth
                    {...regPwd('newPassword')}
                    error={!!pwdErrors.newPassword}
                    helperText={pwdErrors.newPassword?.message || 'Min 8 chars, uppercase, lowercase, number'}
                  />
                  <TextField label="Confirm New Password" type="password" fullWidth
                    {...regPwd('confirmPassword')}
                    error={!!pwdErrors.confirmPassword}
                    helperText={pwdErrors.confirmPassword?.message}
                  />
                  <Button type="submit" variant="contained" disabled={isUpdating} sx={{ alignSelf: 'flex-start' }}>
                    {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          )}
        </Card>
      </Box>
    </MainLayout>
  )
}

export default ProfilePage
