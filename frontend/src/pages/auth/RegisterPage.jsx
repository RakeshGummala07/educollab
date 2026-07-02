import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box, Button, TextField, Typography, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
  Stack, ToggleButtonGroup, ToggleButton, Divider,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility, VisibilityOff,
  School as SchoolIcon,
  MenuBook as StudentIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from './LoginPage'

const schema = yup.object({
  firstName: yup.string().min(2, 'Min 2 chars').max(50).required('Required'),
  lastName: yup.string().min(2, 'Min 2 chars').max(50).required('Required'),
  username: yup
    .string()
    .min(3, 'Min 3 chars')
    .max(50)
    .matches(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only')
    .required('Required'),
  email: yup.string().email('Invalid email').required('Required'),
  password: yup
    .string()
    .min(8, 'Min 8 characters')
    .matches(/(?=.*[a-z])/, 'Needs a lowercase letter')
    .matches(/(?=.*[A-Z])/, 'Needs an uppercase letter')
    .matches(/(?=.*\d)/, 'Needs a number')
    .required('Required'),
  role: yup
    .string()
    .oneOf(['ROLE_STUDENT', 'ROLE_TEACHER'], 'Select a role')
    .required('Select a role'),
})

const RegisterPage = () => {
  const { register: registerUser, isLoading, error, dismissError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: 'ROLE_STUDENT' },
  })

  useEffect(() => { dismissError() }, [])

  const onSubmit = async (data) => {
    await registerUser(data)
  }

  const password = watch('password', '')
  const strengthScore = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const strengthColor = ['#E2E8F0', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#22C55E'][strengthScore]
  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][strengthScore]

  return (
    <AuthLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Create account
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Join thousands of learners and educators
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={dismissError}>
          {typeof error === 'object'
            ? Object.values(error).join(', ')
            : error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          {/* Role selector */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              I am a...
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  {...field}
                  exclusive
                  fullWidth
                  onChange={(_, val) => val && field.onChange(val)}
                  sx={{ gap: 1 }}
                >
                  <ToggleButton
                    value="ROLE_STUDENT"
                    sx={{
                      borderRadius: '10px !important',
                      border: '1.5px solid',
                      borderColor: field.value === 'ROLE_STUDENT' ? 'primary.main' : 'divider',
                      bgcolor: field.value === 'ROLE_STUDENT' ? 'primary.50' : 'transparent',
                      py: 1.5,
                      gap: 1,
                      '&.Mui-selected': {
                        bgcolor: '#EEF2FF',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <StudentIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Student</Typography>
                  </ToggleButton>
                  <ToggleButton
                    value="ROLE_TEACHER"
                    sx={{
                      borderRadius: '10px !important',
                      border: '1.5px solid',
                      borderColor: field.value === 'ROLE_TEACHER' ? 'secondary.main' : 'divider',
                      py: 1.5,
                      gap: 1,
                      '&.Mui-selected': {
                        bgcolor: '#F5F3FF',
                        color: 'secondary.main',
                        borderColor: 'secondary.main',
                      },
                    }}
                  >
                    <SchoolIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Teacher</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            />
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.role.message}
              </Typography>
            )}
          </Box>

          {/* Name row */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="First name"
              fullWidth
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Last name"
              fullWidth
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Box>

          <TextField
            label="Username"
            fullWidth
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography color="text.disabled" variant="body2">@</Typography>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Email address"
            type="email"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <Box>
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {password && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        bgcolor: i <= strengthScore ? strengthColor : '#E2E8F0',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: strengthColor }}>
                  {strengthLabel}
                </Typography>
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5, mt: 0.5 }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2.5 }}>
        <Typography variant="caption" color="text.disabled">already a member?</Typography>
      </Divider>

      <Typography align="center" variant="body2">
        <Link component={RouterLink} to="/login" fontWeight={600} color="primary">
          Sign in instead
        </Link>
      </Typography>
    </AuthLayout>
  )
}

export default RegisterPage
