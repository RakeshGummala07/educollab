import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { store }          from './store'
import { theme }          from './utils/theme'
import ProtectedRoute     from './components/common/ProtectedRoute'
import RoleBasedRoute     from './components/common/RoleBasedRoute'
import ComingSoon         from './components/common/ComingSoon'
import { useWebSocketConnection } from './hooks/useWebSocket'   // ← THIS LINE MUST EXIST

import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import DashboardPage      from './pages/dashboard/DashboardPage'
import ProfilePage        from './pages/profile/ProfilePage'
import FeedPage           from './pages/feed/FeedPage'
import PostDetailPage     from './pages/feed/PostDetailPage'
import StudentsPage       from './pages/teacher/StudentsPage'
import TeachersPage       from './pages/student/TeachersPage'
import CommunityPage      from './pages/enrollment/CommunityPage'
import ChatPage           from './pages/chat/ChatPage'
import NotificationsPage  from './pages/notifications/NotificationsPage'
import MeetingsPage       from './pages/meetings/MeetingsPage'
import MeetingRoomPage    from './pages/meetings/MeetingRoomPage'

function WebSocketBridge() {
  useWebSocketConnection()
  return null
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <WebSocketBridge />
          <Routes>
            {/* ── Public ──────────────────────────────────────── */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Protected ───────────────────────────────────── */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/feed"      element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
            <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            <Route path="/community" element={
              <RoleBasedRoute allowedRoles={['ROLE_TEACHER']}>
                <CommunityPage />
              </RoleBasedRoute>
            } />
            <Route path="/students" element={
              <RoleBasedRoute allowedRoles={['ROLE_TEACHER']}>
                <StudentsPage />
              </RoleBasedRoute>
            } />
            <Route path="/admin" element={
              <RoleBasedRoute allowedRoles={['ROLE_TEACHER']}>
                <ComingSoon title="Admin Dashboard" day={8} />
              </RoleBasedRoute>
            } />

            <Route path="/teachers" element={
              <RoleBasedRoute allowedRoles={['ROLE_STUDENT']}>
                <TeachersPage />
              </RoleBasedRoute>
            } />

            <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
            <Route path="/meetings/:meetingId" element={<ProtectedRoute><MeetingRoomPage /></ProtectedRoute>} />
            <Route path="/ai"       element={<ProtectedRoute><ComingSoon title="AI Assistant" day={9} /></ProtectedRoute>} />

            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        <ToastContainer position="top-right" autoClose={4000} newestOnTop theme="light" />
      </ThemeProvider>
    </Provider>
  )
}

export default App