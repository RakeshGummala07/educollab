import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Card, CardContent, Avatar, TextField,
  Button, Collapse, Divider, CircularProgress,
  Alert, Stack,
} from '@mui/material'
import {
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import { createPost, selectFeedCreating, selectFeedError, clearError } from '../../store/slices/feedSlice'
import { selectCurrentUser } from '../../store/slices/authSlice'
import MediaUploader from '../media/MediaUploader'

const CreatePost = () => {
  const dispatch    = useDispatch()
  const user        = useSelector(selectCurrentUser)
  const isCreating  = useSelector(selectFeedCreating)
  const error       = useSelector(selectFeedError)

  const [content, setContent]           = useState('')
  const [expanded, setExpanded]         = useState(false)
  const [mediaAttachments, setMedia]    = useState([])
  const [showMedia, setShowMedia]       = useState(false)
  const charCount = content.length
  const maxChars  = 2000

  const handleSubmit = async () => {
    if (!content.trim()) return

    const postData = {
      content: content.trim(),
      mediaAttachments: mediaAttachments.map(m => ({
        url:          m.url,
        type:         m.type,
        originalName: m.originalName,
        size:         m.size,
      })),
    }

    const result = await dispatch(createPost(postData))
    if (createPost.fulfilled.match(result)) {
      setContent('')
      setMedia([])
      setShowMedia(false)
      setExpanded(false)
    }
  }

  const handleFocus = () => setExpanded(true)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        {/* Composer row */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              fontWeight: 700, fontSize: 16,
            }}
          >
            {user?.firstName?.[0]}
          </Avatar>

          <TextField
            fullWidth
            multiline
            minRows={expanded ? 3 : 1}
            maxRows={8}
            placeholder={`What's on your mind, ${user?.firstName}?`}
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) setContent(e.target.value)
            }}
            onFocus={handleFocus}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.default',
              },
            }}
          />
        </Box>

        {/* Expanded controls */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5, ml: '52px' }}>

            {/* Media uploader */}
            {showMedia && (
              <Box sx={{ mb: 1.5 }}>
                <MediaUploader
                  onMediaChange={setMedia}
                  disabled={isCreating}
                />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => dispatch(clearError())}>
                {error}
              </Alert>
            )}

            <Divider sx={{ mb: 1.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Media toggle buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => setShowMedia(!showMedia)}
                  color={showMedia ? 'primary' : 'inherit'}
                  variant={showMedia ? 'contained' : 'text'}
                  sx={{ fontSize: 12 }}
                >
                  Photo/Video
                </Button>
              </Stack>

              {/* Char count + submit */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={(charCount / maxChars) * 100}
                    size={28}
                    thickness={4}
                    sx={{
                      color: charCount > maxChars * 0.9 ? 'error.main'
                           : charCount > maxChars * 0.7 ? 'warning.main'
                           : 'primary.main',
                    }}
                  />
                  {charCount > maxChars * 0.8 && (
                    <Box sx={{ position: 'absolute' }}>
                      <Box
                        component="span"
                        sx={{ fontSize: 9, color: 'text.secondary', fontWeight: 600 }}
                      >
                        {maxChars - charCount}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  endIcon={isCreating ? null : <SendIcon />}
                  onClick={handleSubmit}
                  disabled={!content.trim() || isCreating}
                  sx={{ minWidth: 80 }}
                >
                  {isCreating
                    ? <CircularProgress size={16} color="inherit" />
                    : 'Post'
                  }
                </Button>
              </Stack>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default CreatePost
