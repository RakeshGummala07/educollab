import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, TextField, InputAdornment, IconButton,
  Chip, CircularProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  searchPosts, fetchFeed, clearFeed,
  selectFeedLoading, selectSearchQuery,
  selectIsSearching, selectTotalPosts,
  setSearchQuery,
} from '../../store/slices/feedSlice'

const PostSearch = () => {
  const dispatch     = useDispatch()
  const isLoading    = useSelector(selectFeedLoading)
  const searchQuery  = useSelector(selectSearchQuery)
  const isSearching  = useSelector(selectIsSearching)
  const totalPosts   = useSelector(selectTotalPosts)

  const [localQuery, setLocalQuery] = useState('')
  const debounceRef = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    setLocalQuery(val)
    dispatch(setSearchQuery(val))

    clearTimeout(debounceRef.current)
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        dispatch(searchPosts({ q: val.trim() }))
      }, 500)
    } else if (val.trim() === '') {
      handleClear()
    }
  }

  const handleClear = () => {
    setLocalQuery('')
    dispatch(clearFeed())
    dispatch(fetchFeed({ page: 0, size: 10, filter: 'all' }))
  }

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search posts..."
        value={localQuery}
        onChange={handleChange}
        sx={{
          '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isLoading && isSearching
                ? <CircularProgress size={18} />
                : <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              }
            </InputAdornment>
          ),
          endAdornment: localQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Search results info */}
      {isSearching && searchQuery && !isLoading && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${totalPosts} result${totalPosts !== 1 ? 's' : ''} for "${searchQuery}"`}
            size="small"
            onDelete={handleClear}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  )
}

export default PostSearch
