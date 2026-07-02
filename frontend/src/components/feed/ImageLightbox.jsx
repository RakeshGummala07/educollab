import { useState } from 'react'
import {
  Dialog, DialogContent, Box, IconButton,
  Typography, Fade,
} from '@mui/material'
import {
  Close as CloseIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material'

const ImageLightbox = ({ images, initialIndex = 0, open, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom]                 = useState(1)

  if (!images || images.length === 0) return null

  const handlePrev = () => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
    setZoom(1)
  }

  const handleNext = () => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))
    setZoom(1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  handlePrev()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape')     onClose()
  }

  const currentImage = images[currentIndex]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.95)',
          boxShadow: 'none',
          maxWidth: '95vw',
          maxHeight: '95vh',
          m: 1,
        },
      }}
      TransitionComponent={Fade}
    >
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          bgcolor: 'transparent',
          overflow: 'hidden',
          minHeight: '80vh',
        }}
      >
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            color: 'white', bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Zoom controls */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10, display: 'flex', gap: 0.5 }}>
          <IconButton
            onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            size="small"
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            size="small"
          >
            <ZoomOutIcon />
          </IconButton>
        </Box>

        {/* Prev arrow */}
        {images.length > 1 && (
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute', left: 8, zIndex: 10,
              color: 'white', bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <PrevIcon />
          </IconButton>
        )}

        {/* Image */}
        <Box
          component="img"
          src={currentImage.url}
          alt={currentImage.originalName || 'Image'}
          sx={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease',
            cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
            borderRadius: 1,
          }}
          onClick={() => setZoom(z => z > 1 ? 1 : 2)}
        />

        {/* Next arrow */}
        {images.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute', right: 8, zIndex: 10,
              color: 'white', bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <NextIcon />
          </IconButton>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute', bottom: 12,
              left: '50%', transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
              px: 2, py: 0.5, borderRadius: 3,
            }}
          >
            <Typography variant="caption">
              {currentIndex + 1} / {images.length}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImageLightbox
