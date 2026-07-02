import { useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box, Button, TextField, Typography, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
  Divider, Stack,
} from '@mui/material'
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility, VisibilityOff,
  School as SchoolIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const LoginPage = () => {
  const { login, isLoading, error, dismissError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => { dismissError() }, [])

  const onSubmit = async (data) => {
    await login(data)
  }

  return (
    <AuthLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back
        </Typography>
        <Typography color="text.secondary">
          Sign in to continue learning
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={dismissError}>
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            autoComplete="email"
            autoFocus
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
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

          <Box sx={{ textAlign: 'right', mt: -1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary">
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5, mt: 1 }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.disabled">New here?</Typography>
      </Divider>

      <Typography align="center" variant="body2">
        Don't have an account?{' '}
        <Link component={RouterLink} to="/register" fontWeight={600} color="primary">
          Create account
        </Link>
      </Typography>
    </AuthLayout>
  )
}

// ── Shared Auth Layout ────────────────────────────────────────────────────
const AuthLayout = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #EDE9FE 100%)',
    }}
  >
    {/* Left panel — branding */}
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '45%',
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        color: 'white',
        p: 6,
        gap: 4,
      }}
    >
      <SchoolIcon sx={{ fontSize: 64, opacity: 0.9 }} />
      <Box textAlign="center">
        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          EduCollab
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400, lineHeight: 1.6 }}>
          Where teachers inspire and<br />students achieve together
        </Typography>
      </Box>
      <Stack spacing={2} sx={{ mt: 2, width: '100%', maxWidth: 300 }}>
        {['Real-time collaboration', 'AI-powered study tools', 'Live video sessions', 'Smart assignments'].map((feat) => (
          <Box key={feat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.7)' }} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{feat}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>

    {/* Right panel — form */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Mobile logo */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
          <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} color="primary">EduCollab</Typography>
        </Box>

        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            boxShadow: '0 8px 32px rgba(37,99,235,0.08)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  </Box>
)

export { AuthLayout }
export default LoginPage
