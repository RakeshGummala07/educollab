import { useDispatch, useSelector } from 'react-redux'
import { Box, Tabs, Tab, Chip } from '@mui/material'
import {
  Public as AllIcon,
  School as TeacherIcon,
  Person as MineIcon,
} from '@mui/icons-material'
import {
  setFilter, clearFeed, fetchFeed,
  selectActiveFilter, selectTotalPosts,
} from '../../store/slices/feedSlice'

const filters = [
  { value: 'all',      label: 'All Posts',      icon: <AllIcon fontSize="small" /> },
  { value: 'teachers', label: 'Teachers',        icon: <TeacherIcon fontSize="small" /> },
  { value: 'mine',     label: 'My Posts',        icon: <MineIcon fontSize="small" /> },
]

const FeedFilters = () => {
  const dispatch      = useDispatch()
  const activeFilter  = useSelector(selectActiveFilter)
  const totalPosts    = useSelector(selectTotalPosts)

  const handleChange = (_, newValue) => {
    dispatch(setFilter(newValue))
    dispatch(clearFeed())
    dispatch(fetchFeed({ page: 0, size: 10, filter: newValue }))
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        overflow: 'hidden',
      }}
    >
      <Tabs
        value={activeFilter}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: 13 },
          '& .Mui-selected': { fontWeight: 700 },
        }}
      >
        {filters.map((f) => (
          <Tab
            key={f.value}
            value={f.value}
            icon={f.icon}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {f.label}
                {f.value === 'all' && totalPosts > 0 && (
                  <Chip
                    label={totalPosts}
                    size="small"
                    sx={{ height: 18, fontSize: 10, ml: 0.5 }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  )
}

export default FeedFilters
