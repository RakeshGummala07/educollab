import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Box, Button, List, ListItem, ListItemText, ListItemIcon, IconButton,
  Chip, LinearProgress, Typography, Stack,
} from '@mui/material'
import {
  UploadFile as UploadIcon, PictureAsPdf as PdfIcon, Delete as DeleteIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { uploadDocumentThunk, deleteDocumentThunk } from '../../store/slices/aiSlice'

const STATUS_COLORS = { PROCESSING: 'warning', READY: 'success', FAILED: 'error' }

const DocumentUploadPanel = ({ documents }) => {
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported')
      return
    }

    setUploading(true)
    setProgress(0)
    const result = await dispatch(uploadDocumentThunk({ file, onProgress: setProgress }))
    setUploading(false)
    e.target.value = ''

    if (uploadDocumentThunk.fulfilled.match(result)) {
      toast.success('Document uploaded — processing in the background')
    } else {
      toast.error(result.payload || 'Upload failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return
    await dispatch(deleteDocumentThunk(id))
  }

  return (
    <Box sx={{ p: 2 }}>
      <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileSelect} />
      <Button
        fullWidth variant="outlined" startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        Upload PDF
      </Button>
      {uploading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      <List dense sx={{ mt: 1 }}>
        {documents.map((d) => (
          <ListItem
            key={d.id}
            secondaryAction={
              <IconButton size="small" onClick={() => handleDelete(d.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemIcon sx={{ minWidth: 32 }}><PdfIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText
              primary={d.fileName}
              secondary={
                <Stack direction="row" spacing={0.5} alignItems="center" component="span">
                  <Chip size="small" label={d.status} color={STATUS_COLORS[d.status]} sx={{ height: 18, fontSize: 10 }} />
                  {d.chunkCount != null && (
                    <Typography variant="caption" color="text.secondary" component="span">
                      {d.chunkCount} chunks
                    </Typography>
                  )}
                </Stack>
              }
              primaryTypographyProps={{ fontSize: 13, noWrap: true }}
            />
          </ListItem>
        ))}
        {documents.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No documents uploaded yet
          </Typography>
        )}
      </List>
    </Box>
  )
}

export default DocumentUploadPanel
