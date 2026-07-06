import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Card, CardContent, Typography, Avatar,
  IconButton, Button, Collapse, Chip,
  Stack, Menu, MenuItem, Tooltip, Snackbar, Alert,
} from '@mui/material'
import {
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  BookmarkBorder as SaveIcon,
  Flag as FlagIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { toggleLike, deletePost, sharePost } from '../../store/slices/feedSlice'
import { selectCurrentUser } from '../../store/slices/authSlice'
import CommentSection from './CommentSection'
import ImageLightbox from './ImageLightbox'
import ReportContentDialog from '../admin/ReportContentDialog'

import { selectMyStudents } from '../../store/slices/enrollmentSlice'

const PostCard = ({ post, onEdit }) => {
  const dispatch    = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const [reportOpen, setReportOpen] = useState(false)

  const [showComments, setShowComments] = useState(false)
  const [anchorEl, setAnchorEl]         = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [snackbar, setSnackbar]           = useState({ open: false, msg: '' })

  const isLiked   = post.likedByCurrentUser
  const isOwner = post.ownedByCurrentUser
  const isTeacher = currentUser?.role === 'ROLE_TEACHER'


  const myStudents = useSelector(selectMyStudents);


const isMyStudent = myStudents.some(
    student => student.id === post.authorId
)

const canDelete =
    isOwner ||
    (
        currentUser?.role === 'ROLE_TEACHER' &&
        post.authorRole === 'ROLE_STUDENT' &&
        isMyStudent
    )

const canEdit = canDelete
  
    

  const roleColor = post.authorRole === 'ROLE_TEACHER' ? 'secondary' : 'primary'
  const roleLabel = post.authorRole === 'ROLE_TEACHER' ? 'Teacher' : 'Student'

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : ''

  const handleLike = async () => {
    setLikeAnimating(true)
    await dispatch(toggleLike(post.id))
    setTimeout(() => setLikeAnimating(false), 300)
  }

  const handleShare = async () => {
    await dispatch(sharePost(post.id))
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      setSnackbar({ open: true, msg: 'Link copied to clipboard!' })
    }
  }

  const handleDelete = async () => {
    setAnchorEl(null)
    await dispatch(deletePost(post.id))
  }

  const imageAttachments = post.mediaAttachments?.filter(m => m.type === 'image') || []
  const videoAttachments = post.mediaAttachments?.filter(m => m.type === 'video') || []

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }



  return (
    <>
      <Card
        sx={{
          mb: 2,
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: '0 4px 20px rgba(37,99,235,0.08)' },
        }}
      >
        <CardContent sx={{ pb: '12px !important' }}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={post.authorAvatarUrl}
                sx={{
                  width: 44, height: 44,
                  bgcolor: `${roleColor}.main`, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {post.authorFullName?.[0]}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {post.authorFullName}
                  </Typography>
                  <Chip
                    label={roleLabel}
                    size="small"
                    color={roleColor}
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  @{post.authorUsername} · {timeAgo}
                </Typography>
              </Box>
            </Box>

            {/* More menu */}
            {(canDelete || !isOwner) && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{ sx: { minWidth: 140 } }}
                >
                  {isOwner && (
                    <MenuItem
                      onClick={() => { setAnchorEl(null); onEdit?.(post) }}
                      sx={{ gap: 1, fontSize: 14 }}
                    >
                      <EditIcon fontSize="small" /> Edit post
                    </MenuItem>
                  )}
                  {canDelete && (
                    <MenuItem
                      onClick={handleDelete}
                      sx={{ gap: 1, fontSize: 14, color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" /> Delete
                    </MenuItem>
                  )}
                  {!isOwner && (
                    <MenuItem
                      onClick={() => { setAnchorEl(null); setReportOpen(true) }}
                      sx={{ gap: 1, fontSize: 14 }}
                    >
                      <FlagIcon fontSize="small" /> Report post
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Box>

          {/* ── Content ────────────────────────────────────────────── */}
          <Typography
            variant="body1"
            sx={{
              mb: 1.5, lineHeight: 1.7,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {post.content}
          </Typography>

          {/* ── Image Grid ─────────────────────────────────────────── */}
          {imageAttachments.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: imageAttachments.length === 1
                  ? '1fr'
                  : imageAttachments.length === 2
                    ? 'repeat(2, 1fr)'
                    : imageAttachments.length === 3
                      ? '2fr 1fr'
                      : 'repeat(2, 1fr)',
                gap: 0.5,
                mb: 1.5,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {imageAttachments.slice(0, 4).map((media, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: 'relative',
                    aspectRatio: imageAttachments.length === 1 ? '16/9' : '1/1',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover img': { transform: 'scale(1.03)' },
                    gridRow: imageAttachments.length === 3 && idx === 0 ? 'span 2' : undefined,
                  }}
                  onClick={() => openLightbox(idx)}
                >
                  <Box
                    component="img"
                    src={media.url}
                    alt={media.originalName}
                    sx={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                  {/* +N overlay for 4+ images */}
                  {idx === 3 && imageAttachments.length > 4 && (
                    <Box
                      sx={{
                        position: 'absolute', inset: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Typography color="white" variant="h6" fontWeight={700}>
                        +{imageAttachments.length - 4}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* ── Video ──────────────────────────────────────────────── */}
          {videoAttachments.map((media, idx) => (
            <Box
              key={idx}
              sx={{ mb: 1.5, borderRadius: 2, overflow: 'hidden', bgcolor: 'black' }}
            >
              <Box
                component="video"
                src={media.url}
                controls
                sx={{ width: '100%', maxHeight: 400, display: 'block' }}
              />
            </Box>
          ))}

          {/* ── Engagement counts ───────────────────────────────────── */}
          {(post.likeCount > 0 || post.commentCount > 0 || post.shareCount > 0) && (
            <Box sx={{ display: 'flex', gap: 2.5, mb: 0.75 }}>
              {post.likeCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ❤️ {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
                </Typography>
              )}
              {post.commentCount > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => setShowComments(!showComments)}
                >
                  💬 {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </Typography>
              )}
              {post.shareCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  🔁 {post.shareCount} shares
                </Typography>
              )}
            </Box>
          )}

          {/* ── Action buttons ──────────────────────────────────────── */}
          <Box
            sx={{
              display: 'flex',
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 0.75, mt: 0.75,
            }}
          >
            {/* Like */}
            <Button
              size="small"
              onClick={handleLike}
              startIcon={
                <Box
                  sx={{
                    transform: likeAnimating ? 'scale(1.4)' : 'scale(1)',
                    transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    color: isLiked ? 'error.main' : 'inherit',
                  }}
                >
                  {isLiked ? <LikedIcon /> : <LikeIcon />}
                </Box>
              }
              sx={{
                flex: 1, color: isLiked ? 'error.main' : 'text.secondary',
                fontWeight: isLiked ? 700 : 400, fontSize: 13,
                '&:hover': { bgcolor: 'error.50', color: 'error.main' },
              }}
            >
              Like
            </Button>

            {/* Comment */}
            <Button
              size="small"
              startIcon={<CommentIcon />}
              onClick={() => setShowComments(!showComments)}
              sx={{
                flex: 1, color: showComments ? 'primary.main' : 'text.secondary',
                fontWeight: showComments ? 700 : 400, fontSize: 13,
                '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
              }}
            >
              Comment
            </Button>

            {/* Share */}
            <Tooltip title="Copy link">
              <Button
                size="small"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  flex: 1, color: 'text.secondary', fontSize: 13,
                  '&:hover': { bgcolor: 'success.50', color: 'success.main' },
                }}
              >
                Share
              </Button>
            </Tooltip>
          </Box>

          {/* ── Comments section ─────────────────────────────────────── */}
          <Collapse in={showComments}>
            <Box sx={{ mt: 1 }}>
              <CommentSection post={post} />
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Image lightbox */}
      <ImageLightbox
        images={imageAttachments}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Report dialog */}
      <ReportContentDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="POST"
        contentId={post.id}
      />

      {/* Share snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PostCard
