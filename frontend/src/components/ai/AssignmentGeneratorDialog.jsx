import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, CircularProgress, Alert, Typography, Paper, Select,
  InputLabel, FormControl, List, ListItem, ListItemText, Chip,
} from '@mui/material'
import { generateAssignmentThunk, clearToolResults } from '../../store/slices/aiSlice'

const AssignmentGeneratorDialog = ({ open, onClose, documents }) => {
  const dispatch = useDispatch()
  const { assignmentResult, toolLoading, toolError } = useSelector((s) => s.ai)

  const [topic, setTopic] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [numTasks, setNumTasks] = useState(5)

  const handleGenerate = () => {
    if (!topic.trim()) return
    dispatch(generateAssignmentThunk({ topic, documentId: documentId || null, numTasks }))
  }

  const handleClose = () => {
    dispatch(clearToolResults())
    setTopic('')
    onClose()
  }

  const readyDocs = documents.filter((d) => d.status === 'READY')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Assignment Generator</DialogTitle>
      <DialogContent>
        {!assignmentResult && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {toolError && <Alert severity="error">{toolError}</Alert>}
            <TextField label="Topic" fullWidth value={topic} onChange={(e) => setTopic(e.target.value)} />
            {readyDocs.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Source document (optional)</InputLabel>
                <Select value={documentId} label="Source document (optional)" onChange={(e) => setDocumentId(e.target.value)}>
                  <MenuItem value="">None — use general knowledge</MenuItem>
                  {readyDocs.map((d) => <MenuItem key={d.id} value={d.id}>{d.fileName}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Number of tasks" type="number" value={numTasks}
              onChange={(e) => setNumTasks(Number(e.target.value))}
              inputProps={{ min: 1, max: 15 }}
            />
          </Stack>
        )}

        {toolLoading && (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        )}

        {assignmentResult && !toolLoading && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700}>{assignmentResult.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {assignmentResult.overview}
              </Typography>
              {assignmentResult.estimatedDuration && (
                <Chip size="small" label={`Est. ${assignmentResult.estimatedDuration}`} sx={{ mt: 1 }} />
              )}
            </Paper>
            <List>
              {assignmentResult.tasks.map((t, idx) => (
                <ListItem key={idx} alignItems="flex-start" sx={{ pl: 0 }}>
                  <ListItemText
                    primary={`${idx + 1}. ${t.task}`}
                    secondary={t.details}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">Close</Button>
        {!assignmentResult && (
          <Button onClick={handleGenerate} variant="contained" disabled={!topic.trim() || toolLoading}>
            Generate Assignment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default AssignmentGeneratorDialog
