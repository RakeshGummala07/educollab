import { Box, Typography } from '@mui/material'

const TypingIndicator = ({ typingUsers }) => {
  const names = Object.values(typingUsers || {}).map(u => u.fullName)
  if (names.length === 0) return null

  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names.length} people are typing`

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5 }}>
      <Box sx={{ display: 'flex', gap: 0.4 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6, height: 6, borderRadius: '50%',
              bgcolor: 'text.disabled',
              animation: 'typingBounce 1.2s infinite',
              animationDelay: `${i * 0.15}s`,
              '@keyframes typingBounce': {
                '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                '30%': { transform: 'translateY(-4px)', opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
        {text}
      </Typography>
    </Box>
  )
}

export default TypingIndicator
