import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'

const PostSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="25%" height={16} />
        </Box>
      </Box>

      {/* Content */}
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="90%" height={20} />
      <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1.5 }} />

      {/* Action buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Skeleton variant="rounded" width={70} height={32} />
        <Skeleton variant="rounded" width={90} height={32} />
        <Skeleton variant="rounded" width={70} height={32} />
      </Stack>
    </CardContent>
  </Card>
)

export const PostSkeletonList = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </>
)

export default PostSkeleton
