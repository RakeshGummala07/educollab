// NotificationBell.jsx — fully fixed
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  IconButton, Badge, Menu, Box, Typography, Avatar,
  List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Button, CircularProgress, Tooltip,
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
import {
  fetchNotifications, fetchUnreadCount, markNotificationRead,
  markAllNotificationsRead, deleteNotification, deleteAllReadNotifications,
  selectNotifications, selectUnreadNotifCount, selectNotificationsLoading,
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
  POST:         (id) => `/post/${id}`,
  COMMENT:      (id) => `/post/${id}`,
  CONVERSATION: ()   => `/chat`,
  ENROLLMENT:   ()   => `/community`,
}

const NotificationBell = () => {
  const dispatch      = useDispatch()
  const navigate      = useNavigate()
  const notifications = useSelector(selectNotifications)
  const unreadCount   = useSelector(selectUnreadNotifCount)
  const isLoading     = useSelector(selectNotificationsLoading)

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  useEffect(() => {
    dispatch(fetchUnreadCount())
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  const handleOpen  = (e) => {
    setAnchorEl(e.currentTarget)
    dispatch(fetchNotifications({ page: 0 }))
  }
  const handleClose = () => setAnchorEl(null)

  const handleNotifClick = (notif) => {
    if (!notif.read) dispatch(markNotificationRead(notif.id))
    const routeFn = ROUTE_MAP[notif.entityType]
    if (routeFn) navigate(routeFn(notif.entityId))
    handleClose()
  }

  const handleMarkAllRead = () => dispatch(markAllNotificationsRead())
  const handleClearRead   = () => dispatch(deleteAllReadNotifications())

  const handleDelete = (e, notificationId) => {
    e.stopPropagation()
    dispatch(deleteNotification(notificationId))
  }

  const timeAgo = (date) => {
    if (!date) return ''
    try { return formatDistanceToNowStrict(new Date(date), { addSuffix: true }) }
    catch { return '' }
  }

  return (
    <>
      {/* ✅ FIX 1: aria-label on IconButton — "Buttons must have discernible text" */}
      <IconButton
        onClick={handleOpen}
        aria-label={unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <BellIcon />
        </Badge>
      </IconButton>

      {/* ✅ FIX 2: keepMounted=false + disablePortal=false
              fixes "ARIA hidden element must not contain focusable elements"
              Menu unmounts when closed so no hidden focusable elements remain */}
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted={false}
        disablePortal={false}
        PaperProps={{
          sx: { width: 380, maxHeight: 480, mt: 1, borderRadius: 2 },
          role: 'dialog',
          'aria-label': 'Notifications panel',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header — NOT inside List so no ul/li issue */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ fontSize: 12 }}
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Tooltip title="Clear read notifications">
                {/* ✅ FIX 1: aria-label on IconButton */}
                <IconButton
                  size="small"
                  onClick={handleClearRead}
                  aria-label="Clear read notifications"
                >
                  <DeleteSweepIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Body */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
            <BellIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          // ✅ FIX 3: List → only ListItem children (fixes "<ul> must only contain <li>")
          // ✅ FIX 4: secondaryAction prop on ListItem moves the delete button
          //           OUTSIDE the ListItemButton — fixes "nested interactive controls"
          <List
            sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}
            disablePadding
            aria-label="Notification list"
          >
            {notifications.map((notif) => {
              const config = ICONS[notif.type] || ICONS.SYSTEM
              const Icon   = config.icon
              return (
                <ListItem
                  key={notif.id}
                  disablePadding
                  disableGutters
                  alignItems="flex-start"
                  // ✅ secondaryAction renders the delete button as a sibling
                  // of ListItemButton at the DOM level — not nested inside it
                  secondaryAction={
                    <Tooltip title="Delete notification">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={(e) => handleDelete(e, notif.id)}
                        // ✅ FIX 1: aria-label with context
                        aria-label={`Delete notification: ${notif.title}`}
                        sx={{
                          mr: 0.5,
                          opacity: 0.45,
                          '&:hover': { opacity: 1, color: 'error.main' },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{
                    bgcolor: notif.read ? 'transparent' : 'primary.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {/* ✅ ListItemButton is a direct child of ListItem (li) — valid HTML */}
                  <ListItemButton
                    onClick={() => handleNotifClick(notif)}
                    sx={{ px: 2, py: 1.25, pr: 6 }} // pr:6 so text doesn't hide behind delete btn
                  >
                    <ListItemAvatar>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={notif.actorAvatarUrl}
                          sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
                          alt={notif.actorFullName || 'User'}
                        >
                          {notif.actorFullName?.[0] || 'E'}
                        </Avatar>
                        {/* Type icon badge */}
                        <Box
                          aria-hidden="true"   // ✅ decorative — hidden from screen readers
                          sx={{
                            position: 'absolute', bottom: -2, right: -2,
                            width: 20, height: 20, borderRadius: '50%',
                            bgcolor: config.color, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white',
                          }}
                        >
                          <Icon sx={{ fontSize: 11, color: 'white' }} />
                        </Box>
                      </Box>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={notif.read ? 400 : 600}
                          noWrap
                        >
                          {notif.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {notif.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.disabled"
                          >
                            {timeAgo(notif.createdAt)}
                          </Typography>
                        </>
                      }
                    />

                    {/* Unread dot */}
                    {!notif.read && (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: 'primary.main', ml: 1, flexShrink: 0,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{
            p: 1, borderTop: '1px solid',
            borderColor: 'divider', textAlign: 'center',
          }}>
            <Button
              size="small"
              fullWidth
              onClick={() => { navigate('/notifications'); handleClose() }}
              aria-label="See all notifications"
            >
              See all notifications
            </Button>
          </Box>
        )}
      </Menu>
    </>
  )
}

export default NotificationBell