import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Avatar, Typography, IconButton,
  TextField, Button, Collapse, Divider,
  CircularProgress, Tooltip, Stack,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Send as SendIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import {
  addComment, deleteComment, fetchAllComments,
  selectExpandedComments,
} from '../../store/slices/feedSlice'
import { selectCurrentUser } from '../../store/slices/authSlice'
import { selectMyStudents } from '../../store/slices/enrollmentSlice'

const CommentSection = ({ post }) => {
  const dispatch       = useDispatch()
  const currentUser    = useSelector(selectCurrentUser)
  const allComments    = useSelector(selectExpandedComments)

  const [commentText, setCommentText]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [loadingAll, setLoadingAll]     = useState(false)
  const [showAll, setShowAll]           = useState(false)

  const expandedList    = allComments[post.id]
  const displayComments = showAll && expandedList
    ? expandedList
    : (post.recentComments || [])

  const myStudents = useSelector(selectMyStudents);

  const handleSubmit = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    await dispatch(addComment({ postId: post.id, content: commentText.trim() }))
    setCommentText('')
    setSubmitting(false)
  }

  const handleDelete = async (commentId) => {
    await dispatch(deleteComment({ postId: post.id, commentId }))
  }

  const handleLoadAll = async () => {
    setLoadingAll(true)
    await dispatch(fetchAllComments(post.id))
    setShowAll(true)
    setLoadingAll(false)
  }

  const timeAgo = (date) => {
    if (!date) return ''
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return ''
    }
  }

  return (
    <Box>
      <Divider sx={{ mb: 1.5 }} />

      {/* Load all comments button */}
      {!showAll && post.commentCount > (post.recentComments?.length || 0) && (
        <Button
          size="small"
          startIcon={loadingAll ? <CircularProgress size={14} /> : <ExpandIcon />}
          onClick={handleLoadAll}
          disabled={loadingAll}
          sx={{ mb: 1.5, color: 'primary.main', fontSize: 12 }}
        >
          View all {post.commentCount} comments
        </Button>
      )}

      {/* Comments list */}
      {displayComments.map((comment) => {
        const isOwn = comment.authorId === currentUser?.id

        const isPostOwner = post.ownedByCurrentUser

        const isCommentAuthorMyStudent = myStudents.some(
            student => student.id === comment.authorId
        )

      const canDelete =
          isOwn ||
          isPostOwner ||
        (
          currentUser?.role === 'ROLE_TEACHER' &&
          isCommentAuthorMyStudent
        )

        return (
          <Box
            key={comment.id}
            sx={{ display: 'flex', gap: 1, mb: 1.5 }}
          >
            <Avatar
              src={comment.authorAvatarUrl}
              sx={{
                width: 32, height: 32, fontSize: 13,
                bgcolor: 'secondary.main', flexShrink: 0,
              }}
            >
              {comment.authorFullName?.[0]}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  px: 1.5, py: 1,
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {comment.authorFullName}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {timeAgo(comment.createdAt)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}
                >
                  {comment.content}
                </Typography>
              </Box>
            </Box>

            {/* Delete button */}
            {canDelete && (
              <Tooltip title="Delete comment">
                <IconButton
                  size="small"
                  onClick={() => handleDelete(comment.id)}
                  sx={{
                    color: 'text.disabled', alignSelf: 'flex-start', mt: 0.5,
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })}

      {displayComments.length === 0 && post.commentCount === 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mb: 1.5, display: 'block' }}>
          No comments yet. Be the first!
        </Typography>
      )}

      {/* Add comment input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
        <Avatar
          src={currentUser?.avatarUrl}
          sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main', flexShrink: 0 }}
        >
          {currentUser?.firstName?.[0]}
        </Avatar>
        <TextField
          fullWidth
          size="small"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => {
            if (e.target.value.length <= 500) setCommentText(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          InputProps={{
            endAdornment: commentText && (
              <Tooltip title="Send (Enter)">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? <CircularProgress size={14} />
                    : <SendIcon sx={{ fontSize: 18 }} />
                  }
                </IconButton>
              </Tooltip>
            ),
          }}
        />
      </Box>
    </Box>
  )
}

export default CommentSection
