import { Box, Stack, Typography, LinearProgress, Tooltip } from '@mui/material'
import { useCountdown, formatCountdown } from '../../hooks/useCountdown'

const TokenUsageIndicator = ({ usage }) => {
  const windowCountdown = useCountdown(usage?.windowResetAt)
  const dailyCountdown = useCountdown(usage?.dailyResetAt)

  if (!usage) return null

  const windowPercent = Math.min(100, (usage.tokensUsedInWindow / usage.windowTokenLimit) * 100)
  const dailyPercent = Math.min(100, (usage.tokensUsedToday / usage.dailyTokenLimit) * 100)
  const color = usage.exhausted ? 'error' : windowPercent > 80 ? 'warning' : 'primary'

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption" display="block">
            5-hour window: {usage.tokensUsedInWindow.toLocaleString()} / {usage.windowTokenLimit.toLocaleString()} tokens
            {' · resets in '}{formatCountdown(windowCountdown)}
          </Typography>
          <Typography variant="caption" display="block">
            Today: {usage.tokensUsedToday.toLocaleString()} / {usage.dailyTokenLimit.toLocaleString()} tokens
            {' · resets in '}{formatCountdown(dailyCountdown)}
          </Typography>
        </Box>
      }
    >
      <Stack spacing={0.5} sx={{ minWidth: 160, cursor: 'default' }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            AI Tokens
          </Typography>
          <Typography variant="caption" color={usage.exhausted ? 'error.main' : 'text.secondary'}>
            {usage.exhausted ? `Resets in ${formatCountdown(windowCountdown)}` : `${Math.round(100 - windowPercent)}% left`}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={windowPercent}
          color={color}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Stack>
    </Tooltip>
  )
}

export default TokenUsageIndicator
