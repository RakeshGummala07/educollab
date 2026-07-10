import { Box, Stack, Typography, Avatar, Chip } from '@mui/material'
import { SmartToy as BotIcon, Description as DocIcon } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../store/slices/authSlice'

const ChatMessageBubble = ({ message, documents }) => {
  const currentUser = useSelector(selectCurrentUser)
  const isUser = message.role === 'USER'

  const sourceNames = (message.sourceDocumentIds || [])
    .map((id) => documents.find((d) => d.id === id)?.fileName)
    .filter(Boolean)

  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: isUser ? 'primary.main' : 'secondary.main' }}>
        {isUser ? currentUser?.fullName?.[0] : <BotIcon fontSize="small" />}
      </Avatar>
      <Box sx={{ maxWidth: '75%' }}>
        <Box sx={{
          px: 2, py: 1.25, borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'primary.contrastText' : 'text.primary',
        }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        </Box>
        {sourceNames.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
            {sourceNames.map((name) => (
              <Chip key={name} size="small" icon={<DocIcon />} label={name} variant="outlined" />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

export default ChatMessageBubble
