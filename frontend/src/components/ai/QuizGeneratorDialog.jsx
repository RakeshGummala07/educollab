import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, CircularProgress, Alert, Typography, Radio, RadioGroup,
  FormControlLabel, Paper, Divider, Select, InputLabel, FormControl,
} from '@mui/material'
import { generateQuizThunk, clearToolResults } from '../../store/slices/aiSlice'

const QuizGeneratorDialog = ({ open, onClose, documents }) => {
  const dispatch = useDispatch()
  const { quizResult, toolLoading, toolError } = useSelector((s) => s.ai)

  const [topic, setTopic] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [revealed, setRevealed] = useState({})

  const handleGenerate = () => {
    if (!topic.trim()) return
    setRevealed({})
    dispatch(generateQuizThunk({
      topic, documentId: documentId || null, numQuestions, difficulty,
    }))
  }

  const handleClose = () => {
    dispatch(clearToolResults())
    setTopic('')
    setRevealed({})
    onClose()
  }

  const readyDocs = documents.filter((d) => d.status === 'READY')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Quiz Generator</DialogTitle>
      <DialogContent>
        {!quizResult && (
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
            <Stack direction="row" spacing={2}>
              <TextField
                label="Questions" type="number" value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                inputProps={{ min: 1, max: 20 }} sx={{ flex: 1 }}
              />
              <TextField
                select label="Difficulty" value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)} sx={{ flex: 1 }}
              >
                <MenuItem value="EASY">Easy</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HARD">Hard</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        )}

        {toolLoading && (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        )}

        {quizResult && !toolLoading && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {quizResult.questions.map((q, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {idx + 1}. {q.question}
                </Typography>
                <RadioGroup
                  value={revealed[idx] ?? ''}
                  onChange={(e) => setRevealed((r) => ({ ...r, [idx]: Number(e.target.value) }))}
                >
                  {q.options.map((opt, oIdx) => {
                    const isAnswered = revealed[idx] !== undefined
                    const isCorrect = oIdx === q.correctOptionIndex
                    return (
                      <FormControlLabel
                        key={oIdx} value={oIdx} control={<Radio size="small" />}
                        label={opt}
                        sx={{
                          color: isAnswered && isCorrect ? 'success.main'
                            : isAnswered && revealed[idx] === oIdx ? 'error.main' : 'text.primary',
                          fontWeight: isAnswered && isCorrect ? 700 : 400,
                        }}
                      />
                    )
                  })}
                </RadioGroup>
                {revealed[idx] !== undefined && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      {q.explanation}
                    </Typography>
                  </>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">Close</Button>
        {!quizResult && (
          <Button onClick={handleGenerate} variant="contained" disabled={!topic.trim() || toolLoading}>
            Generate Quiz
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QuizGeneratorDialog
