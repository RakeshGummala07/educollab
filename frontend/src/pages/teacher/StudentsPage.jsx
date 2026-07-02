import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Chip, CircularProgress, Alert, TextField,
  InputAdornment,
} from '@mui/material'
import { Search as SearchIcon, People as PeopleIcon } from '@mui/icons-material'
import { useState } from 'react'
import {
  fetchAllStudents,
  selectStudents,
  selectProfileLoading,
} from '../../store/slices/profileSlice'
import MainLayout from '../../components/layout/MainLayout'

const StudentsPage = () => {
  const dispatch = useDispatch()
  const students = useSelector(selectStudents)
  const isLoading = useSelector(selectProfileLoading)
  const [search, setSearch] = useState('')

  useEffect(() => { dispatch(fetchAllStudents()) }, [dispatch])

  const filtered = students.filter((s) =>
    `${s.fullName} ${s.email} ${s.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#EEF2FF',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     color: 'primary.main' }}>
            <PeopleIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Students</Typography>
            <Typography variant="body2" color="text.secondary">
              {students.length} students enrolled
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <TextField
          fullWidth placeholder="Search students..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info">
            {search ? 'No students match your search.' : 'No students found.'}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filtered.map((student) => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Card sx={{ '&:hover': { boxShadow: '0 4px 20px rgba(37,99,235,0.12)', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Avatar
                      src={student.avatarUrl}
                      sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}
                    >
                      {student.firstName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {student.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        @{student.username}
                      </Typography>
                      {student.institution && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          🏫 {student.institution}
                        </Typography>
                      )}
                      <Chip
                        label={student.accountNonLocked ? 'Active' : 'Locked'}
                        size="small"
                        color={student.accountNonLocked ? 'success' : 'error'}
                        sx={{ mt: 0.5, height: 20, fontSize: 10 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </MainLayout>
  )
}

export default StudentsPage
