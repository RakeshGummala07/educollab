import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, CircularProgress, Alert, Typography, Paper, Select,
  InputLabel, FormControl, List, ListItem, ToggleButton, ToggleButtonGroup,
} from '@mui/material'
import { summarizeThunk, clearToolResults } from '../../store/slices/aiSlice'

const SummarizerDialog = ({ open, onClose, documents }) => {
  const dispatch = useDispatch()
  const { summaryResult, toolLoading, toolError } = useSelector((s) => s.ai)

  const [mode, setMode] = useState('text') // 'text' | 'document'
  const [rawText, setRawText] = useState('')
  const [documentId, setDocumentId] = useState('')

  const handleGenerate = () => {
    if (mode === 'text' && !rawText.trim()) return
    if (mode === 'document' && !documentId) return
    dispatch(summarizeThunk(mode === 'text' ? { rawText } : { documentId }))
  }

  const handleClose = () => {
    dispatch(clearToolResults())
    setRawText('')
    setDocumentId('')
    onClose()
  }

  const readyDocs = documents.filter((d) => d.status === 'READY')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Notes Summarizer</DialogTitle>
      <DialogContent>
        {!summaryResult && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {toolError && <Alert severity="error">{toolError}</Alert>}
            <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} size="small">
              <ToggleButton value="text">Paste text</ToggleButton>
              <ToggleButton value="document" disabled={readyDocs.length === 0}>Use uploaded document</ToggleButton>
            </ToggleButtonGroup>

            {mode === 'text' ? (
              <TextField
                label="Paste notes or text to summarize" multiline rows={8} fullWidth
                value={rawText} onChange={(e) => setRawText(e.target.value)}
              />
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Document</InputLabel>
                <Select value={documentId} label="Document" onChange={(e) => setDocumentId(e.target.value)}>
                  {readyDocs.map((d) => <MenuItem key={d.id} value={d.id}>{d.fileName}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Stack>
        )}

        {toolLoading && (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        )}

        {summaryResult && !toolLoading && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2">{summaryResult.summary}</Typography>
            </Paper>
            <Typography variant="subtitle2" fontWeight={700}>Key points</Typography>
            <List dense>
              {summaryResult.keyPoints.map((point, idx) => (
                <ListItem key={idx} sx={{ pl: 0 }}>
                  <Typography variant="body2">• {point}</Typography>
                </ListItem>
              ))}
            </List>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">Close</Button>
        {!summaryResult && (
          <Button
            onClick={handleGenerate} variant="contained" disabled={toolLoading}
          >
            Summarize
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SummarizerDialog
