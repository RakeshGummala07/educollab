import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import MainLayout from '../../components/layout/MainLayout'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'
import NewChatDialog from '../../components/chat/NewChatDialog'
import { selectConversations } from '../../store/slices/chatSlice'

const ChatPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const conversations = useSelector(selectConversations)


  const [activeConvId, setActiveConvId] = useState(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [showListMobile, setShowListMobile] = useState(true)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  const handleSelectConversation = (conv) => {
    setActiveConvId(conv.id)
    setShowListMobile(false)
  }

  const handleConversationReady = (conv) => {
    setActiveConvId(conv.id)
    setShowListMobile(false)
  }

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 0px)', bgcolor: 'background.paper' }}>

        {/* Conversation list panel */}
        <Box
          sx={{
            width: { xs: '100%', md: 340 },
            borderRight: { md: '1px solid' },
            borderColor: 'divider',
            display: { xs: showListMobile ? 'block' : 'none', md: 'block' },
            flexShrink: 0,
          }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{ fontWeight: 700, fontSize: 18 }}>Messages</Box>
            <Tooltip title="New message">
              <IconButton color="primary" onClick={() => setNewChatOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 'calc(100% - 56px)' }}>
            <ConversationList onSelect={handleSelectConversation} />
          </Box>
        </Box>

        {/* Chat window panel */}
        <Box
          sx={{
            flex: 1,
            display: { xs: showListMobile ? 'none' : 'block', md: 'block' },
          }}
        >
          <ChatWindow
            conversation={activeConv}
            onBack={() => setShowListMobile(true)}
          />
        </Box>
      </Box>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onConversationReady={handleConversationReady}
      />
    </MainLayout>
  )
}

export default ChatPage
