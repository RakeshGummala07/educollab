import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Stack, Box,
} from '@mui/material'
import { HourglassTop as HourglassIcon } from '@mui/icons-material'
import { useCountdown, formatCountdown } from '../../hooks/useCountdown'
import { clearQuotaExceeded, fetchUsage } from '../../store/slices/aiSlice'

const TokenLimitModal = ({ quotaExceeded }) => {
  const dispatch = useDispatch()
  const countdown = useCountdown(quotaExceeded?.resetAt)

  // Once the countdown hits zero, refresh usage in the background so the
  // modal's own "Try again" button reflects reality immediately.
  useEffect(() => {
    if (quotaExceeded && countdown.expired) {
      dispatch(fetchUsage())
    }
  }, [countdown.expired, quotaExceeded, dispatch])

  if (!quotaExceeded) return null

  return (
    <Dialog open={!!quotaExceeded} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '50%', bgcolor: 'warning.50',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
        }}>
          <HourglassIcon sx={{ fontSize: 32, color: 'warning.main' }} />
        </Box>
        You've used all your AI tokens
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary">
            {quotaExceeded.dailyExhausted
              ? "You've reached today's daily AI usage limit."
              : "You've used your AI tokens for this 5-hour window."}
          </Typography>
          <Typography variant="h5" fontWeight={700} color={countdown.expired ? 'success.main' : 'text.primary'}>
            {countdown.expired ? 'Ready to try again' : formatCountdown(countdown)}
          </Typography>
          {!countdown.expired && (
            <Typography variant="caption" color="text.secondary">
              Resets at {new Date(quotaExceeded.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          disabled={!countdown.expired}
          onClick={() => dispatch(clearQuotaExceeded())}
        >
          {countdown.expired ? 'Continue' : 'Please wait…'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TokenLimitModal
