import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, TextField, Alert, CircularProgress,
} from '@mui/material'
import reportApi from '../../api/reportApi'
import { toast } from 'react-toastify'

const REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'OTHER', label: 'Other' },
]

// contentType: 'POST' | 'COMMENT' | 'MESSAGE'
// contentId: the post id (or message id) — for COMMENT, also pass commentId
const ReportContentDialog = ({ open, onClose, contentType, contentId, commentId }) => {
  const [reason, setReason] = useState('SPAM')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await reportApi.submitReport({ contentType, contentId, commentId, reason, description })
      toast.success('Report submitted — a teacher will review it')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Report content</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <FormControlLabel key={r.value} value={r.value} control={<Radio size="small" />} label={r.label} />
          ))}
        </RadioGroup>
        <TextField
          fullWidth multiline rows={3} placeholder="Add details (optional)"
          value={description} onChange={(e) => setDescription(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Submit report'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReportContentDialog
