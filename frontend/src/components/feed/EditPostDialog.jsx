import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress,
} from '@mui/material'
import { updatePost } from '../../store/slices/feedSlice'

const EditPostDialog = ({ post, open, onClose }) => {
  const dispatch  = useDispatch()
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (post) setContent(post.content)
  }, [post])

  const handleSave = async () => {
    if (!content.trim()) return
    setLoading(true)
    const result = await dispatch(updatePost({ postId: post.id, data: { content } }))
    setLoading(false)
    if (updatePost.fulfilled.match(result)) onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Post</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth multiline rows={4}
          value={content}
          onChange={(e) => e.target.value.length <= 2000 && setContent(e.target.value)}
          placeholder="What's on your mind?"
          sx={{ mt: 1 }}
          helperText={`${content.length}/2000`}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!content.trim() || loading}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditPostDialog
