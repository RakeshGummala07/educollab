import { useState, useRef, useCallback } from 'react'
import {
  Box, Typography, IconButton, LinearProgress,
  Chip, Stack, Tooltip,
} from '@mui/material'
import {
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'
import { mediaApi } from '../../api/mediaApi'

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEOS = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
const MAX_FILES = 4

const MediaUploader = ({ onMediaChange, disabled = false }) => {
  const [uploadedMedia, setUploadedMedia] = useState([])
  const [uploading, setUploading]         = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError]                 = useState('')
  const [isDragging, setIsDragging]       = useState(false)
  const imageInputRef = useRef()
  const videoInputRef = useRef()

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    if (uploadedMedia.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    setError('')
    setUploading(true)
    setUploadProgress(0)

    const newMedia = []

    for (const file of Array.from(files)) {
      const isImage = ALLOWED_IMAGES.includes(file.type)
      const isVideo = ALLOWED_VIDEOS.includes(file.type)

      if (!isImage && !isVideo) {
        setError(`${file.name}: Unsupported file type`)
        continue
      }

      try {
        let res
        if (isImage) {
          res = await mediaApi.uploadImage(file, (p) => setUploadProgress(p))
        } else {
          res = await mediaApi.uploadVideo(file, (p) => setUploadProgress(p))
        }

        newMedia.push({
          url:          res.data.data.url,
          type:         res.data.data.type,
          originalName: res.data.data.originalName,
          size:         file.size,
          preview:      isImage ? URL.createObjectURL(file) : null,
        })
      } catch (err) {
        setError(err.response?.data?.message || `Failed to upload ${file.name}`)
      }
    }

    const updated = [...uploadedMedia, ...newMedia]
    setUploadedMedia(updated)
    onMediaChange(updated)
    setUploading(false)
    setUploadProgress(0)
  }, [uploadedMedia, onMediaChange])

  const removeMedia = (index) => {
    const updated = uploadedMedia.filter((_, i) => i !== index)
    setUploadedMedia(updated)
    onMediaChange(updated)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Box>
      {/* Drag and drop zone */}
      {uploadedMedia.length < MAX_FILES && (
        <Box
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            bgcolor: isDragging ? 'primary.50' : 'background.default',
            transition: 'all 0.2s',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          ) : (
            <>
              <UploadIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Drag & drop files here or
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                <Tooltip title="Upload Image (JPEG, PNG, GIF, WebP — max 10MB)">
                  <Chip
                    icon={<ImageIcon />}
                    label="Add Image"
                    size="small"
                    onClick={() => !disabled && imageInputRef.current?.click()}
                    color="primary"
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                </Tooltip>
                <Tooltip title="Upload Video (MP4, MOV — max 50MB)">
                  <Chip
                    icon={<VideoIcon />}
                    label="Add Video"
                    size="small"
                    onClick={() => !disabled && videoInputRef.current?.click()}
                    color="secondary"
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              </Stack>
            </>
          )}
        </Box>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* Preview grid */}
      {uploadedMedia.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: uploadedMedia.length === 1 ? '1fr' : 'repeat(2, 1fr)',
            gap: 1,
            mt: 1.5,
          }}
        >
          {uploadedMedia.map((media, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'grey.100',
                aspectRatio: '16/9',
              }}
            >
              {media.type === 'image' && media.preview ? (
                <Box
                  component="img"
                  src={media.preview}
                  alt={media.originalName}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <VideoIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '90%' }}>
                    {media.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatSize(media.size)}
                  </Typography>
                </Box>
              )}

              {/* Remove button */}
              <IconButton
                size="small"
                onClick={() => removeMedia(index)}
                sx={{
                  position: 'absolute', top: 4, right: 4,
                  bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  width: 24, height: 24,
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>

              {/* Type badge */}
              <Chip
                label={media.type}
                size="small"
                sx={{
                  position: 'absolute', bottom: 4, left: 4,
                  height: 18, fontSize: 10,
                  bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default MediaUploader
