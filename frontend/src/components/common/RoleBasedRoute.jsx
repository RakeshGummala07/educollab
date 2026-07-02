import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectIsAuthenticated } from '../../store/slices/authSlice'
import { Box, Typography, Button } from '@mui/material'
import { Lock as LockIcon } from '@mui/icons-material'
import MainLayout from '../layout/MainLayout'

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', gap: 2, textAlign: 'center', p: 3,
          }}
        >
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#FEF2F2',
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ fontSize: 40, color: 'error.main' }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>Access Denied</Typography>
          <Typography color="text.secondary" maxWidth={400}>
            This page is restricted to {allowedRoles.map(r =>
              r === 'ROLE_TEACHER' ? 'Teachers' : 'Students').join(' and ')} only.
          </Typography>
          <Button variant="contained" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Box>
      </MainLayout>
    )
  }

  return children
}

export default RoleBasedRoute
