import { Box, Typography, Chip } from '@mui/material'
import { Construction as ConstructionIcon } from '@mui/icons-material'
import MainLayout from '../layout/MainLayout'

const ComingSoon = ({ title, day }) => (
  <MainLayout>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
               justifyContent: 'center', minHeight: '60vh', gap: 2, textAlign: 'center', p: 3 }}>
      <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#EEF2FF',
                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Chip label={`Coming on Day ${day}`} color="primary" />
      <Typography color="text.secondary" maxWidth={400}>
        This feature is being built. Check back when Day {day} is complete.
      </Typography>
    </Box>
  </MainLayout>
)

export default ComingSoon
