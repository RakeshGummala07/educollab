import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Stack, TextField, IconButton, Typography, Drawer,
  CircularProgress, Tooltip, Switch, FormControlLabel,
  useMediaQuery, useTheme, Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material'
import {
  Send as SendIcon, Description as DocIcon, Quiz as QuizIcon,
  Assignment as AssignmentIcon, Summarize as SummarizeIcon, SmartToy as BotIcon,
  ArrowBack as BackIcon, MoreVert as MoreIcon,
} from '@mui/icons-material'
import MainLayout from '../../components/layout/MainLayout'
import ConversationSidebar from '../../components/ai/ConversationSidebar'
import ChatMessageBubble from '../../components/ai/ChatMessageBubble'
import DocumentUploadPanel from '../../components/ai/DocumentUploadPanel'
import TokenUsageIndicator from '../../components/ai/TokenUsageIndicator'
import TokenLimitModal from '../../components/ai/TokenLimitModal'
import QuizGeneratorDialog from '../../components/ai/QuizGeneratorDialog'
import AssignmentGeneratorDialog from '../../components/ai/AssignmentGeneratorDialog'
import SummarizerDialog from '../../components/ai/SummarizerDialog'
import {
  fetchConversations, fetchUsage, fetchDocuments, sendChatMessage, setActiveConversation,
} from '../../store/slices/aiSlice'

const AiAssistantPage = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    conversations, activeConversationId, messages, sendLoading,
    documents, usage, quotaExceeded,
  } = useSelector((s) => s.ai)

  const [input, setInput] = useState('')
  const [useDocContext, setUseDocContext] = useState(true)
  const [docsOpen, setDocsOpen] = useState(false)
  const [activeTool, setActiveTool] = useState(null) // 'quiz' | 'assignment' | 'summary'
  const [showListMobile, setShowListMobile] = useState(true)
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    dispatch(fetchConversations())
    dispatch(fetchUsage())
    dispatch(fetchDocuments())
  }, [dispatch])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Selecting a conversation (from ConversationSidebar) or starting a new
  // one should switch to the chat pane on mobile, same as ChatPage does.
  useEffect(() => {
    if (isMobile && activeConversationId) setShowListMobile(false)
  }, [activeConversationId, isMobile])

  const handleSend = () => {
    if (!input.trim() || sendLoading || quotaExceeded) return
    dispatch(sendChatMessage({
      conversationId: activeConversationId, message: input.trim(), useDocumentContext: useDocContext,
    }))
    setInput('')
  }

  const handleNewChatMobile = () => {
    dispatch(setActiveConversation(null))
    setShowListMobile(false)
  }

  const openTool = (tool) => {
    setActiveTool(tool)
    setToolsMenuAnchor(null)
  }

  return (
    <MainLayout>
      <Stack direction="row" sx={{ height: 'calc(100vh - 0px)' }}>
        {/* Sidebar — full width on mobile (toggled), fixed width on desktop */}
        <Box
          sx={{
            width: { xs: '100%', md: 260 },
            display: { xs: showListMobile ? 'block' : 'none', md: 'block' },
            flexShrink: 0,
            height: '100%',
          }}
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNewChatMobile={isMobile ? handleNewChatMobile : undefined}
          />
        </Box>

        {/* Chat pane — hidden on mobile while the sidebar is showing */}
        <Box sx={{
          flex: 1, display: { xs: showListMobile ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column', minWidth: 0,
        }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center"
            sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              {isMobile && (
                <IconButton size="small" onClick={() => setShowListMobile(true)}>
                  <BackIcon />
                </IconButton>
              )}
              <BotIcon color="primary" sx={{ flexShrink: 0 }} />
              <Typography variant="h6" fontWeight={700} noWrap>AI Study Assistant</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              {!isMobile && <TokenUsageIndicator usage={usage} />}

              {isMobile ? (
                <>
                  <IconButton onClick={(e) => setToolsMenuAnchor(e.currentTarget)}>
                    <MoreIcon />
                  </IconButton>
                  <Menu anchorEl={toolsMenuAnchor} open={!!toolsMenuAnchor} onClose={() => setToolsMenuAnchor(null)}>
                    <MenuItem onClick={() => openTool('quiz')}>
                      <ListItemIcon><QuizIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>Quiz Generator</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => openTool('assignment')}>
                      <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>Assignment Generator</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => openTool('summary')}>
                      <ListItemIcon><SummarizeIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>Notes Summarizer</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { setDocsOpen(true); setToolsMenuAnchor(null) }}>
                      <ListItemIcon><DocIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>My Documents</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Tooltip title="Quiz Generator">
                    <IconButton onClick={() => setActiveTool('quiz')}><QuizIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Assignment Generator">
                    <IconButton onClick={() => setActiveTool('assignment')}><AssignmentIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Notes Summarizer">
                    <IconButton onClick={() => setActiveTool('summary')}><SummarizeIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="My Documents">
                    <IconButton onClick={() => setDocsOpen(true)}><DocIcon /></IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>

          {isMobile && (
            <Box sx={{ px: 1.5, pt: 1 }}>
              <TokenUsageIndicator usage={usage} />
            </Box>
          )}

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, md: 3 } }}>
            {messages.length === 0 && (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: 'text.secondary', textAlign: 'center', px: 2 }}>
                <BotIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                <Typography>Ask me anything about your studies, or upload a PDF to chat with it.</Typography>
              </Stack>
            )}
            {messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} documents={documents} />
            ))}
            {sendLoading && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 6 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">Thinking…</Typography>
              </Stack>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Composer */}
          <Box sx={{ p: { xs: 1.5, md: 2 }, borderTop: '1px solid', borderColor: 'divider' }}>
            {documents.some((d) => d.status === 'READY') && (
              <FormControlLabel
                sx={{ mb: 0.5 }}
                control={<Switch size="small" checked={useDocContext} onChange={(e) => setUseDocContext(e.target.checked)} />}
                label={<Typography variant="caption">Use my uploaded documents as context</Typography>}
              />
            )}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth multiline maxRows={4} placeholder="Ask a question…"
                value={input} onChange={(e) => setInput(e.target.value)}
                disabled={!!quotaExceeded}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              />
              <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || sendLoading || !!quotaExceeded}>
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Stack>

      {/* Documents drawer */}
      <Drawer anchor="right" open={docsOpen} onClose={() => setDocsOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 320 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ p: 2, pb: 0 }}>My Documents</Typography>
          <DocumentUploadPanel documents={documents} />
        </Box>
      </Drawer>

      {/* Study tool dialogs */}
      <QuizGeneratorDialog open={activeTool === 'quiz'} onClose={() => setActiveTool(null)} documents={documents} />
      <AssignmentGeneratorDialog open={activeTool === 'assignment'} onClose={() => setActiveTool(null)} documents={documents} />
      <SummarizerDialog open={activeTool === 'summary'} onClose={() => setActiveTool(null)} documents={documents} />

      {/* Blocking token-exhausted modal */}
      <TokenLimitModal quotaExceeded={quotaExceeded} />
    </MainLayout>
  )
}

export default AiAssistantPage