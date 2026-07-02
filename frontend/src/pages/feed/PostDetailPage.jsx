import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, CircularProgress, Alert,
  IconButton, Typography,
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { postApi } from '../../api/postApi'
import { useState } from 'react'
import PostCard from '../../components/feed/PostCard'
import EditPostDialog from '../../components/feed/EditPostDialog'
import MainLayout from '../../components/layout/MainLayout'
import { selectCurrentUser } from '../../store/slices/authSlice'

const PostDetailPage = () => {
  const { postId }  = useParams()
  const navigate    = useNavigate()
  const currentUser = useSelector(selectCurrentUser)

  const [post, setPost]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [editPost, setEditPost] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await postApi.getPost(postId)
        setPost(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Post not found')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId])

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 680, mx: 'auto' }}>

        {/* Back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>Post</Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {post && (
          <PostCard
            post={post}
            onEdit={(p) => setEditPost(p)}
          />
        )}

        <EditPostDialog
          post={editPost}
          open={Boolean(editPost)}
          onClose={() => setEditPost(null)}
        />
      </Box>
    </MainLayout>
  )
}

export default PostDetailPage
