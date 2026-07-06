import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  List, ListItem, ListItemText, Chip, Stack, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box,
} from '@mui/material'
import { toast } from 'react-toastify'
import { resolveReportAdmin, dismissReportAdmin } from '../../store/slices/adminSlice'
import { formatDistanceToNow } from 'date-fns'

const REASON_LABELS = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment or bullying',
  INAPPROPRIATE_CONTENT: 'Inappropriate content',
  MISINFORMATION: 'Misinformation',
  OTHER: 'Other',
}

const STATUS_COLORS = { PENDING: 'warning', RESOLVED: 'success', DISMISSED: 'default' }

const ReportsQueuePanel = ({ reports }) => {
  const dispatch = useDispatch()
  const [actionDialog, setActionDialog] = useState(null) // { report, type: 'resolve'|'dismiss' }
  const [notes, setNotes] = useState('')

  const submit = async () => {
    const { report, type } = actionDialog
    const thunk = type === 'resolve' ? resolveReportAdmin : dismissReportAdmin
    const result = await dispatch(thunk({ reportId: report.id, notes }))
    if (result.meta.requestStatus === 'fulfilled') toast.success(`Report ${type}d`)
    else toast.error(result.payload || 'Action failed')
    setActionDialog(null)
    setNotes('')
  }

  return (
    <>
      <List>
        {reports.map((r) => (
          <ListItem key={r.id} divider alignItems="flex-start"
            secondaryAction={
              r.status === 'PENDING' && (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={() => setActionDialog({ report: r, type: 'resolve' })}>
                    Resolve
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setActionDialog({ report: r, type: 'dismiss' })}>
                    Dismiss
                  </Button>
                </Stack>
              )
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>
                    {r.reportedUserName}
                  </Typography>
                  <Chip size="small" label={r.contentType} variant="outlined" />
                  <Chip size="small" label={REASON_LABELS[r.reason]} />
                  <Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} />
                </Stack>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    "{r.contentSnapshot}"
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reported by {r.reporterName} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    {r.description && ` · "${r.description}"`}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
        {reports.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No reports here.
          </Typography>
        )}
      </List>

      <Dialog open={!!actionDialog} onClose={() => setActionDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionDialog?.type === 'resolve' ? 'Resolve report' : 'Dismiss report'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline rows={3} sx={{ mt: 1 }}
            label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionDialog(null)} variant="outlined">Cancel</Button>
          <Button onClick={submit} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReportsQueuePanel
