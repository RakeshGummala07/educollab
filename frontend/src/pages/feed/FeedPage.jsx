import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Alert, Button, Divider } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import {
  fetchFeed, fetchMorePosts, clearFeed,
  selectPosts, selectFeedLoading, selectFeedLoadingMore,
  selectFeedHasMore, selectFeedPage, selectFeedError,
  selectActiveFilter, selectIsSearching,
} from '../../store/slices/feedSlice'
import MainLayout       from '../../components/layout/MainLayout'
import CreatePost       from '../../components/feed/CreatePost'
import PostCard         from '../../components/feed/PostCard'
import EditPostDialog   from '../../components/feed/EditPostDialog'
import FeedFilters      from '../../components/feed/FeedFilters'
import PostSearch       from '../../components/feed/PostSearch'
import { PostSkeletonList } from '../../components/feed/PostSkeleton'
import { useState } from 'react'
import { CircularProgress } from '@mui/material'

const FeedPage = () => {
  const dispatch      = useDispatch()
  const posts         = useSelector(selectPosts)
  const isLoading     = useSelector(selectFeedLoading)
  const isLoadingMore = useSelector(selectFeedLoadingMore)
  const hasMore       = useSelector(selectFeedHasMore)
  const currentPage   = useSelector(selectFeedPage)
  const error         = useSelector(selectFeedError)
  const activeFilter  = useSelector(selectActiveFilter)
  const isSearching   = useSelector(selectIsSearching)

  const [editPost, setEditPost] = useState(null)

  // Initial load
  useEffect(() => {
    dispatch(clearFeed())
    dispatch(fetchFeed({ page: 0, size: 10, filter: 'all' }))
  }, [dispatch])

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (isSearching) return
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (
      scrollHeight - scrollTop <= clientHeight + 400 &&
      hasMore && !isLoadingMore && !isLoading
    ) {
      dispatch(fetchMorePosts({ page: currentPage + 1, size: 10, filter: activeFilter }))
    }
  }, [dispatch, hasMore, isLoadingMore, isLoading, currentPage, activeFilter, isSearching])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleRefresh = () => {
    dispatch(clearFeed())
    dispatch(fetchFeed({ page: 0, size: 10, filter: activeFilter }))
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 680, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Feed</Typography>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>

        {/* Search */}
        <PostSearch />

        {/* Filters (hidden during search) */}
        {!isSearching && <FeedFilters />}

        {/* Create post */}
        {!isSearching && (
          <>
            <CreatePost />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* Loading skeletons */}
        {isLoading && <PostSkeletonList count={3} />}

        {/* Empty state */}
        {!isLoading && posts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isSearching ? 'No posts match your search' : 'No posts yet'}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {isSearching
                ? 'Try different keywords'
                : 'Be the first to share something!'
              }
            </Typography>
          </Box>
        )}

        {/* Posts list */}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={(p) => setEditPost(p)}
          />
        ))}

        {/* Load more spinner */}
        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {/* End of feed */}
        {!hasMore && posts.length > 0 && !isSearching && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.disabled">
              You've seen all posts ✓
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit dialog */}
      <EditPostDialog
        post={editPost}
        open={Boolean(editPost)}
        onClose={() => setEditPost(null)}
      />
    </MainLayout>
  )
}

export default FeedPage
