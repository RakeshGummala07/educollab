import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Divider, Tooltip, useMediaQuery, useTheme, Chip, Badge,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  SmartToy as AIIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
  Feed as FeedIcon,
  AdminPanelSettings as AdminIcon,
  Notifications as NotifIcon,
  Group as CommunityIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { selectTotalUnread } from '../../store/slices/chatSlice'
import NotificationBell from '../notifications/NotificationBell'

const DRAWER_WIDTH = 240

const studentNav = [
  { label: 'Dashboard',  icon: <DashboardIcon />,  path: '/dashboard' },
  { label: 'Feed',       icon: <FeedIcon />,        path: '/feed' },
  { label: 'Messages',   icon: <ChatIcon />,         path: '/chat' },
  { label: 'Meetings',   icon: <VideoCallIcon />,    path: '/meetings' },
  { label: 'My Teachers',icon: <PeopleIcon />,       path: '/teachers' },
  { label: 'AI Assistant',icon: <AIIcon />,          path: '/ai' },
  { label: 'Profile',    icon: <PersonIcon />,       path: '/profile' },
]

const teacherNav = [
  { label: 'Dashboard',  icon: <DashboardIcon />,   path: '/dashboard' },
  { label: 'Feed',       icon: <FeedIcon />,         path: '/feed' },
  { label: 'Messages',   icon: <ChatIcon />,          path: '/chat' },
  { label: 'Meetings',   icon: <VideoCallIcon />,     path: '/meetings' },
  { label: 'Community',  icon: <CommunityIcon />,     path: '/community' },
  { label: 'AI Assistant',icon: <AIIcon />,           path: '/ai' },
  { label: 'Admin',      icon: <AdminIcon />,          path: '/admin' },
  { label: 'Profile',    icon: <PersonIcon />,        path: '/profile' },
]

const MainLayout = ({ children }) => {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isTeacher, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const unreadCount = useSelector(selectTotalUnread)

  const navItems = isTeacher ? teacherNav : studentNav

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{
        p: 2.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      }}>
        <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700} color="white">EduCollab</Typography>
      </Box>

      {/* User chip */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {user?.firstName?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip
              label={isTeacher ? 'Teacher' : 'Student'}
              size="small"
              color={isTeacher ? 'secondary' : 'primary'}
              sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: active ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'white' : 'text.secondary' }}>
                  {item.path === '/chat' && unreadCount > 0 ? (
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Logout */}
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Sign out"
              primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: 'none' },
          bgcolor: 'background.paper',
          borderBottom: '1px solid', borderColor: 'divider',
          width: '100%',
        }}
      >
        <Toolbar>
          <IconButton onClick={() => setMobileOpen(!mobileOpen)} edge="start">
            <MenuIcon />
          </IconButton>
          <SchoolIcon color="primary" sx={{ ml: 1, mr: 1 }} />
          <Typography variant="h6" fontWeight={700} color="primary">EduCollab</Typography>
          <Box sx={{ flex: 1 }} />
          <NotificationBell />
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            border: 'none',
            borderRight: '1px solid', borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: { md: `${DRAWER_WIDTH}px` },
          mt: { xs: '64px', md: 0 },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {/* Desktop top bar — just the bell, sidebar already has logo/nav */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            px: 3, py: 1,
            borderBottom: '1px solid', borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <NotificationBell />
        </Box>

        {children}
      </Box>
    </Box>
  )
}

export default MainLayout
