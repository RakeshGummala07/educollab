import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Avatar, List, ListItemButton,
  ListItemAvatar, ListItemText, Button, CircularProgress,
  Divider, IconButton, Tooltip,
} from '@mui/material'
import {
  Notifications as BellIcon,
  Favorite as LikeIcon,
  ChatBubble as CommentIcon,
  Share as ShareIcon,
  Message as MessageIcon,
  Group as EnrollIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  PersonRemove as RemovedIcon,
  Info as SystemIcon,
  Close as CloseIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material'
import { formatDistanceToNowStrict } from 'date-fns'
import MainLayout from '../../components/layout/MainLayout'
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, deleteAllReadNotifications, deleteAllNotifications,
  selectNotifications, selectNotificationsLoading, selectNotificationsHasMore,
  selectUnreadNotifCount,
} from '../../store/slices/notificationSlice'

const ICONS = {
  POST_LIKE:           { icon: LikeIcon,     color: '#DC2626' },
  POST_COMMENT:        { icon: CommentIcon,  color: '#2563EB' },
  COMMENT_REPLY:       { icon: CommentIcon,  color: '#2563EB' },
  POST_SHARE:          { icon: ShareIcon,    color: '#059669' },
  NEW_MESSAGE:         { icon: MessageIcon,  color: '#7C3AED' },
  ENROLLMENT_REQUEST:  { icon: EnrollIcon,   color: '#D97706' },
  ENROLLMENT_APPROVED: { icon: ApprovedIcon, color: '#059669' },
  ENROLLMENT_REJECTED: { icon: RejectedIcon, color: '#DC2626' },
  STUDENT_REMOVED:     { icon: RemovedIcon,  color: '#DC2626' },
  SYSTEM:              { icon: SystemIcon,   color: '#64748B' },
}

const ROUTE_MAP = {
  POST: (id) => `/post/${id}`,
  COMMENT: (id) => `/post/${id}`,
  CONVERSATION: () => `/chat`,
  ENROLLMENT: () => `/community`,
}

const NotificationsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const notifications = useSelector(selectNotifications)
  const isLoading      = useSelector(selectNotificationsLoading)
  const hasMore        = useSelector(selectNotificationsHasMore)
  const unreadCount    = useSelector(selectUnreadNotifCount)

  useEffect(() => {
    dispatch(fetchNotifications({ page: 0 }))
  }, [dispatch])

  const handleClick = (notif) => {
    if (!notif.read) dispatch(markNotificationRead(notif.id))
    const routeFn = ROUTE_MAP[notif.entityType]
    if (routeFn) navigate(routeFn(notif.entityId))
  }

  const handleDelete = (e, notificationId) => {
    e.stopPropagation()
    dispatch(deleteNotification(notificationId))
  }

  const handleClearRead = () => {
    dispatch(deleteAllReadNotifications())
  }

  const handleClearAll = () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      dispatch(deleteAllNotifications())
    }
  }

  const loadMore = () => {
    const nextPage = Math.floor(notifications.length / 20)
    dispatch(fetchNotifications({ page: nextPage }))
  }

  const timeAgo = (date) => {
    if (!date) return ''
    try { return formatDistanceToNowStrict(new Date(date), { addSuffix: true }) }
    catch { return '' }
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 680, mx: 'auto' }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => dispatch(markAllNotificationsRead())}>
              Mark all read
            </Button>
          )}
        </Box>

        {notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small" variant="outlined"
              startIcon={<DeleteSweepIcon />}
              onClick={handleClearRead}
              disabled={!notifications.some(n => n.read)}
            >
              Clear read
            </Button>
            <Button
              size="small" variant="outlined" color="error"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </Box>
        )}

        {isLoading && notifications.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && notifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BellIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No notifications yet</Typography>
            <Typography variant="body2" color="text.disabled">
              You'll see likes, comments, messages, and requests here
            </Typography>
          </Box>
        )}

        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 0 }}>
          {notifications.map((notif, idx) => {
            const config = ICONS[notif.type] || ICONS.SYSTEM
            const Icon = config.icon
            return (
              <Box key={notif.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: notif.read ? 'transparent' : 'primary.50' }}>
                  <ListItemButton
                    onClick={() => handleClick(notif)}
                    sx={{ px: 2, py: 1.5, flex: 1, minWidth: 0 }}
                  >
                    <ListItemAvatar>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar src={notif.actorAvatarUrl} sx={{ width: 44, height: 44, bgcolor: 'grey.300' }}>
                          {notif.actorFullName?.[0] || 'E'}
                        </Avatar>
                        <Box sx={{
                          position: 'absolute', bottom: -2, right: -2,
                          width: 22, height: 22, borderRadius: '50%',
                          bgcolor: config.color, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          border: '2px solid white',
                        }}>
                          <Icon sx={{ fontSize: 12, color: 'white' }} />
                        </Box>
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={notif.read ? 400 : 700}>
                          {notif.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">{notif.message}</Typography>
                          <Typography variant="caption" color="text.disabled">{timeAgo(notif.createdAt)}</Typography>
                        </>
                      }
                    />
                    {!notif.read && (
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', ml: 1, flexShrink: 0 }} />
                    )}
                  </ListItemButton>

                  {/* Delete button lives OUTSIDE the ListItemButton — nesting an
                      interactive button inside another button element causes
                      unpredictable event bubbling and a stuck-looking UI. */}
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(e, notif.id)}
                      sx={{ mr: 1.5, flexShrink: 0, opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {idx < notifications.length - 1 && <Divider />}
              </Box>
            )
          })}
        </List>

        {hasMore && notifications.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button onClick={loadMore} disabled={isLoading}>
              {isLoading ? <CircularProgress size={18} /> : 'Load more'}
            </Button>
          </Box>
        )}
      </Box>
    </MainLayout>
  )
}

export default NotificationsPage
